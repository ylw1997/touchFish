import type { DashAudioSegment } from "../../types/bilibiliAudio";

export function parseDashAudioIndex(data: Buffer, indexStart: number): DashAudioSegment[] {
  for (let box = 0; box + 8 <= data.length;) {
    const size = data.readUInt32BE(box);
    const end = box + size;
    if (size < 8 || end > data.length) break;
    if (data.toString("ascii", box + 4, box + 8) !== "sidx") {
      box = end;
      continue;
    }

    const version = data[box + 8];
    const wide = version === 1;
    const entries = box + (wide ? 40 : 32);
    if ((version !== 0 && !wide) || entries > end) break;
    const scale = data.readUInt32BE(box + 16);
    const count = data.readUInt16BE(entries - 2);
    let time = wide ? Number(data.readBigUInt64BE(box + 20)) : data.readUInt32BE(box + 20);
    let offset = indexStart + end + (wide ? Number(data.readBigUInt64BE(box + 28)) : data.readUInt32BE(box + 24));
    if (!scale || !count || entries + count * 12 > end) break;

    const segments: DashAudioSegment[] = [];
    for (let i = 0; i < count; i++) {
      const entry = entries + i * 12;
      const length = data.readUInt32BE(entry);
      const ticks = data.readUInt32BE(entry + 4);
      if (!length || length >= 0x80000000 || !ticks ||
          !Number.isSafeInteger(offset + length) || !Number.isSafeInteger(time + ticks)) {
        throw new Error("B 站音轨分段索引无效");
      }
      segments.push({ start: offset, end: offset + length - 1, time: time / scale, duration: ticks / scale });
      offset += length;
      time += ticks;
    }
    return segments;
  }
  throw new Error("B 站音轨缺少有效的 DASH 分段索引");
}
