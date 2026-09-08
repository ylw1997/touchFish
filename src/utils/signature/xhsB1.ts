import { CryptoConfig } from "./xhsConfig";
import { rc4BinaryString, b64Custom } from "./xhsCryptoUtils";

const MINI_FIELD_KEYS = [
  "x33",
  "x34",
  "x35",
  "x36",
  "x37",
  "x38",
  "x39",
  "x42",
  "x43",
  "x44",
  "x45",
  "x46",
  "x48",
  "x49",
  "x50",
  "x51",
  "x52",
  "x82",
  "x84",
] as const;

const DEFAULT_X37 = "0|0|0|0|0|0|0|0|0|1|0|0|1|0|0|0|0|1|1|0|0|0|0|0";
const DEFAULT_X38 = "0|0|1|0|1|0|0|0|0|0|1|0|1|0|1|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0";
const DEFAULT_X82 =
  "1|_BHjFmfUMEtxhI|_AUuXfEG27Xa3x|__xhsPendingNotePoint25300ReportMap|__xhsReportedNotePoint25300RecordMap|setImDebugMode|anti_hp_sign_config|__rap_app_id__|__rap_report__|__rap_last_sign_cost__|__rap_last_transform_cost__|__rap_hijack_installed__|__ed1a7dddf7c818e4bd|__hp_xhs_search_input_state__|__h";
const DEFAULT_X39 = "22";
const DEFAULT_X45 = "__SEC_CAV__1-1-1-1-1|";
const DEFAULT_X50 = "131,88,103";

function formatTelemetry(options: { now?: number; sessionAgeMs?: number } = {}): string {
  const now = Number(options.now ?? Date.now());
  const timeOrigin = Number(now - Number(options.sessionAgeMs ?? 2151.1));
  const mouse = "me:50,mm:50,md:1,mu:1,c:1";
  const page = "ulr:1,ps:1,f:3,b:3,vc:0,rs:1,sc:0";
  const state = "h:0,f:1,kr:0";
  const ft =
    "ae:3.3656015629507223,ak:6.231183732330187,cdr:0.4096814442007536,bf:{ar:0.6210873146622735,fr:7.158084478545331},fi:2151.1";
  return `{mt:{to:${timeOrigin}},m:{${mouse}},k:{},p:{${page}},st:{${state}},ft:{${ft}}}`;
}

export function buildMiniFields(options: { now?: number } = {}): Record<string, string> {
  const now = Number(options.now ?? Date.now());
  const fields: Record<string, string> = {
    x33: "0",
    x34: "0",
    x35: "0",
    x36: "2",
    x37: DEFAULT_X37,
    x38: DEFAULT_X38,
    x39: DEFAULT_X39,
    x42: CryptoConfig.B1_SDK_VERSION,
    x43: "Canvas not supported",
    x44: String(now),
    x45: DEFAULT_X45,
    x46: "false",
    x48: "",
    x49: "{list:[],type:}",
    x50: DEFAULT_X50,
    x51: "",
    x52: "",
    x82: DEFAULT_X82.slice(0, 300),
    x84: formatTelemetry({ now }),
  };

  const ordered: Record<string, string> = {};
  for (const key of MINI_FIELD_KEYS) {
    if (fields[key] !== undefined) {
      ordered[key] = fields[key];
    }
  }
  return ordered;
}

export function generateB1(options: { now?: number } = {}): string {
  const mini = buildMiniFields(options);
  const plainText = JSON.stringify(mini);
  const encrypted = rc4BinaryString(plainText, CryptoConfig.B1_RC4_KEY);
  return b64Custom(Buffer.from(encrypted, "utf8"), CryptoConfig.XS_ALPHABET);
}
