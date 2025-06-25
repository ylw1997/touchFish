import React, { useRef } from 'react';
import { Drawer, Avatar, Button, Divider } from 'antd';
import InfiniteScroll from 'react-infinite-scroll-component';
import YImg from './YImg';
import WeiboCard from './WeiboCard';
import { loaderFunc } from '../utils/loader';
import { weiboUser, weiboItem } from '../../../type';

interface UserDetailDrawerProps {
  visible: boolean;
  userDetail?: weiboUser;
  userWeiboList: weiboItem[];
  userWeiboTotal: number;
  onClose: () => void;
  onFollow: (userInfo?: weiboUser) => void;
  onCancelFollow: (userInfo?: weiboUser) => void;
  onGetUserBlog: (uid: number, page: number) => void;
  onToggleComments: (id: number, uid: number, is_retweeted: boolean, isUserBlog?: boolean) => void;
  onExpandLongWeibo: (id: string) => void;
  onCopyLink: (url: string) => void;
  userWeiboPage: number;
  loading: boolean;
   onCommentOrRepost?: (
    content: string,
    item: weiboItem,
    type: "comment" | "repost"
  ) => void;
}

const UserDetailDrawer: React.FC<UserDetailDrawerProps> = ({
  visible,
  userDetail,
  userWeiboList,
  userWeiboTotal,
  onClose,
  onFollow,
  onCancelFollow,
  onGetUserBlog,
  onToggleComments,
  onExpandLongWeibo,
  onCopyLink,
  userWeiboPage,
  loading,
  onCommentOrRepost
}) => {
  const userBlogRef = useRef<HTMLDivElement>(null);

  const getUserBlogFunc = () => {
    if (!loading && userDetail) {
      onGetUserBlog(userDetail.id, userWeiboPage + 1);
    }
  };

  return (
    <Drawer
      destroyOnClose
      closable
      open={visible}
      onClose={onClose}
      title={userDetail?.screen_name}
      placement="bottom"
      height="calc(100vh - 200px)"
      styles={{
        wrapper: {
          background: 'none',
          borderRadius: '10px',
          overflow: 'hidden',
        },
        body: {
          padding: 0,
          height: '100%',
          minHeight: 0,
          overflow: 'auto',
        },
        content: {
          background: 'rgba(26, 28, 34, 0.5)',
          backdropFilter: 'saturate(180%) blur(15px)',
        },
      }}
    >
      {userDetail && (
        <div
          ref={userBlogRef}
          id="user-blog"
          style={{
            height: '100%',
            overflow: 'auto',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
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
                onClick={() => onFollow(userDetail)}
                variant="filled"
              >
                关注
              </Button>
            ) : (
              <Button
                color="danger"
                onClick={() => onCancelFollow(userDetail)}
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
                  activeKey="userblog"
                  onFollow={onFollow}
                  cancelFollow={onCancelFollow}
                  onExpandLongWeibo={onExpandLongWeibo}
                  onToggleComments={(id, uid, is_retweeted) =>
                    onToggleComments(id, uid, is_retweeted, true)
                  }
                  showActions={false}
                  onCopyLink={onCopyLink}
                  onCommentOrRepost={onCommentOrRepost}
                />
              ))}
            </InfiniteScroll>
          )}
        </div>
      )}
    </Drawer>
  );
};

export default UserDetailDrawer;