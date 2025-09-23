import React, { useEffect, useRef } from "react";
import { Drawer, Avatar, Button, Divider, Card, Tag } from "antd";
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
  showImg?: boolean;
  onTopicClick: (topic: string) => void;
}

const UserDetailDrawer: React.FC<UserDetailDrawerProps> = ({
  visible,
  userDetail,
  setUserDetail,
  onClose,
  showImg,
  onTopicClick,
}) => {
  const userBlogRef = useRef<HTMLDivElement>(null);

  const {
    list: userWeiboList,
    total: userWeiboTotal,
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
    isFetching,
    getUserBlogData,
  } = useWeiboAction();

  useEffect(() => {
    if (visible && userDetail && userWeiboList?.length === 0) {
      getUserBlogData(userDetail.id, 1);
    }
  }, [getUserBlogData, userDetail, visible, userWeiboList?.length]);

  const getUserBlogFunc = () => {
    if (visible && userDetail && !isFetching) {
      getUserBlogData(userDetail.id, userWeiboPage + 1);
      setUserWeiboPage(userWeiboPage + 1);
    }
  };

  const closeFunc = () => {
    onClose();
    setList([]);
    setTotal(0);
    setUserWeiboPage(1);
    setCurItem(undefined);
    setSubUserDetail(undefined);
    setUserDetailVisible(false);
    setUserDetail(undefined);
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
      {contextHolder}
      <Drawer
        destroyOnHidden
        closable
        open={visible}
        onClose={closeFunc}
        title={userDetail?.screen_name}
        placement="bottom"
        height={userWeiboList.length === 0 ? "520px" : "calc(100vh - 200px)"}
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
                src={
                  userDetail.avatar_hd && (
                    <YImg useImg src={userDetail.avatar_hd} />
                  )
                }
              >
                {userDetail.screen_name}
              </Avatar>
              <div style={{ fontSize: 20, fontWeight: "bolder" }}>
                {userDetail.screen_name}
              </div>
              {userDetail.followers_count_str &&
              userDetail.friends_count_str ? (
                <div>
                  <Tag color="green">关注:{userDetail.friends_count_str}</Tag>
                  <Tag color="orange">
                    粉丝:{userDetail.followers_count_str}
                  </Tag>
                  {userDetail.special_follow ? (
                    <Tag color="pink">特别关注</Tag>
                  ) : (
                    <></>
                  )}
                  {userDetail.isOwner ? (
                    <Tag color="cyan">本账号</Tag>
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
                <Button
                  color="primary"
                  onClick={handleFollow}
                  variant="filled"
                >
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
            {userWeiboList.length === 0 ? (
              loaderFunc()
            ) : (
              <InfiniteScroll
                scrollableTarget={
                  userBlogRef.current ? (userBlogRef.current as any) : undefined
                }
                dataLength={userWeiboList.length}
                next={getUserBlogFunc}
                loader={isFetching ? loaderFunc() : null}
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
                    showImg={showImg}
                    getUserByName={getUserByName}
                    onTopicClick={onTopicClick}
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
              showImg={showImg}
              onTopicClick={onTopicClick}
            />
          )}
      </Drawer>
    </>
  );
};

export default UserDetailDrawer;
