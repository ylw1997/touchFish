import React from "react";
import { Space } from "antd";
import {
  DownloadOutlined,
  RotateLeftOutlined,
  RotateRightOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from "@ant-design/icons";
import { vscode } from "../utils/vscode";

interface ImagePreviewToolbarProps {
  imageUrl: string;
  imageIndex: number;
  fileNamePrefix?: string;
  scale: number;
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

const ImagePreviewToolbar: React.FC<ImagePreviewToolbarProps> = ({
  imageUrl,
  imageIndex,
  fileNamePrefix = "x_image",
  scale,
  onRotateLeft,
  onRotateRight,
  onZoomIn,
  onZoomOut,
}) => {
  const handleDownload = () => {
    vscode.postMessage({
      command: "X_DOWNLOAD_IMAGE",
      payload: {
        url: imageUrl,
        fileName: `${fileNamePrefix}_${imageIndex + 1}.jpg`,
      },
    });
  };

  return (
    <Space size={12} className="x-image-preview-toolbar">
      <DownloadOutlined onClick={handleDownload} />
      <RotateLeftOutlined onClick={onRotateLeft} />
      <RotateRightOutlined onClick={onRotateRight} />
      <ZoomOutOutlined disabled={scale === 1} onClick={onZoomOut} />
      <ZoomInOutlined disabled={scale === 50} onClick={onZoomIn} />
    </Space>
  );
};

export default ImagePreviewToolbar;
