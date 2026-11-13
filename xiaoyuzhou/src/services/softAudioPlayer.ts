import { decoder } from "@audio/decode-mp4";
import { generateUUID } from "../../../types/utils";
import { vscode } from "../utils/vscode";
import { messageHandler } from "../utils/messageHandler";
import { readMp4AudioTiming } from "./mp4AudioTiming";

export type AudioEventCallback = (event: Event) => void;

export type PlayableAudio = {
  currentTime: number;
  duration: number;
  paused?: boolean;
  addEventListener: (type: string, listener: any) => void;
  removeEventListener: (type: string, listener: any) => void;
  play?: () => Promise<void> | void;
  pause?: () => void;
};

function spcAt(ci: number, stsc: any[]): number {
  if (!stsc?.length) return 1;
  let spc = 1;
  const cn = ci + 1;
  for (let j = stsc.length - 1; j >= 0; j--) {
    if (cn >= stsc[j].first) {
      spc = stsc[j].spc;
      break;
    }
  }
  return spc;
}

function seekSampleTable(st: any, targetIdx: number) {
  let idx = 0;
  let ci = 0;
  let sInC = 0;
  let spc = spcAt(0, st.stsc);
  let nextOff = st.stco[0];

  while (idx < targetIdx && idx < st.sizes.length) {
    nextOff += st.sizes[idx];
    idx++;
    sInC++;
    if (sInC >= spc && ci + 1 < st.stco.length) {
      ci++;
      sInC = 0;
      spc = spcAt(ci, st.stsc);
      nextOff = st.stco[ci];
    }
  }

  return { idx, ci, sInC, spc, nextOff };
}

function requestExtension<T = any>(command: string, payload: any): Promise<T> {
  const uuid = generateUUID();
  return new Promise<T>((resolve, reject) => {
    messageHandler.addRequest(uuid, resolve, reject, 30000);
    vscode.postMessage({ command, payload, uuid });
  });
}

export class SoftAudioPlayer {
  private audioCtx: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private currentSource: AudioBufferSourceNode | null = null;

  private dec: any = null;
  private timing: ReturnType<typeof readMp4AudioTiming>;
  private url: string = "";
  private loadId = 0;

  // PCM 缓存与时间对齐
  private pcmChannels: Float32Array[] = [];
  private pcmSampleRate: number = 44100;
  private pcmStartSec: number = 0;
  private pcmDurationSec: number = 0;

  private _currentTime: number = 0;
  public duration: number = 0;
  public paused: boolean = true;
  public volume: number = 1.0;
  public playbackRate: number = 1.0;

  private isBuffering: boolean = false;
  private playContextStartTime: number = 0;
  private playInitialOffset: number = 0;
  private progressTimer: number | null = null;

  private listeners: Map<string, Set<AudioEventCallback>> = new Map();

  constructor() {
    this.initAudioContext();
  }

  get currentTime(): number {
    return this._currentTime;
  }

  set currentTime(val: number) {
    this._currentTime = Math.max(0, Math.min(val, this.duration || val));
    void this.seek(this._currentTime);
  }

  private initAudioContext() {
    if (typeof window === "undefined") return;
    const AudioCtxClass =
      window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtxClass && !this.audioCtx) {
      this.audioCtx = new AudioCtxClass();
      this.gainNode = this.audioCtx.createGain();
      this.gainNode.connect(this.audioCtx.destination);
    }
  }

  public addEventListener(type: string, callback: AudioEventCallback) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);
  }

  public removeEventListener(type: string, callback: AudioEventCallback) {
    this.listeners.get(type)?.delete(callback);
  }

  private dispatchEvent(type: string) {
    const ev = new Event(type);
    this.listeners.get(type)?.forEach((cb) => {
      try {
        cb(ev);
      } catch (e) {
        console.error(`[SoftAudioPlayer] Error in event [${type}]:`, e);
      }
    });
  }

  public async setSource(url: string) {
    if (this.url === url && (this.dec || this.isBuffering)) return;
    console.log("[SoftAudioPlayer] setSource:", url);
    this.stopPlayback();
    this.resetDecoder();
    this.url = url;
    this._currentTime = 0;
    this.duration = 0;
    this.pcmChannels = [];
    this.pcmDurationSec = 0;
    this.pcmStartSec = 0;
    this.dispatchEvent("emptied");

    if (!url) return;
    await this.loadInitialMetadata();
  }

  private resetDecoder() {
    this.loadId++;
    this.isBuffering = false;
    this.dec?.free();
    this.dec = null;
    this.timing = undefined;
  }

  /** 通过 Extension Host 安全拉取指定范围的音频切片，不受浏览器 CORS 限制 */
  private async fetchRange(start: number, end: number): Promise<Uint8Array> {
    console.log(`[SoftAudioPlayer] Fetching range ${start}-${end} via Extension Host...`);
    const res = await requestExtension<any>("XIAOYUZHOU_FETCH_AUDIO_CHUNK", {
      url: this.url,
      start,
      end,
    });
    if (res?.code === 0 && res?.data) {
      const bin = atob(res.data);
      const len = bin.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = bin.charCodeAt(i);
      }
      console.log(`[SoftAudioPlayer] Successfully received chunk (${(bytes.length / 1024).toFixed(1)} KB)`);
      return bytes;
    }
    throw new Error(res?.message || "Failed to fetch audio chunk via extension");
  }

  private async loadInitialMetadata() {
    const loadId = ++this.loadId;
    this.isBuffering = true;
    try {
      const dec = await decoder();
      if (loadId !== this.loadId) {
        dec.free();
        return;
      }
      this.dec = dec;

      // 拉取前 2MB 数据（包含 Fast-Start moov 索引与前段音频）
      const headChunk = await this.fetchRange(0, 2 * 1024 * 1024 - 1);
      if (loadId !== this.loadId) return;
      const decoded = await dec.decode(headChunk);
      if (loadId !== this.loadId) return;
      if (!decoded.channelData?.[0]?.length) {
        throw new Error("No audio samples decoded from the initial MP4 range");
      }

      if (this.dec.st) {
        this.pcmSampleRate = decoded.sampleRate || 44100;
        const sampleCount = this.dec.st.sizes.length;
        // MP4 sample durations are independent of the decoder's PCM sample rate.
        this.timing = readMp4AudioTiming(headChunk, sampleCount);
        this.duration = this.timing?.duration ?? (sampleCount * 1024) / this.pcmSampleRate;
        console.log(`[SoftAudioPlayer] Metadata ready: duration=${this.duration.toFixed(1)}s, sampleRate=${this.pcmSampleRate}`);
      }

      this.dispatchEvent("loadedmetadata");
      this.dispatchEvent("durationchange");

      this.pcmChannels = decoded.channelData;
      this.pcmStartSec = 0;
      this.pcmDurationSec = decoded.channelData[0].length / this.pcmSampleRate;
      console.log(`[SoftAudioPlayer] Initial buffer ready: ${this.pcmDurationSec.toFixed(1)}s`);

      this.dispatchEvent("canplay");

      // 如果在此期间用户已经点击了播放，立即开播！
      if (!this.paused) {
        this.startBufferPlayback(this._currentTime);
      }
    } catch (err: any) {
      if (loadId !== this.loadId) return;
      this.resetDecoder();
      console.error("[SoftAudioPlayer] load metadata error:", err);
      this.dispatchEvent("error");
    } finally {
      if (loadId === this.loadId) this.isBuffering = false;
    }
  }

  /** 从当前 PCM 缓存中切出一段并启动 AudioBufferSourceNode 播放 */
  private startBufferPlayback(startSec: number) {
    if (!this.audioCtx) this.initAudioContext();
    if (!this.audioCtx || !this.gainNode || !this.pcmChannels.length) {
      console.warn("[SoftAudioPlayer] startBufferPlayback skipped:", {
        hasCtx: !!this.audioCtx,
        hasGain: !!this.gainNode,
        channels: this.pcmChannels.length,
      });
      return;
    }

    if (this.audioCtx.state === "suspended") {
      void this.audioCtx.resume();
    }

    this.stopPlayback();

    const sampleRate = this.pcmSampleRate;
    const channels = this.pcmChannels.length;

    const relSec = Math.max(0, startSec - this.pcmStartSec);
    const startSample = Math.round(relSec * sampleRate);
    const totalSamplesInBuf = this.pcmChannels[0].length;

    if (startSample >= totalSamplesInBuf) {
      if (!this.isBuffering) void this.loadAndPlayFrom(startSec);
      return;
    }

    const playSamples = totalSamplesInBuf - startSample;
    const audioBuffer = this.audioCtx.createBuffer(channels, playSamples, sampleRate);
    for (let c = 0; c < channels; c++) {
      audioBuffer.getChannelData(c).set(this.pcmChannels[c].subarray(startSample));
    }

    const source = this.audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.playbackRate.value = this.playbackRate;
    source.connect(this.gainNode);

    this.currentSource = source;
    this.playContextStartTime = this.audioCtx.currentTime;
    this.playInitialOffset = startSec;

    const endSec = this.pcmStartSec + totalSamplesInBuf / sampleRate;
    source.onended = () => {
      if (this.currentSource === source) {
        this.currentSource = null;
        source.disconnect();
        this.stopProgressTimer();
        if (!this.paused) {
          this._currentTime = Math.min(endSec, this.duration);
          this.dispatchEvent("timeupdate");
          const table = this.dec?.st;
          const bufferedEnd = this.pcmStartSec + this.pcmDurationSec;
          if (endSec >= bufferedEnd && table?.idx >= table?.sizes.length) {
            this.pause();
            this.dispatchEvent("ended");
          } else if (endSec < bufferedEnd) {
            const consumed = Math.round((endSec - this.pcmStartSec) * sampleRate);
            this.pcmChannels = this.pcmChannels.map((channel) => channel.subarray(consumed));
            this.pcmStartSec = endSec;
            this.pcmDurationSec = this.pcmChannels[0].length / sampleRate;
            this.startBufferPlayback(endSec);
          } else {
            void this.preloadAndAppendNextChunk();
          }
        }
      }
    };

    source.start(0);
    this.startProgressTimer();
    console.log(`[SoftAudioPlayer] Playback started successfully at ${startSec.toFixed(2)}s!`);
  }

  public async play(): Promise<void> {
    console.log("[SoftAudioPlayer] play() called");
    if (!this.url || (!this.paused && this.currentSource)) return;
    this.paused = false;
    this.dispatchEvent("play");

    if (!this.audioCtx) this.initAudioContext();
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      await this.audioCtx.resume();
    }
    if (this.paused || this.currentSource) return;

    if (this.pcmChannels.length > 0) {
      this.startBufferPlayback(this._currentTime);
    } else if (this.url && !this.isBuffering) {
      void this.loadInitialMetadata();
    }
  }

  public pause(): void {
    console.log("[SoftAudioPlayer] pause() called");
    this.paused = true;
    this.stopPlayback();
    this.dispatchEvent("pause");
  }

  private stopPlayback() {
    this.stopProgressTimer();
    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch {}
      this.currentSource = null;
    }
  }

  public async seek(targetSec: number): Promise<void> {
    targetSec = Math.max(0, Math.min(targetSec, this.duration));
    console.log(`[SoftAudioPlayer] seek to ${targetSec.toFixed(2)}s`);
    this._currentTime = targetSec;
    this.dispatchEvent("timeupdate");
    this.dispatchEvent("seeked");

    this.stopPlayback();

    if (!this.dec?.st) return;
    this.loadId++;
    this.isBuffering = false;

    const inRange =
      this.pcmChannels.length > 0 &&
      targetSec >= this.pcmStartSec &&
      targetSec < this.pcmStartSec + this.pcmDurationSec;

    if (inRange) {
      if (!this.paused) {
        this.startBufferPlayback(targetSec);
      }
    } else {
      await this.loadAndPlayFrom(targetSec);
    }
  }

  private async loadAndPlayFrom(targetSec: number) {
    const dec = this.dec;
    if (!dec?.st) return;
    const loadId = ++this.loadId;

    try {
      this.isBuffering = true;
      const sample = this.timing?.locate(targetSec);
      const targetSampleIdx = sample?.index ?? Math.floor(
        (targetSec * this.pcmSampleRate) / 1024
      );
      if (targetSampleIdx >= dec.st.sizes.length) {
        if (!this.paused) {
          this.pause();
          this.dispatchEvent("ended");
        }
        return;
      }
      const targetState = seekSampleTable(dec.st, targetSampleIdx);

      const fetchStart = targetState.nextOff;
      const fetchEnd = fetchStart + 2 * 1024 * 1024 - 1;
      const chunk = await this.fetchRange(fetchStart, fetchEnd);
      if (loadId !== this.loadId) return;
      Object.assign(dec.st, targetState);
      dec.fileOff = fetchStart;
      dec.skip = 0;
      dec.left = null;
      const decoded = await dec.decode(chunk);
      if (loadId !== this.loadId) return;

      if (decoded.channelData?.length && decoded.channelData[0]?.length) {
        this.pcmChannels = decoded.channelData;
        this.pcmStartSec = sample?.startSec ?? (targetSampleIdx * 1024) / this.pcmSampleRate;
        this.pcmDurationSec = decoded.channelData[0].length / this.pcmSampleRate;

        if (!this.paused) {
          this.startBufferPlayback(targetSec);
        }
      }
    } catch (err: any) {
      if (loadId !== this.loadId) return;
      console.error("[SoftAudioPlayer] seek error:", err);
    } finally {
      if (loadId === this.loadId) this.isBuffering = false;
    }
  }

  private startProgressTimer() {
    this.stopProgressTimer();
    this.progressTimer = window.setInterval(() => {
      if (!this.paused && this.audioCtx && this.currentSource) {
        const elapsed =
          (this.audioCtx.currentTime - this.playContextStartTime) *
          this.playbackRate;
        this._currentTime = Math.min(
          this.duration,
          this.playInitialOffset + elapsed
        );
        this.dispatchEvent("timeupdate");

        const remainingInCurrentBuf =
          this.pcmStartSec + this.pcmDurationSec - this._currentTime;
        if (remainingInCurrentBuf < 15 && !this.isBuffering) {
          void this.preloadAndAppendNextChunk();
        }
      }
    }, 250);
  }

  private async preloadAndAppendNextChunk() {
    const dec = this.dec;
    if (!dec?.st || this.isBuffering || dec.st.idx >= dec.st.sizes.length) return;
    const loadId = this.loadId;
    try {
      this.isBuffering = true;
      // The streaming decoder already retains any incomplete sample from the previous range.
      const nextOff = dec.fileOff + (dec.left?.length ?? 0);

      const chunk = await this.fetchRange(nextOff, nextOff + 1024 * 1024 - 1);
      if (loadId !== this.loadId) return;
      const decoded = await dec.decode(chunk);
      if (loadId !== this.loadId) return;
      if (decoded.channelData?.length && decoded.channelData[0]?.length) {
        const addLen = decoded.channelData[0].length;
        const oldLen = this.pcmChannels[0].length;
        const newChannels: Float32Array[] = [];
        for (let c = 0; c < this.pcmChannels.length; c++) {
          const merged = new Float32Array(oldLen + addLen);
          merged.set(this.pcmChannels[c]);
          merged.set(decoded.channelData[c], oldLen);
          newChannels.push(merged);
        }
        this.pcmChannels = newChannels;
        this.pcmDurationSec = newChannels[0].length / this.pcmSampleRate;
        console.log(`[SoftAudioPlayer] Buffer extended to ${this.pcmDurationSec.toFixed(1)}s`);
        if (!this.paused && !this.currentSource) {
          this.startBufferPlayback(this._currentTime);
        }
      }
    } catch (err) {
      if (loadId !== this.loadId) return;
      console.warn("[SoftAudioPlayer] Preload chunk error:", err);
    } finally {
      if (loadId === this.loadId) this.isBuffering = false;
    }
  }

  private stopProgressTimer() {
    if (this.progressTimer) {
      clearInterval(this.progressTimer);
      this.progressTimer = null;
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.gainNode && this.audioCtx) {
      this.gainNode.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
    }
  }

  public setPlaybackRate(rate: number) {
    this.playbackRate = rate;
    if (this.currentSource) {
      this.currentSource.playbackRate.value = rate;
    }
  }

  public destroy() {
    this.paused = true;
    this.url = "";
    this.stopPlayback();
    this.resetDecoder();
    this.audioCtx?.close();
    this.audioCtx = null;
    this.listeners.clear();
  }
}
