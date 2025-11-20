/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-10-23 15:10:00
 * @LastEditTime: 2025-11-06 15:46:43
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\xhs\src\components\FeedDetailDrawer.tsx
 * @Description: 小红书笔记详情 Drawer，展示标题/作者/正文/图片（简单版）
 */
import React, { useCallback, useState } from "react";
import { loaderFunc } from "../utils/loader";
import { useFollowUser } from "../hooks/useFollowUser";
import { useNoteDetail } from "../hooks/useNoteDetail";
import UserPostedDrawer from "./UserPostedDrawer";
import BaseDrawer from "./BaseDrawer";
import UserInfoCard from "./UserInfoCard";
import NoteContentCard from "./NoteContentCard";
import CommentSection from "./CommentSection";
import CommentInput from "./CommentInput";

// ====== 类型定义 ======
interface UserDrawerPayload {
  cursor: string;
  user_id: string;
  xsec_token: string;
  user?: any;
  pc_comment?: any;
  xsec_source?: string;
}

interface FeedDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  detail: { note_id: string; xsec_token: string };
  onUserClick?: (payload: UserDrawerPayload) => void;
}
export const FeedDetailDrawer: React.FC<FeedDetailDrawerProps> = ({
  open,
  onClose,
  detail,
  onUserClick,
}) => {
  // ====== 使用自定义 Hooks ======
  const {
    noteData,
    loadingDetail,
    comments,
    commentLoading,
    commentHasMore,
    commentError,
    loadMoreComments,
    fetchSubComments,
    likeLoading,
    toggleLike,
    collectLoading,
    toggleCollect,
    postingComment,
    postComment,
    shareNote,
  } = useNoteDetail({
    noteId: detail.note_id,
    xsecToken: detail.xsec_token,
    open,
  });

  // 关注状态管理
  const {
    isFollowing,
    loading: followLoading,
    toggleFollow,
    setFollowing,
  } = useFollowUser({
    initialFollowing: noteData.followed,
  });

  // 同步关注状态
  React.useEffect(() => {
    setFollowing(noteData.followed);
  }, [noteData.followed, setFollowing]);

  // ====== 用户主页 Drawer 状态 ======
  const [userDrawerOpen, setUserDrawerOpen] = useState(false);
  const [userDrawerParams, setUserDrawerParams] = useState<UserDrawerPayload>({
    cursor: "",
    user_id: "",
    xsec_token: "",
  });

  // ====== 用户点击处理 ======
  const openUserDrawer = useCallback(
    (payload: UserDrawerPayload) => {
      if (onUserClick) {
        onUserClick(payload);
      } else {
        setUserDrawerParams(payload);
        setUserDrawerOpen(true);
      }
    },
    [onUserClick]
  );

  const handleUserClick = useCallback(() => {
    if (!noteData.user?.user_id) return;
    openUserDrawer({
      cursor: detail.note_id,
      user_id: noteData.user.user_id,
      xsec_token: detail.xsec_token,
      user: noteData.user,
    });
  }, [noteData.user, detail, openUserDrawer]);

  const handleCommentUserClick = useCallback(
    (comment: any) => {
      const rawUser = comment?.user_info;
      if (!rawUser?.user_id) return;

      openUserDrawer({
        cursor: "",
        user_id: rawUser.user_id,
        xsec_token: rawUser.xsec_token,
        xsec_source: "pc_comment",
        user: {
          ...rawUser,
          avatar: rawUser.avatar || rawUser.image,
          nickname: rawUser.nickname || rawUser.nick_name,
        },
      });
    },
    [openUserDrawer]
  );

  const handleFollowToggle = useCallback(async () => {
    if (!noteData.user?.user_id) return;
    await toggleFollow(noteData.user.user_id);
  }, [noteData.user?.user_id, toggleFollow]);

  return (
    <>
      <BaseDrawer
        open={open}
        onClose={onClose}
        title={noteData.title || "笔记详情"}
        scrollableId="xhsFeedDetailScrollableDiv"
      >
        {/* 用户信息 */}
        <UserInfoCard
          user={noteData.user}
          mode="simple"
          size="small"
          showFollowButton={!!noteData.user?.user_id}
          isFollowing={isFollowing}
          followLoading={followLoading}
          onFollowToggle={handleFollowToggle}
          onUserClick={handleUserClick}
          style={{ marginBottom: 12 }}
        />

        {/* 加载状态 */}
        {loadingDetail && loaderFunc(3)}

        {/* 笔记内容 */}
        {!loadingDetail && (
          <NoteContentCard
            noteData={noteData}
            onShare={shareNote}
            onToggleLike={toggleLike}
            likeLoading={likeLoading}
            onToggleCollect={toggleCollect}
            collectLoading={collectLoading}
          />
        )}

        {/* 评论输入 */}
        {!loadingDetail && (
          <CommentInput
            onSubmit={postComment}
            loading={postingComment}
            placeholder="写下你的评论..."
          />
        )}

        {/* 评论区 */}
        <CommentSection
          comments={comments}
          loading={commentLoading}
          hasMore={commentHasMore}
          error={commentError}
          scrollableTarget="xhsFeedDetailScrollableDiv"
          onLoadMore={loadMoreComments}
          onUserClick={handleCommentUserClick}
          onExpandSubComments={fetchSubComments}
        />
        {/* 用户主页 Drawer */}
        {!onUserClick && (
          <UserPostedDrawer
            open={userDrawerOpen}
            onClose={() => setUserDrawerOpen(false)}
            initParams={userDrawerParams}
          />
        )}
      </BaseDrawer>
    </>
  );
};

export default FeedDetailDrawer;
