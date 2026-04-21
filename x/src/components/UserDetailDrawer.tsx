import { motion } from "framer-motion";
import React, { useEffect, useRef } from "react";
import { Drawer, Avatar, Button, Divider, Card, Tag } from "antd";
import InfiniteScroll from "react-infinite-scroll-component";
import XCard from "./XCard";
import { loaderFunc } from "../utils/loader";
import { xItem, xUser } from "../../../types/x";
import useXAction from "../hooks/useXAction";
import {
  UsergroupAddOutlined,
  TeamOutlined,
  StarOutlined,
  IdcardOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import { Tabs } from "antd";
import { XUserItem } from "./XUserItem";
import { useState } from "react";

interface UserDetailDrawerProps {
  visible: boolean;
  userDetail?: xUser;
  setUserDetail: (userDetail: any) => void;
  onClose: () => void;
  showImg?: boolean;
  onTopicClick: (topic: string) => void;
  onTranslate?: (item: xItem) => void;
  onClearTranslation?: (item: xItem) => void;
}

const UserDetailDrawer: React.FC<UserDetailDrawerProps> = ({
  visible,
  userDetail,
  setUserDetail,
  onClose,
  showImg,
  onTopicClick,
  onTranslate: parentOnTranslate,
  onClearTranslation: parentOnClearTranslation,
}) => {
  const userBlogRef = useRef<HTMLDivElement>(null);

  const {
    list: userXList,
    copyLink,
    handleToggleComments,
    handleExpandLongX,
    handleCommentOrRepost,
    handleLike,
    cancelFollow,
    followUser,
    setCurItem,
    setList,
    setTotal,
    setUserXCursor,
    userDetailVisible,
    setUserDetailVisible,
    userDetail: subUserDetail,
    setUserDetail: setSubUserDetail,
    getUserBlog,
    getUserByName,
    isFetching,
    getUserBlogData,
    userXCursor,
    handleTranslate,
    handleClearTranslation,
    followingList,
    followingCursor,
    isFetchingFollowing,
    followingHasLoaded,
    getFollowingListData,
    setFollowingList,
    setFollowingCursor,
    setFollowingHasLoaded,
  } = useXAction();

  const [activeKey, setActiveKey] = useState<string>("tweets");

  useEffect(() => {
    if (
      activeKey === "following" &&
      followingList.length === 0 &&
      userDetail?.id &&
      !isFetchingFollowing &&
      !followingHasLoaded
    ) {
      getFollowingListData(String(userDetail.id));
    }
  }, [
    activeKey,
    followingList.length,
    userDetail?.id,
    isFetchingFollowing,
    followingHasLoaded,
    getFollowingListData,
  ]);

  useEffect(() => {
    if (visible && userDetail && userXList?.length === 0 && !isFetching) {
      getUserBlogData(userDetail.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userDetail?.id, visible]);

  const getUserBlogFunc = () => {
    if (visible && userDetail && !isFetching && userXCursor) {
      getUserBlogData(userDetail.id, userXCursor);
    }
  };

  const closeFunc = () => {
    onClose();
    setList([]);
    setTotal(0);
    setUserXCursor("");
    setCurItem(undefined);
    setSubUserDetail(undefined);
    setUserDetailVisible(false);
    setUserDetail(undefined);
    setFollowingList([]);
    setFollowingCursor("");
    setFollowingHasLoaded(false);
    setActiveKey("tweets");
  };

  const handleFollow = () => {
    if (userDetail) {
      followUser(userDetail).then(() => {
        setUserDetail({ ...userDetail, following: true });
      });
    }
  };

  const handleCancelFollow = () => {
    if (userDetail) {
      cancelFollow(userDetail).then(() => {
        setUserDetail({ ...userDetail, following: false });
      });
    }
  };

  return (
    <>
      <Drawer
        getContainer={false}
        destroyOnHidden
        closable
        open={visible}
        onClose={closeFunc}
        title={userDetail?.screen_name}
        placement="bottom"
        height={userXList.length === 0 ? "auto" : "calc(100vh - 200px)"}
        styles={{
          body: {
            padding: 0,
            height: "100%",
            minHeight: 0,
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
              padding: "0 5px",
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
                src={userDetail.avatar_hd}
              >
                {userDetail.screen_name}
              </Avatar>
              <div style={{ fontWeight: "bolder" }}>
                {userDetail.screen_name}
              </div>
              {userDetail.followers_count_str &&
              userDetail.friends_count_str ? (
                <div style={{ cursor: "pointer" }}>
                  <Tag
                    icon={<UsergroupAddOutlined />}
                    color="green"
                    onClick={() => setActiveKey("following")}
                  >
                    关注:{userDetail.friends_count_str}
                  </Tag>
                  <Tag icon={<TeamOutlined />} color="orange">
                    粉丝:{userDetail.followers_count_str}
                  </Tag>
                  {userDetail.special_follow ? (
                    <Tag icon={<StarOutlined />} color="pink">
                      特别关注
                    </Tag>
                  ) : (
                    <></>
                  )}
                  {userDetail.isOwner ? (
                    <Tag icon={<IdcardOutlined />} color="cyan">
                      本账号
                    </Tag>
                  ) : (
                    <></>
                  )}
                </div>
              ) : (
                <></>
              )}
              {userDetail.descText ? (
                <Card
                  styles={{
                    body: {
                      padding: "10px",
                    },
                  }}
                >
                  {userDetail.descText}
                </Card>
              ) : (
                <></>
              )}
              {userDetail.isOwner ? (
                <></>
              ) : !userDetail.following ? (
                <Button color="primary" onClick={handleFollow} variant="filled">
                  关注
                </Button>
              ) : (
                <Button
                  color="red"
                  onClick={handleCancelFollow}
                  variant="filled"
                >
                  取关
                </Button>
              )}
            </div>
            <Divider style={{ margin: "12px 0 0" }} />
            <Tabs
              activeKey={activeKey}
              onChange={setActiveKey}
              centered
              items={[
                {
                  key: "tweets",
                  label: (
                    <span>
                      <MessageOutlined
                        style={{
                          marginRight: "5px",
                        }}
                      />
                      推文
                    </span>
                  ),
                  children: (
                    <div style={{ minHeight: "300px" }}>
                      {userXList.length === 0 && isFetching ? (
                        loaderFunc()
                      ) : userXList.length === 0 ? (
                        <Divider plain>暂无推文</Divider>
                      ) : (
                        <InfiniteScroll
                          scrollableTarget={
                            userBlogRef.current
                              ? (userBlogRef.current as any)
                              : undefined
                          }
                          scrollThreshold={0.95}
                          dataLength={userXList.length}
                          next={getUserBlogFunc}
                          loader={isFetching ? loaderFunc() : null}
                          endMessage={<Divider plain>没有了🤐</Divider>}
                          hasMore={!!userXCursor}
                          style={{ marginTop: 12 }}
                        >
                          {userXList.map((item: xItem) => (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, y: 20 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.4 }}
                            >
                              <XCard
                                item={item}
                                onFollow={followUser}
                                onUserClick={getUserBlog}
                                cancelFollow={cancelFollow}
                                onExpandLongX={handleExpandLongX}
                                onToggleComments={handleToggleComments}
                                showActions={false}
                                onCopyLink={copyLink}
                                onCommentOrRepost={handleCommentOrRepost}
                                onLikeOrCancelLike={handleLike}
                                showImg={showImg}
                                getUserByName={getUserByName}
                                onTopicClick={onTopicClick}
                                onTranslate={
                                  handleTranslate || parentOnTranslate
                                }
                                onClearTranslation={
                                  handleClearTranslation ||
                                  parentOnClearTranslation
                                }
                              />
                            </motion.div>
                          ))}
                        </InfiniteScroll>
                      )}
                    </div>
                  ),
                },
                {
                  key: "following",
                  label: (
                    <span>
                      <UsergroupAddOutlined
                        style={{
                          marginRight: "5px",
                        }}
                      />
                      关注
                    </span>
                  ),
                  children: (
                    <div style={{ minHeight: "300px" }}>
                      {followingList.length === 0 && isFetchingFollowing ? (
                        loaderFunc()
                      ) : followingList.length === 0 && !isFetchingFollowing ? (
                        <div
                          style={{
                            padding: "40px",
                            textAlign: "center",
                            color: "#999",
                          }}
                        >
                          <Button
                            color="default"
                            variant="filled"
                            onClick={() =>
                              getFollowingListData(String(userDetail.id))
                            }
                          >
                            加载关注列表
                          </Button>
                        </div>
                      ) : (
                        <InfiniteScroll
                          scrollableTarget={
                            userBlogRef.current
                              ? (userBlogRef.current as any)
                              : undefined
                          }
                          scrollThreshold={0.95}
                          dataLength={followingList.length}
                          next={() =>
                            getFollowingListData(
                              String(userDetail.id),
                              followingCursor,
                            )
                          }
                          loader={isFetchingFollowing ? loaderFunc() : null}
                          endMessage={<Divider plain>到底了🤐</Divider>}
                          hasMore={!!followingCursor}
                          style={{ marginTop: 12 }}
                        >
                          {followingList.map((user: xUser) => (
                            <XUserItem
                              key={user.id}
                              {...user}
                              showUser={getUserBlog}
                            />
                          ))}
                        </InfiniteScroll>
                      )}
                    </div>
                  ),
                },
              ]}
            />
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
              showImg={showImg}
              onTopicClick={onTopicClick}
              onTranslate={handleTranslate || parentOnTranslate}
              onClearTranslation={
                handleClearTranslation || parentOnClearTranslation
              }
            />
          )}
      </Drawer>
    </>
  );
};

export default UserDetailDrawer;
