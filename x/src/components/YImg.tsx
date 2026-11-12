import React, { useEffect, useRef } from "react";
import { Image } from "antd";
import back from "../../public/back.svg";
import { useRequest } from "../hooks/useRequest";
import { readProgressiveAudioReply, syncProgressiveAudio } from "../../../webview/softVideoAudio";

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
  const { request } = useRequest();
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src || mediaType !== "video") return;
    return syncProgressiveAudio(video, src, () =>
      readProgressiveAudioReply(request("FETCH_VIDEO_AUDIO", { url: src })));
  }, [src, mediaType, request]);

  return (
    <div style={{ display: "inline-block", maxWidth: '100%' }}>
      {mediaType === "video" ? (
        <video src={src} controls {...props} ref={videoRef} />
      ) : (
        <Image
          src={src}
          {...props}
          preview={
            useImg
              ? false
              : {
                  getContainer: () => document.body,
                }
          }
          fallback={back}
        />
      )}
    </div>
  );
};

export default React.memo(YImg);
