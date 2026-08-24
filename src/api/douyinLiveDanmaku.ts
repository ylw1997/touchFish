import axios from "axios";
import { createHash, randomBytes } from "crypto";
import { gunzipSync } from "zlib";
import { WebSocket, type RawData } from "ws";

const LIVE_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36";

export interface DouyinLiveDanmakuItem {
  id: string;
  nickname: string;
  text: string;
}

interface ProtoField {
  number: number;
  wireType: number;
}

class ProtoReader {
  private offset = 0;

  constructor(private readonly data: Buffer) {}

  nextField(): ProtoField | undefined {
    if (this.offset >= this.data.length) return undefined;
    const key = this.readVarint();
    const number = Number(key >> 3n);
    if (number <= 0) throw new Error("直播弹幕 protobuf 字段无效");
    return { number, wireType: Number(key & 7n) };
  }

  readVarint(): bigint {
    let value = 0n;
    for (let shift = 0n; shift <= 63n; shift += 7n) {
      if (this.offset >= this.data.length) throw new Error("直播弹幕 protobuf 截断");
      const byte = this.data[this.offset++];
      value |= BigInt(byte & 0x7f) << shift;
      if ((byte & 0x80) === 0) return value;
    }
    throw new Error("直播弹幕 protobuf varint 无效");
  }

  readBytes(): Buffer {
    const length = Number(this.readVarint());
    const end = this.offset + length;
    if (!Number.isSafeInteger(length) || length < 0 || end > this.data.length) {
      throw new Error("直播弹幕 protobuf 长度无效");
    }
    const value = this.data.subarray(this.offset, end);
    this.offset = end;
    return value;
  }

  readString(): string {
    return this.readBytes().toString("utf8");
  }

  skip(wireType: number) {
    if (wireType === 0) this.readVarint();
    else if (wireType === 1) this.advance(8);
    else if (wireType === 2) this.advance(Number(this.readVarint()));
    else if (wireType === 5) this.advance(4);
    else throw new Error("直播弹幕 protobuf wire type 无效");
  }

  private advance(length: number) {
    if (!Number.isSafeInteger(length) || length < 0 || this.offset + length > this.data.length) {
      throw new Error("直播弹幕 protobuf 越界");
    }
    this.offset += length;
  }
}

const encodeVarint = (source: bigint | number) => {
  let value = BigInt(source);
  const bytes: number[] = [];
  while (value >= 0x80n) {
    bytes.push(Number(value & 0x7fn) | 0x80);
    value >>= 7n;
  }
  bytes.push(Number(value));
  return Buffer.from(bytes);
};

const encodeField = (number: number, value: Buffer | string | bigint) => {
  if (typeof value === "bigint") {
    return Buffer.concat([encodeVarint(number << 3), encodeVarint(value)]);
  }
  const data = Buffer.isBuffer(value) ? value : Buffer.from(value, "utf8");
  return Buffer.concat([
    encodeVarint((number << 3) | 2),
    encodeVarint(data.length),
    data,
  ]);
};

const encodePushFrame = (payloadType: string, logId = 0n, payload?: Buffer) =>
  Buffer.concat([
    ...(logId ? [encodeField(2, logId)] : []),
    encodeField(7, payloadType),
    ...(payload?.length ? [encodeField(8, payload)] : []),
  ]);

const decodePushFrame = (data: Buffer) => {
  const reader = new ProtoReader(data);
  let logId = 0n;
  let payload = Buffer.alloc(0);
  for (let field = reader.nextField(); field; field = reader.nextField()) {
    if (field.number === 2 && field.wireType === 0) logId = reader.readVarint();
    else if (field.number === 8 && field.wireType === 2) payload = reader.readBytes();
    else reader.skip(field.wireType);
  }
  return { logId, payload };
};

const decodeMessage = (data: Buffer) => {
  const reader = new ProtoReader(data);
  let method = "";
  let payload = Buffer.alloc(0);
  let messageId = 0n;
  for (let field = reader.nextField(); field; field = reader.nextField()) {
    if (field.number === 1 && field.wireType === 2) method = reader.readString();
    else if (field.number === 2 && field.wireType === 2) payload = reader.readBytes();
    else if (field.number === 3 && field.wireType === 0) messageId = reader.readVarint();
    else reader.skip(field.wireType);
  }
  return { method, payload, messageId };
};

const decodeResponse = (data: Buffer) => {
  const reader = new ProtoReader(data);
  const messages: ReturnType<typeof decodeMessage>[] = [];
  let internalExt = "";
  let needAck = false;
  for (let field = reader.nextField(); field; field = reader.nextField()) {
    if (field.number === 1 && field.wireType === 2) messages.push(decodeMessage(reader.readBytes()));
    else if (field.number === 5 && field.wireType === 2) internalExt = reader.readString();
    else if (field.number === 9 && field.wireType === 0) needAck = reader.readVarint() !== 0n;
    else reader.skip(field.wireType);
  }
  return { messages, internalExt, needAck };
};

const decodeNickname = (data: Buffer) => {
  const reader = new ProtoReader(data);
  let nickname = "";
  for (let field = reader.nextField(); field; field = reader.nextField()) {
    if (field.number === 3 && field.wireType === 2) nickname = reader.readString();
    else reader.skip(field.wireType);
  }
  return nickname;
};

const decodeChat = (data: Buffer) => {
  const reader = new ProtoReader(data);
  let nickname = "";
  let text = "";
  for (let field = reader.nextField(); field; field = reader.nextField()) {
    if (field.number === 2 && field.wireType === 2) nickname = decodeNickname(reader.readBytes());
    else if (field.number === 3 && field.wireType === 2) text = reader.readString();
    else reader.skip(field.wireType);
  }
  return { nickname, text };
};

const md5 = (value: Buffer | string) => createHash("md5").update(value).digest();

const rc4 = (input: Buffer, key: number) => {
  const box = Array.from({ length: 256 }, (_, index) => index);
  let j = 0;
  for (let i = 0; i < box.length; i += 1) {
    j = (j + box[i] + key) & 0xff;
    [box[i], box[j]] = [box[j], box[i]];
  }
  const output = Buffer.alloc(input.length);
  let i = 0;
  j = 0;
  for (let index = 0; index < input.length; index += 1) {
    i = (i + 1) & 0xff;
    j = (j + box[i]) & 0xff;
    [box[i], box[j]] = [box[j], box[i]];
    output[index] = input[index] ^ box[(box[i] + box[j]) & 0xff];
  }
  return output;
};

const liveBase64 = (input: Buffer) => {
  const alphabet = "Dkdpgh4ZKsQB80/Mfvw36XI1R25+WUAlEi7NLboqYTOPuzmFjJnryx9HVGcaStCe";
  let result = "";
  for (let start = 0; start < input.length; start += 3) {
    const count = Math.min(3, input.length - start);
    const value =
      (input[start] << 16) |
      ((count > 1 ? input[start + 1] : 0) << 8) |
      (count > 2 ? input[start + 2] : 0);
    result += alphabet[(value >> 18) & 63];
    result += alphabet[(value >> 12) & 63];
    result += count > 1 ? alphabet[(value >> 6) & 63] : "=";
    result += count > 2 ? alphabet[value & 63] : "=";
  }
  return result;
};

let liveCounter = 0;
const makeLiveSignature = (roomId: string, userUniqueId: string) => {
  const source = `live_id=1,aid=6383,version_code=180800,webcast_sdk_version=1.0.15,room_id=${roomId},sub_room_id=,sub_channel_id=,did_rule=3,user_unique_id=${userUniqueId},device_platform=web,device_type=,ac=,identity=audience`;
  const payloadDigest = md5(md5(Buffer.alloc(0)));
  const stubDigest = md5(md5(source));
  liveCounter = (liveCounter + 1) & 0xffff;
  const body = Buffer.from([
    liveCounter & 0x3f,
    (liveCounter >> 8) & 0xff,
    0x09,
    0x0c,
    payloadDigest[14],
    payloadDigest[15],
    stubDigest[14],
    stubDigest[15],
    randomBytes(1)[0] % 255,
  ]);
  const plain = Buffer.concat([
    body,
    Buffer.from([body.reduce((checksum, byte) => checksum ^ byte, 0)]),
  ]);
  const key = randomBytes(1)[0] % 255;
  const prefix = randomBytes(1)[0] & 1 ? 0x50 : 0x40;
  return liveBase64(Buffer.concat([Buffer.from([prefix, key]), rc4(plain, key)]));
};

const cookieValue = (cookie: string, name: string) =>
  cookie
    .split(";")
    .map((part) => part.trim().split("=", 2))
    .find(([key]) => key === name)?.[1];

const mergeTtwid = (cookie: string, setCookies: string[] | undefined) => {
  if (cookieValue(cookie, "ttwid")) return cookie;
  const match = setCookies?.join(",").match(/(?:^|[,;]\s*)ttwid=([^;,\s]+)/);
  return match?.[1] ? `${cookie ? `${cookie}; ` : ""}ttwid=${match[1]}` : cookie;
};

export class DouyinLiveDanmakuSession {
  private socket?: WebSocket;
  private heartbeat?: NodeJS.Timeout;
  private reconnect?: NodeJS.Timeout;
  private stopped = false;
  private reconnectAttempt = 0;
  private readonly seen = new Set<string>();
  private readonly recentIds: string[] = [];

  constructor(
    private readonly roomId: string,
    private readonly webRid: string,
    private readonly cookie: string,
    private readonly onMessage: (item: DouyinLiveDanmakuItem) => void,
    private readonly onStatus?: (status: "connected" | "reconnecting" | "stopped") => void,
  ) {}

  async start() {
    this.stopped = false;
    await this.connect();
  }

  stop() {
    this.stopped = true;
    if (this.heartbeat) clearInterval(this.heartbeat);
    if (this.reconnect) clearTimeout(this.reconnect);
    this.socket?.close();
    this.socket = undefined;
    this.onStatus?.("stopped");
  }

  private async connect() {
    try {
      const page = await axios.get<string>(`https://live.douyin.com/${this.webRid}`, {
        headers: { "User-Agent": LIVE_UA, Referer: "https://live.douyin.com/", Cookie: this.cookie },
        timeout: 15_000,
        responseType: "text",
      });
      if (this.stopped) return;
      const html = String(page.data || "");
      const userUniqueId =
        html.match(/\\"user_unique_id\\":\\"(\d+)\\"/)?.[1] ||
        html.match(/"user_unique_id"\s*:\s*"(\d+)"/)?.[1] ||
        String(BigInt(`0x${randomBytes(8).toString("hex")}`) % 8_000_000_000_000_000_000n + 1_000_000_000_000_000_000n);
      const cookie = mergeTtwid(this.cookie, page.headers["set-cookie"]);
      const now = Date.now();
      const cursor = `t-${now}_r-1_d-1_u-1_h-1`;
      const internalExt = `internal_src:dim|wss_push_room_id:${this.roomId}|wss_push_did:${userUniqueId}|first_req_ms:${now}|fetch_time:${now}|seq:1|wss_info:0-${now}-0-0`;
      const params = new URLSearchParams({
        app_name: "douyin_web",
        version_code: "180800",
        webcast_sdk_version: "1.0.15",
        update_version_code: "1.0.15",
        compress: "gzip",
        device_platform: "web",
        cookie_enabled: "true",
        browser_language: "zh-CN",
        browser_platform: "Win32",
        browser_name: "Mozilla",
        browser_version: LIVE_UA,
        browser_online: "true",
        tz_name: "Asia/Shanghai",
        cursor,
        internal_ext: internalExt,
        host: "https://live.douyin.com",
        aid: "6383",
        live_id: "1",
        did_rule: "3",
        endpoint: "live_pc",
        support_wrds: "1",
        user_unique_id: userUniqueId,
        im_path: "/webcast/im/fetch/",
        identity: "audience",
        need_persist_msg_count: "15",
        room_id: this.roomId,
        heartbeatDuration: "0",
        signature: makeLiveSignature(this.roomId, userUniqueId),
      });
      const socket = new WebSocket(
        `wss://webcast100-ws-web-hl.douyin.com/webcast/im/push/v2/?${params.toString()}`,
        { headers: { "User-Agent": LIVE_UA, Origin: "https://live.douyin.com", Cookie: cookie } },
      );
      this.socket = socket;
      socket.on("open", () => {
        this.reconnectAttempt = 0;
        this.onStatus?.("connected");
        if (this.heartbeat) clearInterval(this.heartbeat);
        this.heartbeat = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) socket.send(encodePushFrame("hb"));
        }, 5_000);
      });
      socket.on("message", (raw: RawData) => {
        try {
          const data = Array.isArray(raw)
            ? Buffer.concat(raw)
            : Buffer.from(raw as Buffer | ArrayBuffer);
          const frame = decodePushFrame(data);
          const response = decodeResponse(
            frame.payload[0] === 0x1f && frame.payload[1] === 0x8b
              ? gunzipSync(frame.payload)
              : frame.payload,
          );
          if (response.needAck && socket.readyState === WebSocket.OPEN) {
            socket.send(encodePushFrame("ack", frame.logId, Buffer.from(response.internalExt)));
          }
          for (const message of response.messages) {
            if (message.method !== "WebcastChatMessage") continue;
            const chat = decodeChat(message.payload);
            const text = chat.text.trim();
            if (!text) continue;
            const id = message.messageId
              ? message.messageId.toString()
              : `${chat.nickname}|${text}|${Date.now()}`;
            if (this.seen.has(id)) continue;
            this.seen.add(id);
            this.recentIds.push(id);
            if (this.recentIds.length > 1_000) {
              for (const expired of this.recentIds.splice(0, 200)) this.seen.delete(expired);
            }
            this.onMessage({ id, nickname: chat.nickname, text });
          }
        } catch {
          // 单帧解析失败不应断开健康的直播连接。
        }
      });
      socket.on("close", () => this.scheduleReconnect());
      socket.on("error", () => this.scheduleReconnect());
    } catch {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.stopped || this.reconnect) return;
    if (this.heartbeat) clearInterval(this.heartbeat);
    this.heartbeat = undefined;
    this.socket?.terminate();
    this.socket = undefined;
    this.reconnectAttempt += 1;
    this.onStatus?.("reconnecting");
    const delay = Math.min(30_000, 1_000 * 2 ** Math.min(this.reconnectAttempt - 1, 4));
    this.reconnect = setTimeout(() => {
      this.reconnect = undefined;
      void this.connect();
    }, delay);
  }
}
