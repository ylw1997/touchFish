// Minimal JS implementation: only signXs (random mode)
// Browser compatible version (No Node.js dependencies)
// Usage:
//   import { signXs } from './xhs.js';
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
    "71a302257793271ddd273bcee3e4b98d9d7935e1da33f5765e2ea8afb6dc77a51a499d23b67c20660025860cbf13d4540d92497f58686c574e508f46e1956344f39139bf4faf22a3eef120b79258145b2feb5193b6478669961298e79bedca646e1a693a926154a5a7a1bd1cf0dedb742f917a747a1e388b234f2277516db7116035439730fa61e9822a0eca7bff72d8",
  VERSION_BYTES: [121, 104, 96, 41],
  PAYLOAD_LENGTH: 144,
  A1_LENGTH: 52,
  APP_ID_LENGTH: 10,
  MD5_XOR_LENGTH: 8,
  TIMESTAMP_LE_LENGTH: 8,
  ENV_FINGERPRINT_XOR_KEY: 41,
  SEQUENCE_VALUE_MIN: 15,
  SEQUENCE_VALUE_MAX: 50,
  WINDOW_PROPS_LENGTH_MIN: 1000,
  WINDOW_PROPS_LENGTH_MAX: 1200,
  CHECKSUM_VERSION: 1,
  CHECKSUM_XOR_KEY: 115,
  CHECKSUM_FIXED_TAIL: [
    249, 65, 103, 103, 201, 181, 131, 99, 94, 7, 68, 250, 132, 21,
  ],
  ENV_TABLE: [115, 248, 83, 102, 103, 201, 181, 131, 99, 94, 4, 68, 250, 132, 21],
  ENV_CHECKS_DEFAULT: [0, 1, 18, 1, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0],
  HASH_IV: [1831565813, 461845907, 2246822507, 3266489909],
  A3_PREFIX: [2, 97, 51, 16],
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
    v = v >>> 8;
  }
  // For len > 4 (e.g. 8-byte timestamp), pad with zeros
  while (out.length < len) {
    out.push(0);
  }
  return out;
}

function intToLE8(val) {
  // Convert a potentially large integer (e.g. timestamp ms) to 8-byte LE
  const out = [];
  let v = val;
  for (let i = 0; i < 8; i++) {
    out.push(v & 0xff);
    v = Math.floor(v / 256);
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
  return arr.map((b, i) =>
    i < HEX_KEY_BYTES.length ? (b ^ HEX_KEY_BYTES[i]) & 0xff : b & 0xff,
  );
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
    // URL encode but keep commas unencoded (matching Python urllib.parse.quote with safe=",")
    const encodedValue = encodeURIComponent(valStr).replace(/%2C/g, ",");
    return `${key}=${encodedValue}`;
  });
  return uri + "?" + parts.join("&");
}

function md5Hex(s) {
  return CryptoJS.MD5(s).toString();
}

// --- Extract API path from content string ---

function extractApiPath(contentString) {
  const bracePos = contentString.indexOf("{");
  const questionPos = contentString.indexOf("?");

  if (bracePos !== -1 && questionPos !== -1) {
    return contentString.slice(0, Math.min(bracePos, questionPos));
  } else if (bracePos !== -1) {
    return contentString.slice(0, bracePos);
  } else if (questionPos !== -1) {
    return contentString.slice(0, questionPos);
  } else {
    return contentString;
  }
}

// --- Custom hash v2 (128-bit) ---

function rotateLeft32(val, n) {
  return ((val << n) | (val >>> (32 - n))) >>> 0;
}

function customHashV2(inputBytes) {
  let [s0, s1, s2, s3] = CONFIG.HASH_IV;
  const length = inputBytes.length;

  s0 = (s0 ^ length) >>> 0;
  s1 = (s1 ^ ((length << 8) >>> 0)) >>> 0;
  s2 = (s2 ^ ((length << 16) >>> 0)) >>> 0;
  s3 = (s3 ^ ((length << 24) >>> 0)) >>> 0;

  for (let i = 0; i < Math.floor(length / 8); i++) {
    // Read two 32-bit LE values
    let v0 = 0,
      v1 = 0;
    for (let j = 0; j < 4; j++) {
      v0 |= (inputBytes[i * 8 + j] & 0xff) << (j * 8);
      v1 |= (inputBytes[i * 8 + 4 + j] & 0xff) << (j * 8);
    }
    v0 = v0 >>> 0;
    v1 = v1 >>> 0;

    s0 = rotateLeft32(((s0 + v0) >>> 0) ^ s2, 7);
    s1 = rotateLeft32(((v0 ^ s1) + s3) >>> 0, 11);
    s2 = rotateLeft32(((s2 + v1) >>> 0) ^ s0, 13);
    s3 = rotateLeft32(((s3 ^ v1) + s1) >>> 0, 17);
  }

  let t0 = (s0 ^ length) >>> 0;
  let t1 = (s1 ^ t0) >>> 0;
  let t2 = (s2 + t1) >>> 0;
  let t3 = (s3 ^ t2) >>> 0;

  const rt0 = rotateLeft32(t0, 9);
  const rt1 = rotateLeft32(t1, 13);
  const rt2 = rotateLeft32(t2, 17);
  const rt3 = rotateLeft32(t3, 19);

  s0 = (rt0 + rt2) >>> 0;
  s1 = (rt1 ^ rt3) >>> 0;
  s2 = (rt2 + s0) >>> 0;
  s3 = (rt3 ^ s1) >>> 0;

  const result = [];
  for (const s of [s0, s1, s2, s3]) {
    for (let j = 0; j < 4; j++) {
      result.push((s >>> (j * 8)) & 0xff);
    }
  }
  return result;
}

// --- Build 144-byte payload ---

function buildPayload(dHex, a1, appId, content) {
  const payload = [];
  const timestamp = Date.now();

  // Version bytes [4]
  payload.push(...CONFIG.VERSION_BYTES);

  // Seed [4]
  const seed = rand32();
  const seedBytes = intToLE(seed, 4);
  payload.push(...seedBytes);
  const seedByte = seedBytes[0];

  // Timestamp LE [8] - direct, no fingerprint A
  const tsBytes = intToLE8(timestamp);
  payload.push(...tsBytes);

  // Page load timestamp LE [8] - direct, no fingerprint B
  const timeOffset = randByte(
    CONFIG.ENV_FINGERPRINT_TIME_OFFSET_MIN,
    CONFIG.ENV_FINGERPRINT_TIME_OFFSET_MAX,
  );
  const effectiveTsMs = timestamp - timeOffset * 1000;
  payload.push(...intToLE8(effectiveTsMs));

  // Sequence value [4]
  const sequenceValue = randByte(
    CONFIG.SEQUENCE_VALUE_MIN,
    CONFIG.SEQUENCE_VALUE_MAX,
  );
  payload.push(...intToLE(sequenceValue, 4));

  // Window props length [4]
  const windowPropsLength = randByte(
    CONFIG.WINDOW_PROPS_LENGTH_MIN,
    CONFIG.WINDOW_PROPS_LENGTH_MAX,
  );
  payload.push(...intToLE(windowPropsLength, 4));

  // URI length [4] - UTF-8 byte length
  const uriLength = utf8Bytes(content).length;
  payload.push(...intToLE(uriLength, 4));

  // MD5 XOR segment [8]
  const md5BytesArr = bytesFromHex(dHex);
  for (let i = 0; i < CONFIG.MD5_XOR_LENGTH; i++) {
    payload.push(md5BytesArr[i] ^ seedByte);
  }

  // A1 [1 + 52]
  const a1Bytes = utf8Bytes(a1);
  const paddedA1 = new Array(CONFIG.A1_LENGTH).fill(0);
  for (let i = 0; i < Math.min(a1Bytes.length, CONFIG.A1_LENGTH); i++)
    paddedA1[i] = a1Bytes[i];
  payload.push(paddedA1.length);
  payload.push(...paddedA1);

  // App ID [1 + 10]
  const sourceBytes = utf8Bytes(appId);
  const paddedSource = new Array(CONFIG.APP_ID_LENGTH).fill(0);
  for (let i = 0; i < Math.min(sourceBytes.length, CONFIG.APP_ID_LENGTH); i++)
    paddedSource[i] = sourceBytes[i];
  payload.push(paddedSource.length);
  payload.push(...paddedSource);

  // Part 11: environment detection XOR [16]
  const part11 = [1, seedByte ^ CONFIG.ENV_TABLE[0]];
  for (let i = 1; i < 15; i++) {
    part11.push(CONFIG.ENV_TABLE[i] ^ CONFIG.ENV_CHECKS_DEFAULT[i]);
  }
  payload.push(...part11);

  // A3 field: A3_PREFIX [4] + customHashV2(tsBytes + md5PathBytes) XOR seedByte [16]
  const apiPath = extractApiPath(content);
  const apiPathMd5Hex = CryptoJS.MD5(
    CryptoJS.lib.WordArray.create(new Uint8Array(utf8Bytes(apiPath))),
  ).toString();
  const md5PathBytes = bytesFromHex(apiPathMd5Hex);

  const hashInput = [...tsBytes, ...md5PathBytes];
  const hashResult = customHashV2(hashInput);

  payload.push(...CONFIG.A3_PREFIX);
  for (let i = 0; i < hashResult.length; i++) {
    payload.push(hashResult[i] ^ seedByte);
  }

  return payload;
}

function signXs(
  method,
  uri,
  a1Value,
  xsecAppid = "xhs-pc-web",
  payload = null,
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
    content,
  );
  const xorBytes = xorArray(payloadArr);
  const x3Body = encodeX3(xorBytes.slice(0, CONFIG.PAYLOAD_LENGTH));
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
    ((c =
      ((e[s] << 16) & 0xff0000) + ((e[s + 1] << 8) & 65280) + (255 & e[s + 2])),
      d.push(tripletToBase64(c)));
  return d.join("");
}
function encodeUtf8(e) {
  for (var a = encodeURIComponent(e), r = [], c = 0; c < a.length; c++) {
    var d = a.charAt(c);
    if ("%" === d) {
      var s = parseInt(a.charAt(c + 1) + a.charAt(c + 2), 16);
      (r.push(s), (c += 2));
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
