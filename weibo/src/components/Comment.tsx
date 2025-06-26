/*
 * @Author: yangliwei 1280426581@qq.com
 * @Date: 2024-11-22 17:02:23
 * @LastEditTime: 2025-06-26 11:47:21
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\weibo\src\components\Comment.tsx
 * Copyright (c) 2024 by yangliwei, All Rights Reserved.
 * @Description:
 */
import { List, Avatar, Flex, Image } from "antd";
import { commentsItem } from "../../../type";
import YImg from "./YImg";
import dayjs from "dayjs";
import { HeartOutlined } from "@ant-design/icons";

// 渲染评论
export const renderComments = (comments: commentsItem[], is_child = false) => {
  const defaultAvatarSize = is_child ? 32 : 40;
  return (
    <div
      style={{
        borderTop: "1px solid rgb(255 255 255 / 10%)",
        marginLeft: "-8px",
        marginRight: "-8px",
        padding: "8px 8px 0px",
      }}
    >
      <List
        size="small"
        itemLayout="horizontal"
        dataSource={comments}
        renderItem={(item) => (
          <List.Item
            style={{
              margin: "0px -8px",
              padding: "8px",
              paddingBottom: "0px",
            }}
          >
            <List.Item.Meta
              avatar={
                <Avatar
                  size={defaultAvatarSize}
                  src={
                    item.user?.avatar_hd && (
                      <YImg useImg src={item.user?.avatar_hd} />
                    )
                  }
                >
                  {item.user?.screen_name}
                </Avatar>
              }
              title={<span>{item.user?.screen_name}</span>}
              description={
                <>
                  <div
                    className="content"
                    dangerouslySetInnerHTML={{ __html: item.text }}
                  ></div>
                  {item.url_struct && item.url_struct.length > 0 && (
                    <div className="imglist" style={{marginBottom:'10px'}} >
                      <Image.PreviewGroup>
                        {item.url_struct[0].pic_ids.map((pic) => {
                          const picInfo = item.url_struct![0].pic_infos[pic];
                          if (!picInfo) return null;
                          const imgProps = {
                            className: "img-item",
                            width: "100px",
                            height: "100px",
                            src: picInfo.large
                              ? picInfo.large.url
                              : picInfo.bmiddle.url,
                          };
                          return (
                            <div key={pic}>
                              <YImg {...imgProps} />
                            </div>
                          );
                        })}
                      </Image.PreviewGroup>
                    </div>
                  )}
                  <Flex
                    justify="space-between"
                    style={{
                      color: "#999",
                      fontSize: "13px",
                      fontWeight: "normal",
                    }}
                    align="center"
                  >
                    <span>
                      {dayjs(item.created_at).format("M-DD HH:mm")}{" "}
                      {item.source}
                    </span>
                    <span>
                      <HeartOutlined /> {item.like_counts}{" "}
                    </span>
                  </Flex>
                  <div
                    style={{
                      marginTop: "5px",
                    }}
                  >
                    {item.comments &&
                      item.comments.length > 0 &&
                      renderComments(item.comments, is_child)}
                  </div>
                </>
              }
            />
          </List.Item>
        )}
      />
    </div>
  );
};
