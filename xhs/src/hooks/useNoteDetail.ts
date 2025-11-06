/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-11-06
 * @Description: 笔记详情加载 Hook
 */
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { createXhsApi } from "../api";
import { useRequest } from "./useRequest";
import { extractXhsImageUrl, extractVideoUrl } from "../utils/utils";

interface UseNoteDetailOptions {
  /** 笔记ID */
  noteId: string;
  /** xsec_token */
  xsecToken: string;
  /** 是否打开 */
  open: boolean;
}

/**
 * 笔记详情加载 Hook
 * 统一处理笔记详情和评论的加载逻辑
 */
export function useNoteDetail(options: UseNoteDetailOptions) {
  const { noteId, xsecToken, open } = options;
  const { request, messageApi } = useRequest();
  const apiRef = useRef(createXhsApi(request));

  // 笔记详情状态
  const [noteDetail, setNoteDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // 评论状态
  const [comments, setComments] = useState<any[]>([]);
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentCursor, setCommentCursor] = useState<string>("");
  const [commentHasMore, setCommentHasMore] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  // 提取笔记信息
  const note = useMemo(
    () => noteDetail?.note || noteDetail?.note_card || noteDetail,
    [noteDetail]
  );

  const user = useMemo(() => note?.user || {}, [note?.user]);

  const images = useMemo(
    () => (note?.image_list || []).map(extractXhsImageUrl).filter(Boolean),
    [note?.image_list]
  );

  const videoUrl = useMemo(() => extractVideoUrl(note), [note]);

  const noteData = useMemo(() => {
    const interactInfo = note?.interact_info || {};
    return {
      title: note?.title || note?.display_title || "",
      desc: note?.desc || "",
      user,
      images,
      videoUrl,
      videoPoster: videoUrl && images.length === 1 ? images[0] : undefined,
      liked: !!interactInfo?.liked,
      likedCount: interactInfo?.liked_count || 0,
      collected: !!interactInfo?.collected,
      collectedCount: interactInfo?.collected_count || 0,
      commentCount: interactInfo?.comment_count || 0,
      shareCount: interactInfo?.share_count || 0,
      publishTime: note?.time || note?.last_update_time || 0,
      ipLocation: note?.ip_location || "",
      followed: !!interactInfo?.followed || 
                note?.extraInfo_info?.fstatus === 'follows' || 
                note?.extraInfo_info?.fstatus === 'each_other',
    };
  }, [note, user, images, videoUrl]);

  // 加载笔记详情
  const fetchDetail = useCallback(async () => {
    if (!noteId || !xsecToken) return;
    
    setLoadingDetail(true);
    setNoteDetail(null);
    try {
      const data = await apiRef.current.getFeedDetail({
        source_note_id: noteId,
        xsec_token: xsecToken,
      });
      setNoteDetail(data);
    } catch (e: any) {
      console.error("[xhs] feed detail error", e);
    } finally {
      setLoadingDetail(false);
    }
  }, [noteId, xsecToken]);

  // 加载评论
  const fetchComments = useCallback(
    async (cursor: string = "") => {
      if (!noteId || !xsecToken) return;
      
      setCommentLoading(true);
      if (!cursor) {
        setComments([]);
        setCommentCursor("");
        setCommentHasMore(false);
        setCommentError(null);
      }
      try {
        const data: any = await apiRef.current.getComments({
          note_id: noteId,
          cursor,
          xsec_token: xsecToken,
        });
        setComments((prev) =>
          cursor ? [...prev, ...data.comments] : data.comments
        );
        setCommentCursor(data.cursor);
        setCommentHasMore(!!data.has_more);
      } catch (e: any) {
        setCommentError(e?.message || "评论加载失败");
      } finally {
        setCommentLoading(false);
      }
    },
    [noteId, xsecToken]
  );

  const loadMoreComments = useCallback(() => {
    fetchComments(commentCursor);
  }, [fetchComments, commentCursor]);

  // 分享功能
  const shareNote = useCallback(() => {
    if (!note?.note_id) return;
    
    const params = new URLSearchParams({
      xsec_token: xsecToken || "",
      xsec_source: "pc_feed",
    });
    const url = `https://www.xiaohongshu.com/explore/${note.note_id}?${params.toString()}`;
    
    navigator.clipboard
      .writeText(url)
      .then(() => messageApi.success("链接已复制到剪贴板"))
      .catch(() => messageApi.error("复制失败"));
  }, [note?.note_id, xsecToken, messageApi]);

  // 重置状态
  const reset = useCallback(() => {
    setNoteDetail(null);
    setComments([]);
    setCommentCursor("");
    setCommentHasMore(false);
    setCommentError(null);
  }, []);

  // 自动加载详情
  useEffect(() => {
    if (open && noteId && xsecToken) {
      fetchDetail();
    } else if (!open) {
      reset();
    }
  }, [open, noteId, xsecToken, fetchDetail, reset]);

  // 详情加载完成后加载评论
  useEffect(() => {
    if (noteDetail && open) {
      fetchComments("");
    }
  }, [noteDetail, open, fetchComments]);

  return {
    // 笔记数据
    noteData,
    loadingDetail,
    
    // 评论数据
    comments,
    commentLoading,
    commentHasMore,
    commentError,
    loadMoreComments,
    
    // 方法
    shareNote,
    reset,
  };
}

export default useNoteDetail;
