import type { DashAudioIndex, DashAudioSegment } from "../types/bilibiliAudio";

let audioContext: AudioContext | undefined;

export function unlockSoftwareAudioOnInteraction() {
  const unlock = (event: Event) => {
    if (!event.isTrusted) return;
    audioContext ??= new AudioContext();
    if (audioContext.state === "suspended") void audioContext.resume().catch(() => {});
  };

  document.addEventListener("click", unlock, true);
  document.addEventListener("pointerup", unlock, true);
  document.addEventListener("keydown", unlock, true);
  return () => {
    document.removeEventListener("click", unlock, true);
    document.removeEventListener("pointerup", unlock, true);
    document.removeEventListener("keydown", unlock, true);
    void audioContext?.close().catch(() => {});
    audioContext = undefined;
  };
}

interface AudioReply<T> {
  code: number;
  data?: T;
  message?: string;
}

interface AudioWindow {
  start: number;
  end: number;
  startTime: number;
  endTime: number;
}

function audioWindows(segments: DashAudioSegment[]): AudioWindow[] {
  const windows: AudioWindow[] = [];
  for (let i = 0; i < segments.length; i += 3) {
    const last = Math.min(i + 2, segments.length - 1);
    windows.push({
      // Give the AAC decoder one previous fragment to prime its overlap buffers after a seek.
      start: segments[Math.max(0, i - 1)].start,
      end: segments[last].end,
      startTime: segments[i].time,
      endTime: segments[last + 1]?.time ?? segments[last].time + segments[last].duration,
    });
  }
  return windows;
}

export function mediaBytes(base64: string): Uint8Array {
  const data = atob(base64);
  const bytes = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) bytes[i] = data.charCodeAt(i);
  return bytes;
}

async function decodeWindow(context: AudioContext, bytes: Uint8Array, duration?: number) {
  if (duration !== undefined && !(duration > 0 && duration <= 60)) throw new Error("音轨分段时长无效");
  const { default: decode } = await import("@audio/decode-mp4");
  const { channelData, sampleRate } = await decode(bytes);
  if (!channelData[0]?.length || !sampleRate) throw new Error("未解出有效音轨");
  const samples = duration === undefined ? channelData[0].length : Math.round(duration * sampleRate);
  if (samples * channelData.length * Float32Array.BYTES_PER_ELEMENT > 128 * 1024 * 1024) {
    throw new Error("音轨超过软解缓冲大小限制");
  }
  const buffer = context.createBuffer(channelData.length, samples, sampleRate);
  channelData.forEach((channel, index) => {
    // Keep only the indexed playback window. The preceding samples are AAC preroll.
    const playback = channel.subarray(Math.max(0, channel.length - samples));
    buffer.getChannelData(index).set(playback, samples - playback.length);
  });
  return buffer;
}

function joinMedia(header: Uint8Array, payload: Uint8Array) {
  const bytes = new Uint8Array(header.length + payload.length);
  bytes.set(header);
  bytes.set(payload, header.length);
  return bytes;
}

export function syncSoftwareAudio(video: HTMLVideoElement, url: string, request: {
  getIndex: () => Promise<AudioReply<DashAudioIndex>>;
  getRange: (urls: string[], start: number, end: number) => Promise<AudioReply<string>>;
}) {
  return syncVideoAudio(video, url, async () => {
    const { code, data, message } = await request.getIndex();
    if (code !== 0 || !data) throw new Error(message || "获取 B 站音轨失败");
    const initialization = mediaBytes(data.initialization);
    return {
      windows: audioWindows(data.segments),
      decode: async (window, context) => {
        const reply = await request.getRange(data.urls, window.start, window.end);
        if (reply.code !== 0 || !reply.data) throw new Error(reply.message || "获取 B 站音轨分段失败");
        return decodeWindow(context, joinMedia(initialization, mediaBytes(reply.data)), window.endTime - window.startTime);
      },
    };
  });
}

export function syncProgressiveAudio(video: HTMLVideoElement, url: string, fetchMedia = () => readProgressiveMedia(url)) {
  if (/\.m3u8(?:[?#]|$)/i.test(url)) return;
  return syncVideoAudio(video, url, async () => ({
    windows: [{ start: 0, end: 0, startTime: 0, endTime: video.duration }],
    decode: async (_window, context) => decodeWindow(context, await fetchMedia()),
  }));
}

export async function readProgressiveAudioReply(reply: Promise<AudioReply<string>>) {
  const { code, data, message } = await reply;
  if (code !== 0 || !data) throw new Error(message || "无法获取视频音轨");
  return mediaBytes(data);
}

async function readProgressiveMedia(url: string) {
  const limit = 32 * 1024 * 1024;
  const response = await fetch(url, { signal: AbortSignal.timeout(20_000) });
  if (!response.ok || !response.body || Number(response.headers.get("content-length")) > limit) {
    await response.body?.cancel();
    throw new Error("无法获取用于软解的视频");
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > limit) throw new Error("视频超过软解下载大小限制");
      chunks.push(value);
    }
  } finally {
    await reader.cancel();
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return bytes;
}

interface SoftwareAudioTrack {
  windows: AudioWindow[];
  decode: (window: AudioWindow, context: AudioContext) => Promise<AudioBuffer>;
}

function syncVideoAudio(video: HTMLVideoElement, url: string, loadTrack: () => Promise<SoftwareAudioTrack>) {
  const source = new URL(url, document.baseURI).href;
  const canDecodeAac = Boolean(video.canPlayType('audio/mp4; codecs="mp4a.40.2"'));
  const getNativeDecodedBytes = () =>
    (video as HTMLVideoElement & { webkitAudioDecodedByteCount?: number }).webkitAudioDecodedByteCount;
  let disposed = false;
  let requested = false;
  let track: SoftwareAudioTrack | undefined;
  let windows: AudioWindow[] = [];
  let current = -1;
  const buffers = new Map<number, AudioBuffer>();
  const pending = new Set<number>();
  const failed = new Set<number>();
  let gain: GainNode | undefined;
  let playing: { offset: number; startedAt: number; rate: number } | undefined;
  const nodes = new Map<number, AudioBufferSourceNode>();
  let probeStart: number | undefined;

  const pause = () => {
    for (const node of nodes.values()) {
      node.stop();
      node.disconnect();
    }
    nodes.clear();
    playing = undefined;
  };

  const clearAudio = () => {
    pause();
    gain?.disconnect();
    gain = undefined;
    track = undefined;
    windows = [];
    buffers.clear();
  };

  const isCurrent = () => !disposed && video.currentSrc === source;

  const loadWindow = async (index: number, context: AudioContext) => {
    const window = windows[index];
    const audioTrack = track;
    if (!window || !audioTrack || pending.size >= 2 || buffers.has(index) || pending.has(index) || failed.has(index)) return;
    pending.add(index);
    const wanted = () => isCurrent() && track === audioTrack && index >= current && index <= current + 1;
    try {
      const buffer = await audioTrack.decode(window, context);
      if (wanted()) buffers.set(index, buffer);
    } catch (error) {
      if (wanted()) {
        failed.add(index);
        console.warn("视频音轨软解失败", error);
      }
    } finally {
      pending.delete(index);
      if (isCurrent()) sync();
    }
  };

  const sync = () => {
    if (!track) return;
    if (getNativeDecodedBytes()) {
      clearAudio();
      return;
    }
    const context = audioContext;
    if (context?.state !== "running" || !isCurrent() || video.paused || video.ended || video.seeking || video.readyState < 3) {
      pause();
      return;
    }
    const offset = video.currentTime;
    const rate = video.playbackRate;
    current = windows.findIndex((window) => offset >= window.startTime && offset < window.endTime);
    if (current === -1 || rate <= 0) {
      pause();
      return;
    }
    for (const index of buffers.keys()) {
      if (index < current || index > current + 1) buffers.delete(index);
    }
    if (!buffers.has(current)) {
      pause();
      void loadWindow(current, context);
      return;
    }
    void loadWindow(current + 1, context);

    if (!gain) {
      gain = context.createGain();
      gain.connect(context.destination);
    }
    gain.gain.value = video.muted ? 0 : video.volume;
    const now = context.currentTime;
    if (playing && (playing.rate !== rate ||
        Math.abs(playing.offset + (now - playing.startedAt) * rate - offset) > 0.2)) pause();
    playing ??= { offset, startedAt: now, rate };
    const audioTime = playing.offset + (now - playing.startedAt) * rate;
    for (const [index, node] of nodes) {
      if (index < current && audioTime >= windows[index].endTime) {
        node.disconnect();
        nodes.delete(index);
      }
    }

    for (const index of [current, current + 1]) {
      const buffer = buffers.get(index);
      if (!buffer || nodes.has(index)) continue;
      const startTime = windows[index].startTime;
      const scheduled = playing.startedAt + (startTime - playing.offset) / rate;
      const bufferOffset = Math.max(0, (now - scheduled) * rate);
      if (bufferOffset >= buffer.duration) continue;
      const node = context.createBufferSource();
      node.buffer = buffer;
      node.playbackRate.value = rate;
      node.connect(gain);
      node.start(Math.max(now, scheduled), bufferOffset);
      nodes.set(index, node);
    }
  };

  const loadAudio = async () => {
    requested = true;
    try {
      const loaded = await loadTrack();
      if (!isCurrent() || getNativeDecodedBytes()) return;
      track = loaded;
      windows = loaded.windows;
      sync();
    } catch (error) {
      if (isCurrent()) console.warn("视频音轨软解失败", error);
    }
  };

  const onPlayback = () => {
    sync();
    if (!isCurrent() || requested || video.paused || video.seeking || video.muted || video.volume === 0 ||
        !Number.isFinite(video.duration) || video.duration <= 0 || getNativeDecodedBytes()) return;
    probeStart ??= video.currentTime;
    // Some Electron builds report AAC support without ever producing decoded audio.
    if (!canDecodeAac || (getNativeDecodedBytes() === 0 && video.currentTime - probeStart >= 2)) {
      void loadAudio();
    }
  };
  const onSeeking = () => {
    probeStart = undefined;
    current = -1;
    failed.clear();
    pause();
  };
  const events = {
    playing: onPlayback,
    timeupdate: onPlayback,
    seeked: sync,
    ratechange: sync,
    volumechange: onPlayback,
    pause,
    ended: pause,
    waiting: pause,
    seeking: onSeeking,
  };
  for (const [event, handler] of Object.entries(events)) video.addEventListener(event, handler);
  onPlayback();

  return () => {
    disposed = true;
    for (const [event, handler] of Object.entries(events)) video.removeEventListener(event, handler);
    clearAudio();
  };
}
