import React from "react";
import { Image } from "antd";
import back from "../../public/back.svg";

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
  return (
    <div style={{ display: "inline-block", maxWidth: '100%' }}>
      {mediaType === "video" ? (
        <video src={src} controls {...props} />
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
