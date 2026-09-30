/*
 * @Description: VS Code 原生 FFmpeg 模块替换提示弹窗
 */
import * as vscode from "vscode";

// 国内加速 CDN 镜像（无需代理，秒级直连下载）
export const FFMPEG_WINDOWS_CMD_CDN =
  "Invoke-RestMethod https://fastly.jsdelivr.net/gh/ylw1997/touchFish@main/replace-ffmpeg.py | python";

export const FFMPEG_UNIX_CMD_CDN =
  "curl -fsSL https://fastly.jsdelivr.net/gh/ylw1997/touchFish@main/replace-ffmpeg.py | python3";

// GitHub Raw 直连地址（备用）
export const FFMPEG_WINDOWS_CMD_RAW =
  "Invoke-RestMethod https://raw.githubusercontent.com/ylw1997/touchFish/refs/heads/main/reaplace-ffmpeg.py | python";

export const FFMPEG_UNIX_CMD_RAW =
  "curl https://raw.githubusercontent.com/ylw1997/touchFish/refs/heads/main/reaplace-ffmpeg.py | python3";

// 默认命令优先采用更稳定的 CDN 加速链接，防止国内 DNS 污染导致“拿不到脚本”
export const FFMPEG_WINDOWS_CMD = FFMPEG_WINDOWS_CMD_CDN;
export const FFMPEG_UNIX_CMD = FFMPEG_UNIX_CMD_CDN;

let lastNoticeTimestamp = 0;
const NOTICE_THROTTLE_MS = 10000; // 10秒内避免重复弹出

/**
 * 弹出 VS Code 原生警告弹窗，提示用户替换 FFmpeg 模块，并支持一键复制命令
 */
export async function showFFmpegReplaceNotice(
  context?: vscode.ExtensionContext,
  force = false,
): Promise<void> {
  const now = Date.now();
  if (!force && now - lastNoticeTimestamp < NOTICE_THROTTLE_MS) {
    return;
  }
  lastNoticeTimestamp = now;

  const isWindows = process.platform === "win32";
  const primaryBtn = isWindows
    ? "一键复制 Windows 命令(加速源)"
    : "一键复制 Linux/macOS 命令(加速源)";
  const secondaryBtn = isWindows
    ? "复制 Linux/macOS 命令"
    : "复制 Windows 命令";
  const rawBtn = "复制 GitHub Raw 命令";
  const docBtn = "查看解决方法";

  const message =
    "检测到当前 VS Code 缺少媒体编解码支持（未替换 FFmpeg 模块），导致音视频无法播放或无声音（非网络错误）。请在终端中运行替换脚本：";

  const selected = await vscode.window.showWarningMessage(
    message,
    primaryBtn,
    secondaryBtn,
    rawBtn,
    docBtn,
  );

  if (selected === primaryBtn) {
    const cmd = isWindows ? FFMPEG_WINDOWS_CMD_CDN : FFMPEG_UNIX_CMD_CDN;
    await vscode.env.clipboard.writeText(cmd);
    vscode.window.showInformationMessage(
      `已复制${isWindows ? " Windows " : " Linux/macOS "}加速命令到剪贴板，请在终端中执行`,
    );
  } else if (selected === secondaryBtn) {
    const cmd = isWindows ? FFMPEG_UNIX_CMD_CDN : FFMPEG_WINDOWS_CMD_CDN;
    await vscode.env.clipboard.writeText(cmd);
    vscode.window.showInformationMessage(
      `已复制${isWindows ? " Linux/macOS " : " Windows "}命令到剪贴板，请在终端中执行`,
    );
  } else if (selected === rawBtn) {
    const cmd = isWindows ? FFMPEG_WINDOWS_CMD_RAW : FFMPEG_UNIX_CMD_RAW;
    await vscode.env.clipboard.writeText(cmd);
    vscode.window.showInformationMessage(
      "已复制 GitHub Raw 原始命令（需代理环境）",
    );
  } else if (selected === docBtn) {
    await vscode.env.openExternal(
      vscode.Uri.parse(
        "https://github.com/ylw1997/touchFish#%EF%B8%8F-%E6%B3%A8%E6%84%8F%E4%BA%8B%E9%A1%B9",
      ),
    );
  }
}

