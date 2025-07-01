import React, { useEffect, useMemo, useRef } from "react";
import { Drawer, Avatar, Button, Divider } from "antd";
import InfiniteScroll from "react-infinite-scroll-component";
import YImg from "./YImg";
import WeiboCard from "./WeiboCard";
import { loaderFunc } from "../utils/loader";
import { commandsType, weiboAJAX, weiboUser } from "../../../type";
import useWeiboAction from "../hooks/useWeiboAction";
interface UserDetailDrawerProps {
  visible: boolean;
  userDetail?: weiboUser;
  setUserDetail: (userDetail: any) => void;
  onClose: () => void;
  source: string;
}

const UserDetailDrawer: React.FC<UserDetailDrawerProps> = ({
  visible,
  userDetail,
  setUserDetail,
  onClose,
  source,
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
    messageApi,
    updateList,
    curItem,
    setCurItem,
    setList,
    setTotal,
    setUserWeiboPage,
    userDetailVisible,
    setUserDetailVisible,
    userDetail: subUserDetail,
    setUserDetail: setSubUserDetail,
    getUserBlog,
  } = useWeiboAction(source);

  useEffect(() => {
    if (visible && userDetail) {
      sendMessage(
        "GETUSERBLOG",
        JSON.stringify({ uid: userDetail.id, page: 1 }),
        "请求用户微博中...",
        source
      );
    }
  }, [sendMessage, userDetail, source, visible]);

  // 处理函数集合
  const handlers = useMemo(
    () => ({
      SENDUSERBLOG: (payload: any) => {
        messageApi.destroy("GETUSERBLOG");
        if (payload?.ok) {
          if (payload.source === source) {
            const wlist = [...userWeiboList, ...payload.data.list];
            const wtotal = payload.data?.total ?? 999;
            setList(wlist);
            setTotal(wtotal);
          }
        } else {
          messageApi.error("用户微博请求失败!" + payload?.msg);
        }
      },
      SENDCOMMENT: (payload: any) => {
        messageApi.destroy("GETCOMMENT");
        if (payload?.ok) {
          if (payload.source === source) {
            const { id } = payload.payload;
            const data = payload.data;
            updateList(
              (item) => item.id === id,
              (item) => ({ ...item, comments: data })
            );
          }
        } else {
          messageApi.error("评论请求失败!" + payload?.msg);
        }
      },
      SENDCREATECOMMENTS: (payload: any) => {
        messageApi.destroy("GETCREATECOMMENTS");
        if (payload?.ok) {
          if (payload.source === source) {
            if (curItem) {
              sendMessage(
                "GETCOMMENT",
                {
                  url: `/statuses/buildComments?flow=1&id=${curItem.id}&is_show_bulletin=2uid=${curItem.user?.id}&locale=zh-CN`,
                  id: curItem.id,
                  uid: curItem.user?.id,
                },
                "请求评论中...",
                source
              );
            }
          }
        } else {
          messageApi.error("评论失败!" + payload?.msg);
        }
      },
      SENDCREATEREPOST: () => {
        messageApi.destroy("GETCREATEREPOST");
      },
      SENDLONGTEXT: (payload: any) => {
        messageApi.destroy("GETLONGTEXT");
        if (payload?.ok) {
          if (payload.source === source) {
            const mblogid = payload.payload;
            const text = payload.data.longTextContent.replace(/\n/g, "<br/>");
            updateList(
              (item) => item.mblogid === mblogid,
              (item) => ({ ...item, text })
            );
          }
        } else {
          messageApi.error("长文本请求失败!" + payload?.msg);
        }
      },
      SENDFOLLOW: (payload: any) => {
        messageApi.destroy("GETFOLLOW");
        if (payload?.ok) {
          if (userDetail && payload.source === source) {
            setUserDetail((item: any) => {
              return {
                ...item!,
                following: true,
              };
            });
            updateList(
              (item) => item.user?.id === userDetail!.id,
              (item) => ({
                ...item,
                user: {
                  ...item.user,
                  following: true,
                } as weiboUser,
              })
            );
          }
        } else {
          messageApi.error("关注请求失败!" + payload?.msg);
        }
      },
      SENDCANCELFOLLOW: (payload: any) => {
        messageApi.destroy("GETCANCELFOLLOW");
        if (payload?.ok) {
          if (userDetail && payload.source === source) {
            setUserDetail((item: weiboUser) => {
              return {
                ...item!,
                following: false,
              };
            });
            updateList(
              (item) => item.user?.id === userDetail!.id,
              (item) => ({
                ...item,
                user: {
                  ...item.user,
                  following: false,
                } as weiboUser,
              })
            );
          }
        } else {
          messageApi.error("取消关注请求失败!" + payload?.msg);
        }
      },
      SENDSETLIKE: (payload: any) => {
        messageApi.destroy("GETSETLIKE");
        if (payload?.ok) {
          if (payload.source === source) {
            if (!curItem) return;
            updateList(
              (item) => item.id === curItem.id,
              (item) => ({
                ...item,
                attitudes_status: 1,
                attitudes_count: item.attitudes_count + 1,
              })
            );
          }
        } else {
          messageApi.error("点赞失败!" + payload?.msg);
        }
      },
      SENDCANCELLIKE: (payload: any) => {
        messageApi.destroy("GETCANCELLIKE");
        if (payload?.ok) {
          if (payload.source === source) {
            if (!curItem) return;
            updateList(
              (item) => item.id === curItem.id,
              (item) => ({
                ...item,
                attitudes_status: 0,
                attitudes_count: item.attitudes_count - 1,
              })
            );
          }
        } else {
          messageApi.error("取消点赞失败!" + payload?.msg);
        }
      },
    }),
    [
      messageApi,
      source,
      userWeiboList,
      setList,
      setTotal,
      updateList,
      curItem,
      sendMessage,
      userDetail,
      setUserDetail,
    ]
  );

  // 统一处理消息响应
  useEffect(() => {
    const handler = (ev: MessageEvent<commandsType<weiboAJAX>>) => {
      if (ev.type !== "message") return;
      const msg = ev.data;
      const fn = (handlers as Record<string, (payload: any) => void>)[
        msg.command as string
      ];
      fn?.(msg.payload);
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [handlers]);

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
        destroyOnClose
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
                  onClick={() => followUser(userDetail)}
                  variant="filled"
                >
                  关注
                </Button>
              ) : (
                <Button
                  color="danger"
                  onClick={() => cancelFollow(userDetail)}
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
                    onFollow={followUser}
                    onUserClick={getUserBlog}
                    cancelFollow={cancelFollow}
                    onExpandLongWeibo={handleExpandLongWeibo}
                    onToggleComments={handleToggleComments}
                    showActions={false}
                    onCopyLink={copyLink}
                    onCommentOrRepost={handleCommentOrRepost}
                    onLikeOrCancelLike={handleLike}
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
            />
          )}
      </Drawer>
    </>
  );
};

export default UserDetailDrawer;
