import { useState, useEffect, useRef } from "react";
import { Image } from "antd";
import { imageFallback } from "../data/imgFallback";
import { useRequest } from "../hooks/useRequest";

interface YImgProps {
  src: string;
  previewSrc?: string;
  mediaType?: 'image' | 'video';
  useImg?: boolean;
  [key: string]: any;
}

const YImg: React.FC<YImgProps> = ({ src, previewSrc, mediaType = 'image', useImg = false, ...props }) => {
  const [imgSrc, setImgSrc] = useState<string | undefined>(undefined);
  const [previewImgSrc, setPreviewImgSrc] = useState<string | undefined>(undefined);
  const [videoSrc, setVideoSrc] = useState<string | undefined>(undefined);
  const elementRef = useRef<HTMLDivElement>(null);
  const { request } = useRequest();

  const isLoadingRef = useRef(false);
  const isLoadingPreviewRef = useRef(false);

  useEffect(() => {
    if (!src) return;

    let isSubscribed = true;
    let observer: IntersectionObserver | undefined;
    const currentRef = elementRef.current;

    const fetchMedia = (url: string, isPreview: boolean) => {
      const isLoading = isPreview ? isLoadingPreviewRef : isLoadingRef;
      if (isLoading.current) return;
      
      isLoading.current = true;

      const command = mediaType === "video" ? "GETVIDEO" : "GETIMG";
      request<string>(command, url)
        .then(fetchedUrl => {
          if (isSubscribed) {
            if (mediaType === 'video') {
              setVideoSrc(fetchedUrl);
            } else {
              if (isPreview) {
                setPreviewImgSrc(fetchedUrl);
              } else {
                setImgSrc(fetchedUrl);
              }
            }
          }
        })
        .catch(console.error)
        .finally(() => {
          if (isSubscribed) {
            isLoading.current = false;
          }
        });
    };

    if (mediaType === 'video') {
      fetchMedia(src, false);
    } else {
      observer = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
          fetchMedia(src, false);
          if (previewSrc) {
            fetchMedia(previewSrc, true);
          }
          if(currentRef) observer?.unobserve(currentRef);
        }
      });
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
  }, [src, previewSrc, mediaType, request]);

  const previewProps = previewImgSrc ? { ...props.preview, src: previewImgSrc } : undefined;

  return (
    <div style={{ height: "inherit", display: "inline-block" }} ref={elementRef}>
      {mediaType === 'video' ? (
        <video src={videoSrc} controls {...props} autoPlay muted />
      ) : useImg ? (
        <img src={imgSrc} {...props} />
      ) : (
        <Image src={imgSrc} {...props} preview={previewProps} fallback={imageFallback} />
      )}
    </div>
  );
};

export default YImg;
