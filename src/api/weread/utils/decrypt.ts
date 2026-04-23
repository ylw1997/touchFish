/**
 * utils.js 中的 1111模块(解密及验证工具)
 */

import { base64Decode, md5 } from "./encode";

function decrypt(data: string) {
  if (!data || "string" != typeof data || data.length <= 1) {
    return "";
  }
  let result = data.slice(1);
  result = function (result) {
    const _0x402072 = function () {
      const len = result.length;
      if (len < 4) {
        return [];
      }
      if (len < 11) {
        return [0, 2];
      }

      const _0x20b71e = Math.min(4, Math.ceil(len / 10));
      let _0x2afb18 = "";
      for (let i = len - 1; i > len - 1 - _0x20b71e; i--) {
        const _0x186eec = result.charCodeAt(i);
        _0x2afb18 += parseInt(_0x186eec.toString(2), 4);
      }

      const _0x27af8b = len - _0x20b71e - 2,
        _0x586d78 = _0x27af8b.toString().length,
        _0x1d71d6 = [];
      for (
        let i = 0;
        _0x1d71d6.length < 10 && i + _0x586d78 < _0x2afb18.length;
        i += _0x586d78
      ) {
        let _0x352ab7 = parseInt(_0x2afb18.slice(i, i + _0x586d78));
        _0x1d71d6.push(_0x352ab7 % _0x27af8b);
        _0x352ab7 = parseInt(_0x2afb18.slice(i + 1, i + 1 + _0x586d78));
        _0x1d71d6.push(_0x352ab7 % _0x27af8b);
      }
      return _0x1d71d6;
    }();
    return function (_0x4e56fa, _0x11d5c6) {
      const _0x51ba85 = _0x4e56fa.split("");
      for (let i = _0x11d5c6.length - 1; i >= 0; i -= 2) {
        for (let j = 1; j >= 0; j--) {
          const _0x262bf2 = _0x51ba85[_0x11d5c6[i] + j];
          _0x51ba85[_0x11d5c6[i] + j] = _0x51ba85[_0x11d5c6[i - 0x1] + j];
          _0x51ba85[_0x11d5c6[i - 1] + j] = _0x262bf2;
        }
      }
      return _0x51ba85.join("");
    }(result, _0x402072);
  }(result);

  result = base64Decode(result);
  return result;
}

export function chk(data: string) {
  if (!data || data.length <= 32) {
    return data;
  }

  const header = data.slice(0, 32);
  const body = data.slice(32);
  return header === md5(body).toUpperCase() ? body : "";
}

export function dT(data: string) {
  return data && 0 !== data.length ? decrypt(data) : "";
}

export function dH(data: string) {
  return data && 0 !== data.length ? decrypt(data) : "";
}

export function dS(data: string) {
  return data && 0 !== data.length ? decrypt(data) : "";
}

export function cs(data: string, radix = 21) {
  let result = "";
  for (let i = 0, strlen = data.length; i < strlen; i += 2) {
    result += String.fromCharCode(parseInt(data.slice(i, i + 2), radix));
  }
  return result;
}
