
import React, { useMemo, useState, useEffect } from "react";
import { Button, Image } from "antd";
import { PlayCircleFilled } from "@ant-design/icons";
import { xItem } from "../../../types/x";
import YImg from "./YImg";
import ImagePreviewToolbar from "./ImagePreviewToolbar";

interface XCardMediaProps {
  item: xItem;
  isH5?: boolean;
  showImg?: boolean;
}

interface NormalizedMediaItem {
  id: string;
  type: "image" | "video";
  thumbnailUrl: string;
  fullUrl?: string;
}

const MediaItemDisplay: React.FC<{ media: NormalizedMediaItem; count: number }> = ({
  media,
  count,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const imgProps = {
    className: count > 1 ? "img-item" : "img-only-item",
    src: media.type === "image" ? media.fullUrl! : media.thumbnailUrl,
  };

  if (media.type === "video") {
    if (isPlaying) {
      return (
        <YImg src={media.fullUrl!} mediaType="video" className="video-item" />
      );
    }
    return (
      <div
        className="video-cover"
        onClick={() => setIsPlaying(true)}
        key={media.id}
      >
        <YImg className={imgProps.className} src={media.thumbnailUrl} useImg />
        <PlayCircleFilled className="video-icon" />
      </div>
    );
  }

  return <YImg {...imgProps} />;
};

const XCardMedia: React.FC<XCardMediaProps> = ({
  item,
  isH5,
  showImg,
}) => {
  const [imgShow, setImgShow] = useState(showImg);

  useEffect(() => {
    setImgShow(showImg);
  }, [showImg]);

  const normalizedMedia = useMemo(() => {
    const media: NormalizedMediaItem[] = [];

    if (item.mix_media_info) {
      item.mix_media_info.items.forEach((mediaItem) => {
        if (mediaItem.type === "video") {
          media.push({
            id: mediaItem.id,
            type: "video",
            thumbnailUrl: mediaItem.data.page_pic,
            fullUrl: mediaItem.data.media_info.stream_url,
          });
        } else if (mediaItem.type === "pic") {
          media.push({
            id: mediaItem.id,
            type: "image",
            thumbnailUrl: mediaItem.data.bmiddle.url,
            fullUrl: mediaItem.data.large.url,
          });
        }
      });
    } else if (item.page_info && item.page_info.object_type === "video") {
      media.push({
        id: item.id.toString(),
        type: "video",
        thumbnailUrl: item.page_info.page_pic,
        fullUrl: item.page_info.media_info.stream_url,
      });
    } else if (isH5 && item.pics) {
      item.pics.forEach((pic) => {
        media.push({
          id: pic.pid,
          type: "image",
          thumbnailUrl: pic.url,
          fullUrl: pic.url,
        });
      });
    } else if (item.pic_infos && item.pic_ids) {
      item.pic_ids.forEach((picId) => {
        const picInfo = item.pic_infos[picId];
        if (picInfo) {
          media.push({
            id: picId,
            type: picInfo.type === "video" ? "video" : "image",
            thumbnailUrl: picInfo.bmiddle.url,
            fullUrl: picInfo.video_url || picInfo.large.url,
          });
        }
      });
    }

    return media;
  }, [item, isH5]);

  const renderImages = () => {
    if (normalizedMedia.length === 0) {
      return null;
    }
    const previewImages = normalizedMedia.filter(
      (media) => media.type === "image" && media.fullUrl,
    );

    return (
      <div className="imglist">
        <Image.PreviewGroup
          preview={{
            getContainer: () => document.body,
            toolbarRender: (
              _,
              {
                transform: { scale },
                actions: {
                  onZoomOut,
                  onZoomIn,
                  onRotateLeft,
                  onRotateRight,
                },
                current,
              },
            ) => {
              const image = previewImages[current];
              if (!image?.fullUrl) return null;
              return (
                <ImagePreviewToolbar
                  imageUrl={image.fullUrl}
                  imageIndex={current}
                  fileNamePrefix={`x_${item.id}`}
                  scale={scale}
                  onRotateLeft={onRotateLeft}
                  onRotateRight={onRotateRight}
                  onZoomIn={onZoomIn}
                  onZoomOut={onZoomOut}
                />
              );
            },
          }}
        >
          {normalizedMedia.map((media) => (
            <MediaItemDisplay
              key={media.id}
              media={media}
              count={normalizedMedia.length}
            />
          ))}
        </Image.PreviewGroup>
      </div>
    );
  };

  const hasVideo =
    item.page_info &&
    (item.page_info.object_type === "video" ||
      item.page_info.object_type === "live");

  if (normalizedMedia.length === 0 && !hasVideo) {
    return null;
  }

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
              隐藏{hasVideo ? "视频" : "图片"}
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
            显示{hasVideo ? "视频" : "图片"}
          </Button>
        ))}
    </>
  );
};

export default XCardMedia;
