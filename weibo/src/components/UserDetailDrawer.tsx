import React, { useEffect, useRef } from "react";
import { Drawer, Avatar, Button, Divider } from "antd";
import InfiniteScroll from "react-infinite-scroll-component";
import YImg from "./YImg";
import WeiboCard from "./WeiboCard";
import { loaderFunc } from "../utils/loader";
import { weiboUser } from "../../../type";
import useWeiboAction from "../hooks/useWeiboAction";
interface UserDetailDrawerProps {
  visible: boolean;
  userDetail?: weiboUser;
  setUserDetail: (userDetail: any) => void;
  onClose: () => void;
  source: string;
  preSource: string; // 上一个source
  showImg?: boolean;
  activeVideoUrl?: string | null;
  onPlayVideo?: (url?: string) => void;
}

const UserDetailDrawer: React.FC<UserDetailDrawerProps> = ({
  visible,
  userDetail,
  onClose,
  source,
  preSource,
  showImg,
  activeVideoUrl,
  onPlayVideo,
}) => {
  const userBlogRef = useRef<HTMLDivElement>(null);

  const {
    list: userWeiboList,
    total: userWeiboTotal,
    sendMessage,
    copyLink,
    contextHolder,
    handleToggleComments,
    handleExpandLongWeibo,
    handleCommentOrRepost,
    handleLike,
    cancelFollow,
    followUser,
    userWeiboPage,
    setCurItem,
    setList,
    setTotal,
    setUserWeiboPage,
    userDetailVisible,
    setUserDetailVisible,
    userDetail: subUserDetail,
    setUserDetail: setSubUserDetail,
    getUserBlog,
    getUserByName,
  } = useWeiboAction(source);

  useEffect(() => {
    if (visible && userDetail && userWeiboList?.length === 0) {
      sendMessage(
        "GETUSERBLOG",
        JSON.stringify({ uid: userDetail.id, page: 1 }),
        "请求用户微博中...",
        source
      );
    }
  }, [sendMessage, userDetail, source, visible, userWeiboList?.length]);

  const getUserBlogFunc = () => {
    if (visible && userDetail) {
      sendMessage(
        "GETUSERBLOG",
        JSON.stringify({ uid: userDetail.id, page: userWeiboPage + 1 }),
        "请求用户微博中...",
        source
      );
      setUserWeiboPage(userWeiboPage + 1);
    }
  };

  const closeFunc = () => {
    onClose();
    setList([]);
    setTotal(0);
    setUserWeiboPage(1);
    setCurItem(undefined);
  };

  return (
    <>
      {contextHolder}
      <Drawer
        destroyOnHidden
        closable
        open={visible}
        onClose={closeFunc}
        title={userDetail?.screen_name}
        placement="bottom"
        height="calc(100vh - 200px)"
        styles={{
          wrapper: {
            background: "none",
            borderRadius: "10px",
            overflow: "hidden",
          },
          body: {
            padding: 0,
            height: "100%",
            minHeight: 0,
            overflow: "auto",
          },
          content: {
            background: "rgba(26, 28, 34, 0.5)",
            backdropFilter: "saturate(180%) blur(15px)",
          },
        }}
      >
        {userDetail && (
          <div
            ref={userBlogRef}
            id="user-blog"
            style={{
              height: "100%",
              overflow: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
              }}
            >
              <Avatar
                size={80}
                style={{ marginTop: 16 }}
                src={
                  userDetail.avatar_hd && (
                    <YImg useImg src={userDetail.avatar_hd} />
                  )
                }
              >
                {userDetail.screen_name}
              </Avatar>
              <div style={{ fontSize: 20, fontWeight: 500 }}>
                {userDetail.screen_name}
              </div>
              {!userDetail.following ? (
                <Button
                  color="primary"
                  onClick={() => followUser(userDetail, preSource)}
                  variant="filled"
                >
                  关注
                </Button>
              ) : (
                <Button
                  color="red"
                  onClick={() => cancelFollow(userDetail, preSource)}
                  variant="filled"
                >
                  取关
                </Button>
              )}
            </div>
            {userBlogRef.current && (
              <InfiniteScroll
                scrollableTarget={userBlogRef.current as any}
                dataLength={userWeiboList.length}
                next={getUserBlogFunc}
                loader={loaderFunc(1)}
                endMessage={<Divider plain>没有了🤐</Divider>}
                hasMore={userWeiboList.length < userWeiboTotal}
                style={{ marginTop: 24 }}
              >
                {userWeiboList.map((item) => (
                  <WeiboCard
                    key={item.id}
                    item={item}
                    onFollow={(userinfo) => followUser(userinfo, preSource)}
                    onUserClick={getUserBlog}
                    cancelFollow={(userinfo) =>
                      cancelFollow(userinfo, preSource)
                    }
                    onExpandLongWeibo={handleExpandLongWeibo}
                    onToggleComments={handleToggleComments}
                    showActions={false}
                    onCopyLink={copyLink}
                    onCommentOrRepost={handleCommentOrRepost}
                    onLikeOrCancelLike={handleLike}
                    showImg={showImg}
                    getUserByName={getUserByName}
                    activeVideoUrl={activeVideoUrl}
                    onPlayVideo={onPlayVideo}
                  />
                ))}
              </InfiniteScroll>
            )}
          </div>
        )}
        {userDetailVisible &&
          subUserDetail &&
          subUserDetail?.id != userDetail?.id && (
            <UserDetailDrawer
              visible={userDetailVisible}
              userDetail={subUserDetail}
              onClose={() => {
                setUserDetailVisible(false);
                setSubUserDetail(undefined);
              }}
              setUserDetail={setSubUserDetail}
              source={`subUser-${subUserDetail?.id}`}
              preSource={source}
              showImg={showImg}
              activeVideoUrl={activeVideoUrl}
              onPlayVideo={onPlayVideo}
            />
          )}
      </Drawer>
    </>
  );
};

export default UserDetailDrawer;
