import * as vscode from "vscode";
import { showInfo } from "./errorMessage";

interface DownloadImageOptions {
  url: string;
  fileName?: string;
  referer: string;
  successLabel?: string;
  headers?: Record<string, string>;
}

const getFallbackFileName = (url: string, fileName?: string) => {
  if (fileName) return fileName;

  try {
    const parsedUrl = new URL(url);
    const lastPart = parsedUrl.pathname.split("/").filter(Boolean).pop();
    return lastPart || "image.jpg";
  } catch {
    return "image.jpg";
  }
};

export const downloadImageWithSaveDialog = async ({
  url,
  fileName,
  referer,
  successLabel = "图片",
  headers = {},
}: DownloadImageOptions) => {
  if (!url) throw new Error("缺少图片URL");

  const axiosModule = await import("axios");
  const response = await axiosModule.default.get(url, {
    responseType: "arraybuffer",
    timeout: 10000,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Referer: referer,
      ...headers,
    },
    validateStatus: (status) => status === 200,
  });

  const dataLength = response.data?.length || response.data?.byteLength || 0;
  if (!response.data || dataLength === 0) {
    throw new Error("下载的图片数据为空");
  }

  const defaultUri = vscode.Uri.file(getFallbackFileName(url, fileName));
  const uri = await vscode.window.showSaveDialog({
    defaultUri,
    filters: { Images: ["jpg", "jpeg", "png", "webp", "gif"] },
  });

  if (!uri) return;

  await vscode.workspace.fs.writeFile(uri, new Uint8Array(response.data));
  showInfo(`${successLabel}已保存到: ${uri.fsPath}`);
};
