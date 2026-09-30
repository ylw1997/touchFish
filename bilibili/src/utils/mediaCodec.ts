/*
 * @Description: FFmpeg 媒体编解码能力检测与替换命令工具
 */
import { vscode } from "./vscode";

export interface MediaCodecSupport {
  isSupported: boolean;
  hasH264: boolean;
  hasAAC: boolean;
}

/**
 * 检测当前 VS Code Electron 环境是否支持 H.264 与 AAC 解码
 * VS Code 默认打包的 Electron 去除了专利编解码器，若未替换 FFmpeg，则无法播放或无声音
 */
export function checkFFmpegSupport(): MediaCodecSupport {
  if (typeof document === "undefined") {
    return { isSupported: true, hasH264: true, hasAAC: true };
  }

  const video = document.createElement("video");
  const canH264 =
    video.canPlayType('video/mp4; codecs="avc1.42E01E"') !== "" ||
    video.canPlayType('video/mp4; codecs="avc1.640028"') !== "";

  const canAAC =
    video.canPlayType('audio/mp4; codecs="mp4a.40.2"') !== "" ||
    video.canPlayType('audio/mp4; codecs="mp4a.40.5"') !== "";

  const msSupported = typeof MediaSource !== "undefined";
  const msH264 =
    msSupported &&
    (MediaSource.isTypeSupported('video/mp4; codecs="avc1.42E01E"') ||
      MediaSource.isTypeSupported('video/mp4; codecs="avc1.640028"'));

  const msAAC =
    msSupported &&
    (MediaSource.isTypeSupported('audio/mp4; codecs="mp4a.40.2"') ||
      MediaSource.isTypeSupported('audio/mp4; codecs="mp4a.40.5"'));

  const hasH264 = Boolean(canH264 || msH264);
  const hasAAC = Boolean(canAAC || msAAC);

  return {
    isSupported: hasH264 && hasAAC,
    hasH264,
    hasAAC,
  };
}

export const FFMPEG_COMMANDS = {
  windows:
    "Invoke-RestMethod https://raw.githubusercontent.com/ylw1997/touchFish/refs/heads/main/reaplace-ffmpeg.py | python",
  unix:
    "curl https://raw.githubusercontent.com/ylw1997/touchFish/refs/heads/main/reaplace-ffmpeg.py | python3",
};

/**
 * 上报缺少 FFmpeg 模块，通知 VS Code 弹出原生替换提示弹窗
 */
export function reportFFmpegMissing(): void {
  try {
    vscode.postMessage({
      command: "REPORT_FFMPEG_MISSING",
    });
  } catch (err) {
    console.warn("上报 FFmpeg 缺失失败:", err);
  }
}

/**
 * 将文本复制到剪贴板（同时支持原生 clipboard API 与 VS Code 扩展端中转）
 */
export async function copyCommand(text: string): Promise<boolean> {
  let copied = false;
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      copied = true;
    }
  } catch (err) {
    console.warn("navigator.clipboard.writeText 失败，尝试扩展端复制:", err);
  }

  try {
    vscode.postMessage({
      command: "COPY_TO_CLIPBOARD",
      payload: { text },
    });
    copied = true;
  } catch (err) {
    console.warn("向扩展端发送复制消息失败:", err);
  }

  return copied;
}

