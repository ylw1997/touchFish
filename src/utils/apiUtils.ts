/*
 * @Description: API 公共工具函数
 * 提取 weibo、zhihu、xhs 等 API 模块的通用逻辑
 */
import * as vscode from "vscode";
import { setConfigByKey } from "../core/config";

/**
 * 通用的 Cookie 获取和设置函数
 * @param configKey - 配置键名（如 "weiboCookie", "zhihuCookie"）
 * @param promptMessage - 提示用户输入的消息
 * @returns Cookie 字符串，如果用户取消则返回 undefined
 */
export async function getOrSetCookie(
  configKey: string,
  promptMessage: string
): Promise<string | undefined> {
  const config = vscode.workspace.getConfiguration("touchfish");
  let cookie = config.get(configKey) as string | undefined;

  // 如果没有就请求用户输入 cookie
  if (!cookie) {
    cookie = await vscode.window.showInputBox({
      placeHolder: promptMessage,
      prompt: promptMessage,
    });

    if (cookie) {
      await setConfigByKey(configKey, cookie);
    }
  }

  return cookie;
}

/**
 * 从 Cookie 字符串中提取指定字段的值
 * @param cookie - Cookie 字符串
 * @param field - 要提取的字段名
 * @returns 字段值，如果不存在则返回 undefined
 */
export function getCookieField(
  cookie: string,
  field: string
): string | undefined {
  if (!cookie) return undefined;

  const cookieParts = cookie.split(";");
  for (const part of cookieParts) {
    const [key, ...value] = part.split("=");
    if (key.trim() === field) {
      return value.join("=");
    }
  }

  return undefined;
}

/**
 * 构建通用的请求头
 * @param cookie - Cookie 字符串
 * @param extraHeaders - 额外的请求头
 * @returns 请求头对象
 */
export function buildCommonHeaders(
  cookie: string,
  extraHeaders: Record<string, string> = {}
): Record<string, string> {
  return {
    Cookie: cookie,
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
    ...extraHeaders,
  };
}
