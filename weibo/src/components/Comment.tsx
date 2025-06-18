/*
 * @Author: yangliwei 1280426581@qq.com
 * @Date: 2024-11-22 17:02:23
 * @LastEditTime: 2025-06-18 08:48:45
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\weibo\src\components\Comment.tsx
 * Copyright (c) 2024 by yangliwei, All Rights Reserved.
 * @Description:
 */
import { List, Avatar } from "antd";
import { commentsItem } from "../../../type";
import YImg from "./YImg";

// 渲染评论
export const renderComments = (comments: commentsItem[],is_child = false) => {
  const defaultAvatarSize = is_child ? 32 : 40;
  return (
    <List
      itemLayout="horizontal"
      dataSource={comments}
      renderItem={(item) => (
        <List.Item>
          <List.Item.Meta
            avatar={
              <Avatar
                size={defaultAvatarSize}
                src={<YImg useImg src={item.user.avatar_hd} />}
              />
            }
            title={<span>{item.user.screen_name}</span>}
            description={
              <>
                <div
                  className="content"
                  dangerouslySetInnerHTML={{ __html: item.text }}
                ></div>
                {item.comments && item.comments.length > 0 && renderComments(item.comments,is_child)}
              </>
            }
          />
        </List.Item>
      )}
    />
  );
};
