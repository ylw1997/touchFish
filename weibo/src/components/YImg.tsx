/*
 * @Author: yangliwei 1280426581@qq.com
 * @Date: 2024-11-19 17:38:50
 * @LastEditTime: 2025-07-30 10:07:55
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\weibo\src\components\YImg.tsx
 * Copyright (c) 2024 by yangliwei, All Rights Reserved.
 * @Description:
 */
import { useState, useEffect, useRef } from "react";
import { vscode } from "../utils/vscode";
import { commandsType } from "../../../type";
import { Image } from "antd";
import { imageFallback } from "../data/imgFallback";

interface YImgProps {
  src: string;
  useImg?: boolean;
  [key: string]: any;
}

const YImg: React.FC<YImgProps> = ({ src, useImg = false, ...props }) => {
  const [imgSrc, setImgSrc] = useState<string | undefined>(undefined);
  const [videoSrc, setVideoSrc] = useState<string | undefined>(undefined);
  const elementRef = useRef<HTMLDivElement>(null);
  const isVideo = src.includes('video');

  useEffect(() => {
    const currentRef = elementRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && src) {
            if (isVideo) {
              vscode.postMessage({
                command: "GETVIDEO",
                payload: src,
              } as commandsType<string>);
            } else {
              vscode.postMessage({
                command: "GETIMG",
                payload: src,
              } as commandsType<string>);
            }
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
      }
    );

    if (currentRef) {
      observer.observe(currentRef);
    }

    const messageHandler = async (event: MessageEvent<commandsType<any>>) => {
      const msg = event.data;
      if (msg.command === `SENDIMG:${src}` && msg.payload) {
        setImgSrc(msg.payload);
      }
      if (msg.command === `SENDVIDEO:${src}` && msg.payload) {
        setVideoSrc(msg.payload);
      }
    };

    window.addEventListener("message", messageHandler);

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
      window.removeEventListener("message", messageHandler);
    };
  }, [src, isVideo]);

  return (
    <div style={{ height: "inherit", display: "inline-block" }} ref={elementRef}>
      {isVideo ? (
        <video src={videoSrc} controls {...props} autoPlay muted />
      ) : useImg ? (
        <img src={imgSrc} {...props} />
      ) : (
        <Image src={imgSrc} {...props} fallback={imageFallback} />
      )}
    </div>
  );
};

export default YImg;
