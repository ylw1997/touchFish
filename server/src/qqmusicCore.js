const { createHash } = require("node:crypto");
const { commonHeaders, fetchJson } = require("./upstream");

const BASE_URL = "https://u.y.qq.com/cgi-bin/musicu.fcg";
const ENC_BASE_URL = "https://u.y.qq.com/cgi-bin/musics.fcg";
const VERSION_CODE = 13020508;

const PART_1_INDEXES = [23, 14, 6, 36, 16, 40, 7, 19].filter((x) => x < 40);
const PART_2_INDEXES = [16, 1, 32, 12, 19, 27, 8, 5];
const SCRAMBLE_VALUES = [89, 39, 179, 150, 218, 82, 58, 252, 177, 52, 186, 123, 120, 64, 242, 133, 143, 161, 121, 179];

function sign(request) {
  const jsonStr = JSON.stringify(request);
  const hash = createHash("sha1").update(jsonStr).digest("hex").toUpperCase();
  const part1 = PART_1_INDEXES.map((i) => hash.charAt(i)).join("");
  const part2 = PART_2_INDEXES.map((i) => hash.charAt(i)).join("");
  const part3 = new Uint8Array(20);
  for (let i = 0; i < SCRAMBLE_VALUES.length; i += 1) {
    part3[i] = SCRAMBLE_VALUES[i] ^ parseInt(hash.substring(i * 2, i * 2 + 2), 16);
  }
  const b64Part = Buffer.from(part3).toString("base64").replace(/[\\/+=]/g, "");
  return `zzc${part1}${b64Part}${part2}`.toLowerCase();
}

function readConfig(configStore, key) {
  return configStore.get(key) || configStore.get(`touchfish.${key}`) || "";
}

function getCredential(configStore) {
  const musicid = readConfig(configStore, "qqmusicMusicid");
  const musickey = readConfig(configStore, "qqmusicMusickey");
  if (!musicid || !musickey) return null;
  return {
    musicid: String(musicid),
    musickey: String(musickey),
    tmeLoginType: String(musickey).startsWith("W_X") ? "1" : "2",
  };
}

function buildCommonParams(configStore, extra = {}) {
  const credential = getCredential(configStore);
  const params = {
    cv: VERSION_CODE,
    v: VERSION_CODE,
    ct: "11",
    tmeAppID: "qqmusic",
    format: "json",
    inCharset: "utf-8",
    outCharset: "utf-8",
    uid: "0",
    ...extra,
  };
  if (credential) {
    params.uid = credential.musicid;
    params.qq = credential.musicid;
    params.authst = credential.musickey;
    params.loginUin = credential.musicid;
    params.tmeLoginType = credential.tmeLoginType;
  }
  return params;
}

function headers(configStore) {
  const credential = getCredential(configStore);
  const result = commonHeaders("", {
    "content-type": "application/json",
    referer: "https://y.qq.com/",
    origin: "https://y.qq.com",
  });
  if (credential) {
    result.cookie =
      `uin=${credential.musicid}; qqmusic_key=${credential.musickey}; qm_keyst=${credential.musickey}; tmeLoginType=${credential.tmeLoginType};` +
      (credential.tmeLoginType === "1" ? ` wxuin=${credential.musicid};` : "");
  }
  return result;
}

function guid() {
  return "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx".replace(/x/g, () => ((Math.random() * 16) | 0).toString(16));
}

async function musicu(ctx, modules, { signed = false, comm = {} } = {}) {
  const requestData = {
    comm: buildCommonParams(ctx.configStore, comm),
    ...modules,
  };
  const target = new URL(signed ? ENC_BASE_URL : BASE_URL);
  if (signed) target.searchParams.set("sign", sign(requestData));
  return fetchJson(ctx.fetchImpl, target.toString(), {
    method: "POST",
    headers: headers(ctx.configStore),
    body: JSON.stringify(requestData),
  });
}

function song(item = {}) {
  return {
    mid: item.mid || item.songmid,
    id: item.id || item.songid,
    name: item.name || item.songname || item.title,
    title: item.title || item.songname || item.name,
    singer: item.singer || [],
    album: item.album || {
      name: item.albumname,
      mid: item.albummid,
      pmid: item.albummid,
    },
    interval: item.interval || 0,
    isonly: item.isonly || 0,
    pay: item.pay,
    file: item.file || { media_mid: item.strMediaMid || item.media_mid },
    mv: item.mv || { vid: item.vid },
  };
}

function playlist(item = {}) {
  return {
    dissid: item.dissid || item.tid || item.id,
    dirid: item.dirId,
    dissname: item.dissname || item.title || item.dirName,
    logo: item.logo || item.picUrl || item.picurl,
    nick: item.nick,
    songnum: item.songnum || item.songNum || item.song_cnt,
    listennum: item.listennum || item.play_cnt,
    desc: item.desc,
  };
}

async function getEuin(ctx, musicid) {
  const target = `https://c6.y.qq.com/rsc/fcgi-bin/fcg_get_profile_homepage.fcg?ct=20&cv=4747474&cid=205360838&userid=${encodeURIComponent(musicid)}`;
  const result = await fetchJson(ctx.fetchImpl, target, { headers: commonHeaders("", { referer: "https://y.qq.com/" }) });
  return result.data?.data?.creator?.encrypt_uin || "";
}

function requireCredential(ctx) {
  const credential = getCredential(ctx.configStore);
  if (!credential) {
    const error = new Error("未配置 QQ 音乐登录凭证");
    error.statusCode = 400;
    throw error;
  }
  return credential;
}

module.exports = {
  buildCommonParams,
  getCredential,
  getEuin,
  guid,
  headers,
  musicu,
  playlist,
  requireCredential,
  sign,
  song,
};
