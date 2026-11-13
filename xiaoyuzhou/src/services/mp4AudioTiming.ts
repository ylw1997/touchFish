type Box = { start: number; end: number };
type SampleRun = { count: number; delta: number };

function boxType(name: string) {
  return name.charCodeAt(0) * 0x1000000 + name.charCodeAt(1) * 0x10000 +
    name.charCodeAt(2) * 0x100 + name.charCodeAt(3);
}

function* boxes(view: DataView, { start, end }: Box, type: string) {
  const typeId = boxType(type);
  for (let offset = start; offset + 8 <= end;) {
    let size = view.getUint32(offset);
    let headerSize = 8;
    if (size === 1) {
      headerSize = 16;
      if (offset + headerSize > end) return;
      size = Number(view.getBigUint64(offset + 8));
    } else if (size === 0) {
      size = end - offset;
    }
    if (size < headerSize || size > end - offset) return;
    if (view.getUint32(offset + 4) === typeId) {
      yield { start: offset + headerSize, end: offset + size };
    }
    offset += size;
  }
}

function child(view: DataView, parent: Box, type: string) {
  return boxes(view, parent, type).next().value;
}

export function readMp4AudioTiming(data: Uint8Array, sampleCount: number) {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const moov = child(view, { start: 0, end: data.length }, "moov");
  if (!moov) return;

  for (const trak of boxes(view, moov, "trak")) {
    const mdia = child(view, trak, "mdia");
    if (!mdia) continue;
    const hdlr = child(view, mdia, "hdlr");
    if (!hdlr || hdlr.end - hdlr.start < 12 || view.getUint32(hdlr.start + 8) !== boxType("soun")) continue;

    const mdhd = child(view, mdia, "mdhd");
    const minf = child(view, mdia, "minf");
    const stbl = minf && child(view, minf, "stbl");
    const stts = stbl && child(view, stbl, "stts");
    if (!mdhd || mdhd.end <= mdhd.start || !stts || stts.end - stts.start < 8) return;

    const timescaleOffset = mdhd.start + (view.getUint8(mdhd.start) === 1 ? 20 : 12);
    if (timescaleOffset + 4 > mdhd.end) return;
    const timescale = view.getUint32(timescaleOffset);
    const runCount = view.getUint32(stts.start + 4);
    if (!timescale || runCount > (stts.end - stts.start - 8) / 8) return;

    const runs: SampleRun[] = [];
    let samples = 0;
    let ticks = 0;
    for (let index = 0, offset = stts.start + 8; index < runCount; index++, offset += 8) {
      const count = view.getUint32(offset);
      const delta = view.getUint32(offset + 4);
      if (!count || !delta) return;
      runs.push({ count, delta });
      samples += count;
      ticks += count * delta;
    }
    if (samples !== sampleCount || !Number.isSafeInteger(ticks)) return;

    return {
      duration: ticks / timescale,
      locate(seconds: number) {
        if (seconds >= ticks / timescale) return { index: sampleCount, startSec: ticks / timescale };
        const target = seconds * timescale;
        let index = 0;
        let start = 0;
        for (const { count, delta } of runs) {
          const end = start + count * delta;
          if (target < end) {
            const offset = Math.floor((target - start) / delta);
            return { index: index + offset, startSec: (start + offset * delta) / timescale };
          }
          index += count;
          start = end;
        }
        return { index, startSec: start / timescale };
      },
    };
  }
}
