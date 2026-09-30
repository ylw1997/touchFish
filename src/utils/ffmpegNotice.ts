/*
 * @Description: VS Code 原生 FFmpeg 模块替换提示弹窗
 */
import * as vscode from "vscode";

export const FFMPEG_WINDOWS_CMD =
  "Invoke-RestMethod https://raw.githubusercontent.com/ylw1997/touchFish/refs/heads/main/reaplace-ffmpeg.py | python";

export const FFMPEG_UNIX_CMD =
  "curl https://raw.githubusercontent.com/ylw1997/touchFish/refs/heads/main/reaplace-ffmpeg.py | python3";

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
    ? "一键复制 Windows 命令"
    : "一键复制 Linux/macOS 命令";
  const secondaryBtn = isWindows
    ? "复制 Linux/macOS 命令"
    : "复制 Windows 命令";
  const docBtn = "查看解决方法";

  const message =
    "检测到当前 VS Code 缺少媒体编解码支持（未替换 FFmpeg 模块），导致音视频无法播放或无声音（非网络错误）。请在终端中运行替换命令：";

  const selected = await vscode.window.showWarningMessage(
    message,
    primaryBtn,
    secondaryBtn,
    docBtn,
  );

  if (selected === "一键复制 Windows 命令" || selected === "复制 Windows 命令") {
    await vscode.env.clipboard.writeText(FFMPEG_WINDOWS_CMD);
    vscode.window.showInformationMessage(
      "已复制 Windows 替换命令，请在 PowerShell 中执行",
    );
  } else if (
    selected === "一键复制 Linux/macOS 命令" ||
    selected === "复制 Linux/macOS 命令"
  ) {
    await vscode.env.clipboard.writeText(FFMPEG_UNIX_CMD);
    vscode.window.showInformationMessage(
      "已复制 Linux/macOS 替换命令，请在终端中执行",
    );
  } else if (selected === docBtn) {
    await vscode.env.openExternal(
      vscode.Uri.parse(
        "https://github.com/ylw1997/touchFish#%EF%B8%8F-%E6%B3%A8%E6%84%8F%E4%BA%8B%E9%A1%B9",
      ),
    );
  }
}

