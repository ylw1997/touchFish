// Minimal JS implementation: only signXs (random mode)
// Browser compatible version (No Node.js dependencies)
// Usage:
//   import { signXs } from './xhshow_min.js';
//   const xs = signXs('POST','/api/sns/web/v1/homefeed', a1Value, 'xhs-pc-web', payload);

import CryptoJS from "crypto-js";

const CONFIG = {
  BASE58_ALPHABET:
    "NOPQRStuvwxWXYZabcyz012DEFTKLMdefghijkl4563GHIJBC7mnop89+/AUVqrsOPQefghijkABCDEFGuvwz0123456789xy",
  CUSTOM_BASE64_ALPHABET:
    "ZmserbBoHQtNP+wOcza/LpngG8yJq42KWYj0DSfdikx3VT16IlUAFM97hECvuRX5",
  STANDARD_BASE64_ALPHABET:
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
  X3_BASE64_ALPHABET:
    "MfgqrsbcyzPQRStuvC7mn501HIJBo2DEFTKdeNOwxWXYZap89+/A4UVLhijkl63G",
  HEX_KEY:
    "71a302257793271ddd273bcee3e4b98d9d7935e1da33f5765e2ea8afb6dc77a51a499d23b67c20660025860cbf13d4540d92497f58686c574e508f46e1956344f39139bf4faf22a3eef120b79258145b2feb5193b6478669961298e79bedca646e1a693a926154a5a7a1bd1cf0dedb742f917a747a1e388b234f2277",
  VERSION_BYTES: [119, 104, 96, 41],
  ENV_FINGERPRINT_XOR_KEY: 41,
  SEQUENCE_VALUE_MIN: 15,
  SEQUENCE_VALUE_MAX: 50,
  WINDOW_PROPS_LENGTH_MIN: 900,
  WINDOW_PROPS_LENGTH_MAX: 1200,
  CHECKSUM_VERSION: 1,
  CHECKSUM_XOR_KEY: 115,
  CHECKSUM_FIXED_TAIL: [
    249, 65, 103, 103, 201, 181, 131, 99, 94, 7, 68, 250, 132, 21,
  ],
  ENV_FINGERPRINT_TIME_OFFSET_MIN: 10,
  ENV_FINGERPRINT_TIME_OFFSET_MAX: 50,
  X3_PREFIX: "mns0301_",
  XYS_PREFIX: "XYS_",
  TEMPLATE: {
    x0: "4.2.6",
    x1: "xhs-pc-web",
    x2: "Windows",
    x3: "",
    x4: "",
  },
};

// --- Helpers ---

function utf8Bytes(str) {
  const enc = encodeURIComponent(str);
  const arr = [];
  for (let i = 0; i < enc.length; i++) {
    const ch = enc[i];
    if (ch === "%") {
      arr.push(parseInt(enc.slice(i + 1, i + 3), 16));
      i += 2;
    } else arr.push(ch.charCodeAt(0));
  }
  return arr;
}

function rand32() {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return arr[0];
  }
  return Math.floor(Math.random() * 0xffffffff) >>> 0;
}

function randByte(min = 0, max = 255) {
  return min + (rand32() % (max - min + 1));
}

function intToLE(val, len = 4) {
  const out = [];
  let v = val >>> 0;
  for (let i = 0; i < len; i++) {
    out.push(v & 0xff);
    v >>= 8;
  }
  return out;
}

function bytesFromHex(hex) {
  const out = [];
  for (let i = 0; i < hex.length; i += 2)
    out.push(parseInt(hex.slice(i, i + 2), 16));
  return out;
}

const HEX_KEY_BYTES = bytesFromHex(CONFIG.HEX_KEY);

function xorArray(arr) {
  return arr.map((b, i) => (b ^ HEX_KEY_BYTES[i]) & 0xff);
}

function b64StdEncode(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function encodeX3(bytes) {
  const std = b64StdEncode(bytes);
  let out = "";
  const SA = CONFIG.STANDARD_BASE64_ALPHABET,
    CA = CONFIG.X3_BASE64_ALPHABET;
  for (const ch of std) {
    const idx = SA.indexOf(ch);
    out += idx !== -1 ? CA[idx] : ch;
  }
  return out;
}

function b64CustomEncode(s) {
  const bytes = utf8Bytes(s);
  const std = b64StdEncode(bytes);
  let out = "";
  const SA = CONFIG.STANDARD_BASE64_ALPHABET,
    CA = CONFIG.CUSTOM_BASE64_ALPHABET;
  for (const ch of std) {
    const idx = SA.indexOf(ch);
    out += idx !== -1 ? CA[idx] : ch;
  }
  return out;
}

function buildContentString(method, uri, payload) {
  payload = payload || {};
  if (method === "POST") {
    return uri + JSON.stringify(payload);
  }
  const entries = Object.entries(payload);
  if (!entries.length) return uri;
  const parts = entries.map(([key, value]) => {
    let valStr;
    if (Array.isArray(value)) {
      valStr = value
        .map((v) => (v !== undefined && v !== null ? String(v) : ""))
        .join(",");
    } else if (value === null || value === undefined) {
      valStr = "";
    } else {
      valStr = String(value);
    }
    valStr = valStr.replace(/=/g, "%3D");
    return `${key}=${valStr}`;
  });
  return uri + "?" + parts.join("&");
}

function md5Hex(s) {
  return CryptoJS.MD5(s).toString();
}

function structPackLittleEndianQ(ts) {
  const data = new Array(8).fill(0);
  for (let i = 0; i < 8; i++) {
    data[i] = ts & 0xff;
    ts = Math.floor(ts / 256);
  }
  return data;
}

function envFingerprintA(ts, xorKey) {
  const data = structPackLittleEndianQ(ts);

  const sum1 = data[1] + data[2] + data[3] + data[4];
  const sum2 = data[5] + data[6] + data[7];

  const mark = ((sum1 & 0xff) + sum2) & 0xff;
  data[0] = mark;

  for (let i = 0; i < data.length; i++) {
    data[i] ^= xorKey;
  }

  return data;
}

function envFingerprintB(ts) {
  return structPackLittleEndianQ(ts);
}

function buildPayload(dHex, a1, appId, content) {
  const payload = [];

  payload.push(...CONFIG.VERSION_BYTES);

  const seed = rand32();
  const seedBytes = intToLE(seed, 4);
  payload.push(...seedBytes);
  const seedByte0 = seedBytes[0];

  const timestamp = Date.now();
  payload.push(...envFingerprintA(timestamp, CONFIG.ENV_FINGERPRINT_XOR_KEY));

  const timeOffset = randByte(
    CONFIG.ENV_FINGERPRINT_TIME_OFFSET_MIN,
    CONFIG.ENV_FINGERPRINT_TIME_OFFSET_MAX
  );
  payload.push(...envFingerprintB(timestamp - timeOffset * 1000));

  const sequenceValue = randByte(
    CONFIG.SEQUENCE_VALUE_MIN,
    CONFIG.SEQUENCE_VALUE_MAX
  );
  payload.push(...intToLE(sequenceValue, 4));

  const windowPropsLength = randByte(
    CONFIG.WINDOW_PROPS_LENGTH_MIN,
    CONFIG.WINDOW_PROPS_LENGTH_MAX
  );
  payload.push(...intToLE(windowPropsLength, 4));

  const uriLength = content.length;
  payload.push(...intToLE(uriLength, 4));

  const md5Bytes = bytesFromHex(dHex);
  for (let i = 0; i < 8; i++) {
    payload.push(md5Bytes[i] ^ seedByte0);
  }

  payload.push(52);

  const a1Bytes = utf8Bytes(a1);
  const paddedA1 = new Array(52).fill(0);
  for (let i = 0; i < Math.min(a1Bytes.length, 52); i++)
    paddedA1[i] = a1Bytes[i];
  payload.push(...paddedA1);

  payload.push(10);

  const sourceBytes = utf8Bytes(appId);
  const paddedSource = new Array(10).fill(0);
  for (let i = 0; i < Math.min(sourceBytes.length, 10); i++)
    paddedSource[i] = sourceBytes[i];
  payload.push(...paddedSource);

  payload.push(1);
  payload.push(CONFIG.CHECKSUM_VERSION);
  payload.push(seedByte0 ^ CONFIG.CHECKSUM_XOR_KEY);
  payload.push(...CONFIG.CHECKSUM_FIXED_TAIL);

  return payload;
}

function signXs(
  method,
  uri,
  a1Value,
  xsecAppid = "xhs-pc-web",
  payload = null
) {
  method = method.toUpperCase();

  if (uri.indexOf("http") === 0) {
    uri = uri.replace(/^https?:\/\/[^\/]+/, "");
  }
  if (uri.indexOf("?") !== -1) {
    uri = uri.split("?")[0];
  }

  const content = buildContentString(method, uri, payload);
  const dVal = md5Hex(content);
  const payloadArr = buildPayload(
    dVal,
    a1Value.trim(),
    xsecAppid.trim(),
    content
  );
  // console.log("XHSHOW_MIN.js payload:", payloadArr);
  const xorBytes = xorArray(payloadArr);
  const x3Body = encodeX3(xorBytes.slice(0, 124));
  const x3Full = CONFIG.X3_PREFIX + x3Body;
  const jsonCompact = JSON.stringify({ ...CONFIG.TEMPLATE, x3: x3Full });
  const encoded = b64CustomEncode(jsonCompact);
  return CONFIG.XYS_PREFIX + encoded;
}

// --- XsCommon and dependencies (Pure JS) ---

for (
  var c = [],
    d = "ZmserbBoHQtNP+wOcza/LpngG8yJq42KWYj0DSfdikx3VT16IlUAFM97hECvuRX5",
    s = 0,
    f = d.length;
  s < f;
  ++s
)
  c[s] = d[s];
function tripletToBase64(e) {
  return c[(e >> 18) & 63] + c[(e >> 12) & 63] + c[(e >> 6) & 63] + c[63 & e];
}
function encodeChunk(e, a, r) {
  for (var c, d = [], s = a; s < r; s += 3)
    (c =
      ((e[s] << 16) & 0xff0000) + ((e[s + 1] << 8) & 65280) + (255 & e[s + 2])),
      d.push(tripletToBase64(c));
  return d.join("");
}
function encodeUtf8(e) {
  for (var a = encodeURIComponent(e), r = [], c = 0; c < a.length; c++) {
    var d = a.charAt(c);
    if ("%" === d) {
      var s = parseInt(a.charAt(c + 1) + a.charAt(c + 2), 16);
      r.push(s), (c += 2);
    } else r.push(d.charCodeAt(0));
  }
  return r;
}
function b64Encode(e) {
  for (
    var a, r = e.length, d = r % 3, s = [], f = 16383, u = 0, l = r - d;
    u < l;
    u += f
  )
    s.push(encodeChunk(e, u, u + f > l ? l : u + f));
  return (
    1 === d
      ? ((a = e[r - 1]), s.push(c[a >> 2] + c[(a << 4) & 63] + "=="))
      : 2 === d &&
        ((a = (e[r - 2] << 8) + e[r - 1]),
        s.push(c[a >> 10] + c[(a >> 4) & 63] + c[(a << 2) & 63] + "=")),
    s.join("")
  );
}

var gens9 = (function (e) {
  for (var a = 0xedb88320, r, c, d = 256, s = []; d--; s[d] = r >>> 0)
    for (c = 8, r = d; c--; ) r = 1 & r ? (r >>> 1) ^ a : r >>> 1;
  return function (e) {
    if ("string" == typeof e) {
      for (var r = 0, c = -1; r < e.length; ++r)
        c = s[(255 & c) ^ e.charCodeAt(r)] ^ (c >>> 8);
      return -1 ^ c ^ a;
    }
    for (var r = 0, c = -1; r < e.length; ++r)
      c = s[(255 & c) ^ e[r]] ^ (c >>> 8);
    return -1 ^ c ^ a;
  };
})();

const fff =
  "I38rHdgsjopgIvesdVwgIC+oIELmBZ5e3VwXLgFTIxS3bqwErFeexd0ekncAzMFYnqthIhJeSnMDKutRI3KsYorWHPtGrbV0P9WfIi/eWc6eYqtyQApPI37ekmR6QL+5Ii6sdneeSfqYHqwl2qt5B0DBIx++GDi/sVtkIxdsxuwr4qtiIhuaIE3e3LV0I3VTIC7e0utl2ADmsLveDSKsSPw5IEvsiVtJOqw8BuwfPpdeTFWOIx4TIiu6ZPwbPut5IvlaLbgs3qtxIxes1VwHIkumIkIyejgsY/WTge7eSqte/D7sDcpipedeYrDtIC6eDVw2IENsSqtlnlSuNjVtIvoekqt3cZ7sVo4gIESyIhE4NnquIxhnqz8gIkIfoqwkICZW8g3sdlOeVPw3IvAe0fged0YyIi5s3Mc52utAIiKsidvekZNeTPt4nAOeWPwEIvSzaAdeSVwXpnesDqwmI3TrIxE5Luwwaqw+rekhZANe1MNe0Pw9ICNsVLoeSbIFIkosSr7sVnFiIkgsVVtMIiudqqw+tqtWI30e3PwIIhoe3ut1IiOsjut3wutnsPwXICclI3Ir27lk2I5e1utCIES/IEJs0PtnpYIAO0JeYfD1IErPOPtKoqw3I3OexqtWQL5eiz0sVSEyIEJekd/skPtsnPwqICJeSPwiIh5eVAuLIv5eYo/e0PtSICKsVqwV4omqI3RIIkge0e0sYZ0si/7eiuwSIvTeIhqmGuwCIkrPIx0edUzbzbveTPw5IxI0yVwImZeedM0eWVwmeqt2IiM9IhhQLqwJPqtbIxZ=";
function XsCommon(a1, xs, xt) {
  let d = {
    s0: 5,
    s1: "",
    x0: "1",
    x1: "4.2.6",
    x2: "Windows",
    x3: "xhs-pc-web",
    x4: "4.86.0",
    x5: a1,
    x6: "",
    x7: "",
    x8: fff,
    x9: gens9(fff),
    x10: 0,
    x11: "normal",
  };
  let dataStr = JSON.stringify(d);
  return b64Encode(encodeUtf8(dataStr));
}

function get_request_headers_params(api, data, a1, method = "POST") {
  let xs = signXs(method, api, a1, "xhs-pc-web", data);
  let xt = new Date().getTime();
  let xs_common = XsCommon(a1, xs, xt);
  return {
    xs: xs,
    xt: xt,
    xs_common: xs_common,
  };
}

export { signXs, get_request_headers_params };

// Attach to window if available (for non-module usage)
if (typeof window !== "undefined") {
  window.xhshow = {
    signXs,
    get_request_headers_params,
  };
}
