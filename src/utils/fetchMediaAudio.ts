const MAX_AUDIO_BYTES = 32 * 1024 * 1024;

export function isAllowedMediaAudioUrl(url: URL, cdns: readonly string[]): boolean {
  return url.protocol === "https:" && !url.username && !url.password && !url.port &&
    cdns.some((cdn) => url.hostname === cdn || url.hostname.endsWith(`.${cdn}`));
}

export async function fetchMediaAudio(
  rawUrl: string,
  cdns: readonly string[],
  options: { headers?: Record<string, string>; signal?: AbortSignal; range?: { start: number; end: number } } = {},
): Promise<Buffer> {
  let url = new URL(rawUrl);
  const signal = options.signal ?? AbortSignal.timeout(20_000);
  const range = options.range;
  const headers = { ...options.headers, ...(range && { Range: `bytes=${range.start}-${range.end}` }) };
  const maxBytes = range ? range.end - range.start + 1 : MAX_AUDIO_BYTES;

  for (let redirects = 0; redirects <= 4; redirects++) {
    if (!isAllowedMediaAudioUrl(url, cdns)) {
      throw new Error("播放地址不属于受支持的音频 CDN");
    }

    const response = await fetch(url, { signal, headers, redirect: "manual" });
    const location = response.headers.get("location");
    if (response.status >= 300 && response.status < 400 && location) {
      await response.body?.cancel();
      url = new URL(location, url);
      continue;
    }
    const wrongRange = range && (response.status !== 206 ||
      !response.headers.get("content-range")?.startsWith(`bytes ${range.start}-${range.end}/`));
    if (!response.ok || !response.body || wrongRange || Number(response.headers.get("content-length")) > maxBytes) {
      await response.body?.cancel();
      throw new Error(`无法下载用于软解的音频（HTTP ${response.status}）`);
    }

    const chunks: Uint8Array[] = [];
    let length = 0;
    const reader = response.body.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          if (range && length !== maxBytes) throw new Error("音频分段下载不完整");
          return Buffer.concat(chunks, length);
        }
        length += value.byteLength;
        if (length > maxBytes) throw new Error("音频超过软解下载大小限制");
        chunks.push(value);
      }
    } finally {
      await reader.cancel();
    }
  }
  throw new Error("音频 CDN 重定向次数过多");
}
