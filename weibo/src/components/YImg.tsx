/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-09-23 17:31:31
 * @LastEditTime: 2025-09-30 17:59:18
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\weibo\src\components\YImg.tsx
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description:
 */
import React, { useState, useEffect, useRef } from "react";
import { Image } from "antd";
import back from "../../public/back.svg";
import { useRequest } from "../hooks/useRequest";
// import { LoadingOutlined } from "@ant-design/icons";

interface YImgProps {
  src: string;
  mediaType?: "image" | "video";
  useImg?: boolean;
  [key: string]: any;
}

const YImg: React.FC<YImgProps> = ({
  src,
  mediaType = "image",
  useImg = false,
  ...props
}) => {
  const [imgSrc, setImgSrc] = useState<string | undefined>(undefined);
  const [videoSrc, setVideoSrc] = useState<string | undefined>(undefined);
  const elementRef = useRef<HTMLDivElement>(null);
  const { request } = useRequest();

  // Use a ref to track loading state inside the effect without adding it as a dependency
  const isLoadingRef = useRef(false);

  useEffect(() => {
    if (!src) return;

    let isSubscribed = true;
    let observer: IntersectionObserver | undefined;
    const currentRef = elementRef.current; // Capture ref.current

    const fetchMedia = () => {
      // Use the ref to check if already loading
      if (isLoadingRef.current) return;

      isLoadingRef.current = true;

      const command = mediaType === "video" ? "GETVIDEO" : "GETIMG";
      request<string>(command, src)
        .then((url) => {
          if (isSubscribed) {
            if (mediaType === "video") {
              setVideoSrc(url);
            } else {
              setImgSrc(url);
            }
          }
        })
        .catch((err) => {
          console.error(err);
          if (isSubscribed) {
            setImgSrc(""); // Set to invalid value to trigger fallback
          }
        })
        .finally(() => {
          if (isSubscribed) {
            isLoadingRef.current = false;
          }
        });
    };

    if (mediaType === "video") {
      fetchMedia();
    } else {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            fetchMedia();
            if (currentRef) observer?.unobserve(currentRef);
          }
        },
        { threshold: 0.01, rootMargin: "200px" }
      );
      if (currentRef) {
        observer.observe(currentRef);
      }
    }

    return () => {
      isSubscribed = false;
      if (currentRef && observer) {
        observer.unobserve(currentRef);
      }
    };
  }, [src, mediaType, request]);

  return (
    <div
      style={{ height: "inherit", display: "inline-block" }}
      ref={elementRef}
    >
      {mediaType === "video" ? (
        <video src={videoSrc} controls {...props} />
      ) : (
        <Image
          src={imgSrc}
          {...props}
          preview={useImg ? false : true}
          fallback={back}
        />
      )}
    </div>
  );
};

export default React.memo(YImg);
