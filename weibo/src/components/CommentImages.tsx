import React, { useState, useEffect } from "react";
import { Image, Button } from "antd";
import { commentsItem } from "../../../types/weibo";
import YImg from "./YImg";

// 评论图片：与主内容一致，支持单独切换显示/隐藏
const CommentImages: React.FC<{ item: commentsItem; showImg?: boolean }> = ({
  item,
  showImg = true,
}) => {
  const [imgShow, setImgShow] = useState(showImg);

  useEffect(() => {
    setImgShow(showImg);
  }, [showImg]);

  const hasPics =
    (item.pic_num ?? 0) > 0 &&
    !!item.url_struct &&
    item.url_struct.length > 0;

  if (!hasPics) {
    return null;
  }

  const renderImages = () => (
    <div className="imglist" style={{ marginBottom: "8px", padding: "0px" }}>
      <Image.PreviewGroup preview={{ movable: false }}>
        {item.url_struct?.[0]?.pic_ids?.map((pic) => {
          const picInfo = item.url_struct?.[0]?.pic_infos?.[pic];
          if (!picInfo) return null;
          const imgProps = {
            className: "img-item",
            src: picInfo.large ? picInfo.large.url : picInfo.bmiddle.url,
          };
          return (
            <div key={pic}>
              <YImg {...imgProps} />
            </div>
          );
        })}
      </Image.PreviewGroup>
    </div>
  );

  return (
    <>
      {showImg && renderImages()}
      {!showImg &&
        (imgShow ? (
          <>
            {renderImages()}
            <Button
              color="default"
              variant="filled"
              onClick={() => setImgShow(false)}
              style={{
                marginLeft: "8px",
                marginTop: "8px",
                marginBottom: "8px",
              }}
              size="middle"
            >
              隐藏图片
            </Button>
          </>
        ) : (
          <Button
            color="default"
            variant="filled"
            onClick={() => setImgShow(true)}
            style={{ marginLeft: "8px", marginBottom: "8px" }}
            size="middle"
          >
            显示图片
          </Button>
        ))}
    </>
  );
};

export default CommentImages;
