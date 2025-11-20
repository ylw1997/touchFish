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
  // 首次评论初始化标记，避免点赞修改 noteDetail 触发重复刷新
  const [commentsInitialized, setCommentsInitialized] = useState(false);

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
  const [likeLoading, setLikeLoading] = useState(false);
  // 独立的点赞本地状态，避免依赖深层对象引用导致不刷新
  const [likedState, setLikedState] = useState<boolean>(false);
  const [likedCountState, setLikedCountState] = useState<number>(0);
  
  const [collectLoading, setCollectLoading] = useState(false);
  // 独立的收藏本地状态
  const [collectedState, setCollectedState] = useState<boolean>(false);
  const [collectedCountState, setCollectedCountState] = useState<number>(0);

  const noteData = useMemo(() => {
    const interactInfo = note?.interact_info || {};
    return {
      title: note?.title || note?.display_title || "",
      desc: note?.desc || "",
      user,
      images,
      videoUrl,
      videoPoster: videoUrl && images.length === 1 ? images[0] : undefined,
      liked: likedState,
      likedCount: likedCountState,
      collected: collectedState,
      collectedCount: collectedCountState,
      commentCount: interactInfo?.comment_count || 0,
      shareCount: interactInfo?.share_count || 0,
      publishTime: note?.time || note?.last_update_time || 0,
      ipLocation: note?.ip_location || "",
      followed: !!interactInfo?.followed ||
                note?.extraInfo_info?.fstatus === 'follows' ||
                note?.extraInfo_info?.fstatus === 'each_other',
    };
  }, [note, user, images, videoUrl, likedState, likedCountState, collectedState, collectedCountState]);

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
      // 根据返回的 interact_info 初始化本地点赞与收藏状态
      const base = (data?.note || data?.note_card || data) as any;
      const info = base?.interact_info || {};
      setLikedState(!!info.liked);
      setLikedCountState(Number(info.liked_count || 0));
      setCollectedState(!!info.collected);
      setCollectedCountState(Number(info.collected_count || 0));
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

  // 加载某条根评论的子评论
  const fetchSubComments = useCallback(async (rootCommentId: string) => {
    if (!noteId || !xsecToken || !rootCommentId) return;
    setComments(prev => {
      return prev.map(c => c.id === rootCommentId ? { ...c, sub_loading: true, sub_error: null } : c);
    });
    try {
      const target = comments.find(c => c.id === rootCommentId);
      const cursor = target?.sub_comment_cursor || '';
      const data = await apiRef.current.getSubComments({
        note_id: noteId,
        root_comment_id: rootCommentId,
        cursor,
        xsec_token: xsecToken,
      });
      setComments(prev => prev.map(c => {
        if (c.id !== rootCommentId) return c;
        const existing = c.sub_comments || [];
        // 后端返回可能是 data.sub_comments 或 data.comments
        const list = (data.sub_comments || data.comments || []);
        // 去重合并
        const incoming = list.filter((sc: any) => !existing.some((e: any) => e.id === sc.id));
        return {
          ...c,
          sub_comments: [...existing, ...incoming],
          sub_comment_cursor: data.cursor,
          sub_comment_has_more: !!data.has_more,
          sub_loading: false,
        };
      }));
    } catch (e: any) {
      setComments(prev => prev.map(c => c.id === rootCommentId ? { ...c, sub_loading: false, sub_error: e?.message || '子评论加载失败' } : c));
    }
  }, [noteId, xsecToken, comments]);

  // 点赞/取消点赞（成功后更新）
  const toggleLike = useCallback(async () => {
    const noteIdLocal = note?.note_id;
    if (!noteIdLocal || likeLoading) return;
    const currentlyLiked = likedState;
    const prevCount = likedCountState;
    setLikeLoading(true);
    try {
      if (!currentlyLiked) {
        await apiRef.current.likeNote({ note_oid: noteIdLocal });
        // 成功后更新
        setLikedState(true);
        setLikedCountState(prevCount + 1);
        messageApi.success('已点赞');
      } else {
        const data = await apiRef.current.dislikeNote({ note_oid: noteIdLocal });
        setLikedState(false);
        if (typeof data?.like_count === 'number') {
          setLikedCountState(Number(data.like_count));
        } else {
          setLikedCountState(Math.max(0, prevCount - 1));
        }
        messageApi.success('已取消点赞');
      }
    } catch (e: any) {
      messageApi.error(e?.message || (currentlyLiked ? '取消点赞失败' : '点赞失败'));
    } finally {
      setLikeLoading(false);
    }
  }, [note?.note_id, likeLoading, likedState, likedCountState, messageApi]);

  // 收藏/取消收藏（成功后更新）
  const toggleCollect = useCallback(async () => {
    const noteIdLocal = note?.note_id;
    if (!noteIdLocal || collectLoading) return;
    const currentlyCollected = collectedState;
    const prevCount = collectedCountState;
    setCollectLoading(true);
    try {
      if (!currentlyCollected) {
        await apiRef.current.collectNote({ note_id: noteIdLocal });
        // 成功后更新
        setCollectedState(true);
        setCollectedCountState(prevCount + 1);
        messageApi.success('已收藏');
      } else {
        await apiRef.current.uncollectNote({ note_ids: noteIdLocal });
        setCollectedState(false);
        setCollectedCountState(Math.max(0, prevCount - 1));
        messageApi.success('已取消收藏');
      }
    } catch (e: any) {
      messageApi.error(e?.message || (currentlyCollected ? '取消收藏失败' : '收藏失败'));
    } finally {
      setCollectLoading(false);
    }
  }, [note?.note_id, collectLoading, collectedState, collectedCountState, messageApi]);

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
    setCommentsInitialized(false);
  }, []);

  // 自动加载详情
  useEffect(() => {
    if (open && noteId && xsecToken) {
      fetchDetail();
    } else if (!open) {
      reset();
    }
  }, [open, noteId, xsecToken, fetchDetail, reset]);

  // 详情首次加载后初始化评论，后续点赞等修改 noteDetail 不再触发刷新
  useEffect(() => {
    if (noteDetail && open && !commentsInitialized) {
      fetchComments("");
      setCommentsInitialized(true);
    }
  }, [noteDetail, open, fetchComments, commentsInitialized]);

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
    fetchSubComments,
    
    // 互动状态
    likeLoading,
    toggleLike,
    collectLoading,
    toggleCollect,
    
    // 方法
    shareNote,
    reset,
  };
}

export default useNoteDetail;
