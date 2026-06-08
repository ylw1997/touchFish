export const CryptoConfig = {
  // Bitwise operation constants
  MAX_32BIT: 0xFFFFFFFF,
  MAX_SIGNED_32BIT: 0x7FFFFFFF,
  MAX_BYTE: 255,

  // Base64 encoding constants
  STANDARD_BASE64_ALPHABET: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
  CUSTOM_BASE64_ALPHABET: "ZmserbBoHQtNP+wOcza/LpngG8yJq42KWYj0DSfdikx3VT16IlUAFM97hECvuRX5",
  X3_BASE64_ALPHABET: "MfgqrsbcyzPQRStuvC7mn501HIJBo2DEFTKdeNOwxWXYZap89+/A4UVLhijkl63G",

  // XOR key for payload transformation (144 bytes)
  HEX_KEY: "71a302257793271ddd273bcee3e4b98d9d7935e1da33f5765e2ea8afb6dc77a51a499d23b67c20660025860cbf13d4540d92497f58686c574e508f46e1956344f39139bf4faf22a3eef120b79258145b2feb5193b6478669961298e79bedca646e1a693a926154a5a7a1bd1cf0dedb742f917a747a1e388b234f2277516db7116035439730fa61e9822a0eca7bff72d8",

  // Hexadecimal processing constants
  EXPECTED_HEX_LENGTH: 32,
  OUTPUT_BYTE_COUNT: 8,
  HEX_CHUNK_SIZE: 2,

  // Payload construction constants
  VERSION_BYTES: [121, 104, 96, 41],
  PAYLOAD_LENGTH: 144,
  A1_LENGTH: 52,
  APP_ID_LENGTH: 10,
  MD5_XOR_LENGTH: 8,
  A3_PREFIX: [2, 97, 51, 16],
  TIMESTAMP_LE_LENGTH: 8,

  // Random value ranges
  SEQUENCE_VALUE_MIN: 15,
  SEQUENCE_VALUE_MAX: 50,
  WINDOW_PROPS_LENGTH_MIN: 1000,
  WINDOW_PROPS_LENGTH_MAX: 1200,

  // Environment detection constants (15 values for part11 XOR)
  ENV_TABLE: [115, 248, 83, 102, 103, 201, 181, 131, 99, 94, 4, 68, 250, 132, 21],

  // Default environment check values (normal browser)
  ENV_CHECKS_DEFAULT: [0, 1, 18, 1, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0],

  // custom_hash_v2 initial vector
  HASH_IV: [1831565813, 461845907, 2246822507, 3266489909],

  // Environment fingerprint generation parameters
  ENV_FINGERPRINT_XOR_KEY: 41,
  ENV_FINGERPRINT_TIME_OFFSET_MIN: 10,
  ENV_FINGERPRINT_TIME_OFFSET_MAX: 50,

  // Signature data template
  SIGNATURE_DATA_TEMPLATE: {
    x0: "4.2.6",
    x1: "xhs-pc-web",
    x2: "Windows",
    x3: "",
    x4: "",
  },

  // Prefix constants
  X3_PREFIX: "mns0301_",
  XYS_PREFIX: "XYS_",

  // Trace ID generation constants
  HEX_CHARS: "abcdef0123456789",
  XRAY_TRACE_ID_SEQ_MAX: 8388607,
  XRAY_TRACE_ID_TIMESTAMP_SHIFT: 23,
  XRAY_TRACE_ID_PART1_LENGTH: 16,
  XRAY_TRACE_ID_PART2_LENGTH: 16,
  B3_TRACE_ID_LENGTH: 16,

  // b1 secret key
  B1_SECRET_KEY: "xhswebmplfbt",

  SIGNATURE_XSCOMMON_TEMPLATE: {
    s0: 5,
    s1: "",
    x0: "1",
    x1: "4.3.3",
    x2: "Windows",
    x3: "xhs-pc-web",
    x4: "4.86.0",
    x5: "",
    x6: "",
    x7: "",
    x8: "",
    x9: 0,
    x10: 0,
    x11: "normal",
  },

  PUBLIC_USERAGENT: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0",
};
