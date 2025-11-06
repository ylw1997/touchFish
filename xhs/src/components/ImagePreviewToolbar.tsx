/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-11-06
 * @Description: 小红书统一图片预览工具栏组件
 * 提供下载、旋转、缩放等功能，保持与 antd 原生工具栏一致的样式
 */
import React from "react";
import { Space, message } from "antd";
import {
  DownloadOutlined,
  RotateLeftOutlined,
  RotateRightOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from "@ant-design/icons";
import { vscode } from "../utils/vscode";

interface ImagePreviewToolbarProps {
  /** 当前图片URL */
  imageUrl: string;
  /** 图片索引，用于生成文件名 */
  imageIndex: number;
  /** 文件名前缀，默认为 "image" */
  fileNamePrefix?: string;
  /** 当前缩放比例 */
  scale: number;
  /** 旋转操作回调 */
  onRotateLeft: () => void;
  onRotateRight: () => void;
  /** 缩放操作回调 */
  onZoomIn: () => void;
  onZoomOut: () => void;
  /** 自定义下载处理函数 */
  onDownload?: (url: string, fileName: string) => void;
}

/**
 * 统一的图片预览工具栏组件
 * 使用示例：
 * ```tsx
 * <Image
 *   src={url}
 *   preview={{
 *     toolbarRender: (_, { transform: { scale }, actions: { onZoomOut, onZoomIn, onRotateLeft, onRotateRight } }) => (
 *       <ImagePreviewToolbar
 *         imageUrl={url}
 *         imageIndex={0}
 *         fileNamePrefix="note"
 *         scale={scale}
 *         onRotateLeft={onRotateLeft}
 *         onRotateRight={onRotateRight}
 *         onZoomIn={onZoomIn}
 *         onZoomOut={onZoomOut}
 *       />
 *     ),
 *   }}
 * />
 * ```
 */
const ImagePreviewToolbar: React.FC<ImagePreviewToolbarProps> = ({
  imageUrl,
  imageIndex,
  fileNamePrefix = "image",
  scale,
  onRotateLeft,
  onRotateRight,
  onZoomIn,
  onZoomOut,
  onDownload,
}) => {
  const handleDownload = () => {
    const fileName = `${fileNamePrefix}_${imageIndex + 1}.jpg`;
    if (onDownload) {
      onDownload(imageUrl, fileName);
    } else {
      // 默认使用 VSCode 扩展下载
      vscode.postMessage({
        command: "XHS_DOWNLOAD_IMAGE",
        payload: { url: imageUrl, fileName },
      });
      message.success("已发起下载请求");
    }
  };

  return (
    <Space size={12} className="xhs-image-preview-toolbar">
      <DownloadOutlined onClick={handleDownload} />
      <RotateLeftOutlined onClick={onRotateLeft} />
      <RotateRightOutlined onClick={onRotateRight} />
      <ZoomOutOutlined disabled={scale === 1} onClick={onZoomOut} />
      <ZoomInOutlined disabled={scale === 50} onClick={onZoomIn} />
    </Space>
  );
};

export default ImagePreviewToolbar;
