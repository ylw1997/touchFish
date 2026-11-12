interface AudioReply {
  code: number;
  data?: string;
  message?: string;
}

interface SoftwareMusicOptions {
  fetchAudio: (url: string) => Promise<AudioReply>;
  shouldPlay: () => boolean;
  restorePosition: (time: number) => void;
  onFailure: () => void;
  skipTrack: () => void;
}

async function decodeMusic(bytes: Uint8Array, url?: string) {
  const path = url ? new URL(url).pathname.toLowerCase() : "";
  const signature = String.fromCharCode(...bytes.subarray(0, 8));
  if (signature.startsWith("fLaC") || path.endsWith(".flac")) {
    return (await import("@audio/decode-flac")).default(bytes);
  }
  if (signature.slice(4) === "ftyp" || /\.(m4a|mp4)$/.test(path)) {
    return (await import("@audio/decode-mp4")).default(bytes);
  }
  const mpegFrame = bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0 && (bytes[1] & 0x06) !== 0;
  if (signature.startsWith("ID3") || mpegFrame || path.endsWith(".mp3")) {
    return (await import("@audio/decode-mp3")).default(bytes);
  }
  throw new Error("不支持此音频格式的软件解码");
}

function pcmToWav(channelData: Float32Array[], sampleRate: number): Blob {
  const channels = channelData.length;
  const samples = channelData[0]?.length ?? 0;
  const dataSize = samples * channels * 2;
  if (!samples || !Number.isInteger(sampleRate) || sampleRate <= 0 || dataSize > 128 * 1024 * 1024) {
    throw new Error("音频无法转换为 WAV");
  }

  const wav = new ArrayBuffer(44 + dataSize);
  const header = new DataView(wav);
  header.setUint32(0, 0x52494646); // RIFF
  header.setUint32(4, 36 + dataSize, true);
  header.setUint32(8, 0x57415645); // WAVE
  header.setUint32(12, 0x666d7420); // fmt
  header.setUint32(16, 16, true);
  header.setUint16(20, 1, true);
  header.setUint16(22, channels, true);
  header.setUint32(24, sampleRate, true);
  header.setUint32(28, sampleRate * channels * 2, true);
  header.setUint16(32, channels * 2, true);
  header.setUint16(34, 16, true);
  header.setUint32(36, 0x64617461); // data
  header.setUint32(40, dataSize, true);

  let offset = 44;
  for (let sample = 0; sample < samples; sample++) {
    for (const channel of channelData) {
      const value = Math.max(-1, Math.min(1, channel[sample]));
      header.setInt16(offset, Math.round(value * (value < 0 ? 32768 : 32767)), true);
      offset += 2;
    }
  }
  return new Blob([wav], { type: "audio/wav" });
}

export async function decodeAudioToPcm(data: string, url?: string) {
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return decodeMusic(bytes, url);
}

export function enableSoftwareMusic(audio: HTMLAudioElement, url: string, options: SoftwareMusicOptions) {
  let active = true;
  let attempted = false;
  let objectUrl: string | undefined;
  let skipTimer: number | undefined;

  const isCurrent = () => active && audio.getAttribute("src") === (objectUrl ?? url);
  const fail = () => {
    if (!isCurrent() || skipTimer !== undefined) return;
    options.onFailure();
    skipTimer = window.setTimeout(() => {
      if (isCurrent()) options.skipTrack();
    }, 1500);
  };

  const onError = async () => {
    const errorCode = audio.error?.code;
    if (!isCurrent() || errorCode === undefined) return;
    if (objectUrl || (errorCode !== 3 && errorCode !== 4)) {
      fail();
      return;
    }
    if (attempted) return;
    attempted = true;

    const position = audio.currentTime;
    try {
      const reply = await options.fetchAudio(url);
      if (!isCurrent()) return;
      if (reply.code !== 0 || !reply.data) throw new Error(reply.message || "音频下载失败");
      const { channelData, sampleRate } = await decodeAudioToPcm(reply.data, url);
      if (!isCurrent()) return;
      objectUrl = URL.createObjectURL(pcmToWav(channelData, sampleRate));
      options.restorePosition(position);
      audio.src = objectUrl;
      if (options.shouldPlay()) await audio.play();
    } catch (error) {
      if (!isCurrent() || (error instanceof DOMException && error.name === "AbortError")) return;
      console.warn("[SoftMusic] 播放失败", error);
      fail();
    }
  };

  audio.addEventListener("error", onError);
  return () => {
    active = false;
    audio.removeEventListener("error", onError);
    window.clearTimeout(skipTimer);
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  };
}
