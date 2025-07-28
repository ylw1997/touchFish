/*
 * @Author: yangliwei 1280426581@qq.com
 * @Date: 2024-11-19 17:38:50
 * @LastEditTime: 2025-07-28 13:49:07
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
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentRef = imgRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && src) {
            // 图片进入视口时加载
            vscode.postMessage({
              command: "GETIMG",
              payload: src,
            } as commandsType<string>);
            // 停止观察
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1, // 当10%的元素可见时触发
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
    };

    window.addEventListener("message", messageHandler);

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
      window.removeEventListener("message", messageHandler);
    };
  }, [src]);

  return (
    <div style={{ height: "inherit", display: "inline-block" }} ref={imgRef}>
      {useImg ? (
        <img src={imgSrc} {...props} />
      ) : (
        <Image src={imgSrc} {...props} fallback={imageFallback} />
      )}
    </div>
  );
};

export default YImg;
