import { md5 } from "./encode";

// export const getUlid = ulid.monotonicFactory();


/**
 * 根据 ua 生成 appid
 * @param ua 用户代理字符串
 */
export function getAppId(ua: string) {
  let rnd1 = "";
  const uaParts = ua.split(" ");
  const uaPartCount = Math.min(uaParts.length, 12);

  for (let i = 0; i < uaPartCount; i++) {
    rnd1 += uaParts[i].length % 10;
  }

  let rnd2 = function (ua) {
    let num = 0;
    const len = ua.length;

    for (let i = 0; i < len; i++) {
      num = 131 * num + ua.charCodeAt(i) & 0x7fffffff;
    }
    return num.toString();
  }(ua);
  if (rnd2.length > 16) {
    rnd2 = rnd2.slice(0, 16);
  }
  return "wb" + rnd1 + "h" + rnd2;
}

function _sign(data: string): string {
  let n1 = 0x15051505;
  let n2 = 0x15051505;
  const strlen = data.length;

  for (let i = strlen - 1; i > 0; i -= 2) {
    n1 = 0x7fffffff & (n1 ^ data.charCodeAt(i) << (strlen - i) % 30);
    n2 = 0x7fffffff & (n2 ^ data.charCodeAt(i - 1) << i % 30);
  }
  return (n1 + n2).toString(16).toLowerCase();
}

function _stringify(data: Record<string, any>, keys: string[] = []) {
  let result = "";
  const all = 0 === keys.length;
  const objKeys = Object.keys(data).sort();

  for (let i = 0; i < objKeys.length; i++) {
    const key = objKeys[i];
    if (all || -1 !== keys.indexOf(key)) {
      const value = data[key];
      result += key + "=" + encodeURIComponent(value);
      result += "&";
    }
  }
  if (result.length > 0 && "&" === result.charAt(result.length - 1)) {
    result = result.slice(0, result.length - 1);
  }
  return result;
}

/**
 * 计算 payload 的签名
 * @param data
 */
export function sign(data: Record<string, any>): string {
  return _sign(_stringify(data));
}

/**
 * 计算参数的 hash
 * @param data
 */
export function calcHash(data: string | number): string {
  if (typeof data === "number") {
    data = data.toString();
  }
  if (typeof data !== "string") {
    return data;
  }

  const dataMd5 = md5(data);
  let _0x38b4d1 = dataMd5.substr(0, 3); // 3
  const _0x4718f7 = function (data) {
    if (/^\d*$/.test(data)) {
      const dataLen = data.length;
      const _0xd2c2b1 = [];
      for (let i = 0; i < dataLen; i += 9) {
        const _0x56eaa4 = data.slice(i, Math.min(i + 9, dataLen));
        _0xd2c2b1.push(parseInt(_0x56eaa4).toString(16));
      }
      return ["3", _0xd2c2b1];
    }

    let _0x397242 = "";
    for (let i = 0; i < data.length; i++) {
      _0x397242 += data.charCodeAt(i).toString(16);
    }
    return ["4", [_0x397242]];
  }(data);

  _0x38b4d1 += _0x4718f7[0]; // 4
  _0x38b4d1 += 2 + dataMd5.substr(dataMd5.length - 2, 2); // 7

  const _0x1e41f3 = _0x4718f7[1];
  for (let i = 0; i < _0x1e41f3.length; i++) {
    let _0x5c593c = _0x1e41f3[i].length.toString(16);
    if (1 === _0x5c593c.length) {
      _0x5c593c = "0" + _0x5c593c;
    }
    _0x38b4d1 += _0x5c593c;
    _0x38b4d1 += _0x1e41f3[i];
    if (i < _0x1e41f3.length - 1) {
      _0x38b4d1 += "g";
    }
  }

  if (_0x38b4d1.length < 20) {
    _0x38b4d1 += dataMd5.substr(0, 20 - _0x38b4d1.length);
  }

  return _0x38b4d1 + md5(_0x38b4d1).substr(0, 3);
}

/**
 * 当前时间，单位是秒
 */
export function currentTime() {
  return Math.floor(new Date().getTime() / 1000);
}

/**
 * 当前时间戳，单位是毫秒
 */
export function timestamp() {
  return new Date().getTime()
}

export function generateQRCode(data: string) {
  const query = new URLSearchParams({
    cht: "qr", // Chart type
    chs: "300x300", // QR code dimensions
    chl: data, // Data embedded in QR code
  });
  return "https://chart.googleapis.com/chart?" + query.toString();
}

export function runInDenoDeploy() {
  return false;
}

/**
 * 睡眠
 * @param duration 毫秒
 */
export function sleep(duration: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, duration);
  });
}


export function now(): string {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "short",
    timeStyle: "medium",
    timeZone: "Asia/Shanghai",
  }).format(new Date());
}

function stringify(data: unknown) {
  return JSON.stringify(data)
}

export function jsonResponse(data: unknown) {
  return new Response(
      stringify(data),
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
  );
}

/**
 * 生成一个随机整数
 * @param min 最小值(包含)
 * @param max 最大值(包含)
 */
export function randomInteger(min: number, max: number) {
  // here rand is from min to (max+1)
  const rand = min + Math.random() * (max + 1 - min);
  return Math.floor(rand);
}

/**
 * 格式化秒
 * @param seconds
 */
export function formatSeconds(seconds: number) {
  if (typeof seconds !== 'number') {
    return seconds
  }
  if (seconds < 60) {
    return `${seconds}s`
  }
  const minutes = Math.floor(seconds / 60)
  const second = seconds % 60
  if (minutes < 60) {
    return `${minutes}m${second}s`
  }
  const hours = Math.floor(minutes / 60)
  const minute = minutes % 60
  return `${hours}h${minute}m${second}s`
}
/**
 * 解析 Cookie 字符串为对象
 */
export function parseCookie(cookie: string): Record<string, string> {
  return cookie.split(";").reduce((res, item) => {
    const [name, ...value] = item.trim().split("=");
    if (name) {
      res[name] = value.join("=");
    }
    return res;
  }, {} as Record<string, string>);
}

/**
 * 将 Cookie 对象转换回字符串
 */
export function stringifyCookie(cookies: Record<string, string>): string {
  return Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

/**
 * 更新 Cookie 字符串中的某些值
 */
export function updateCookie(oldCookie: string, newValues: Record<string, string>): string {
  const cookies = parseCookie(oldCookie);
  Object.assign(cookies, newValues);
  return stringifyCookie(cookies);
}
