/*
 * @Author: yangliwei 1280426581@qq.com
 * @Date: 2024-11-22 17:02:23
 * @LastEditTime: 2025-09-25 10:18:28
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\x\src\components\Comment.tsx
 * Copyright (c) 2024 by yangliwei, All Rights Reserved.
 * @Description:
 */
import { List, Avatar, Flex, Image } from "antd";
import { motion } from "framer-motion";
import { commentsItem, xUser } from "../../../types/x";
import YImg from "./YImg";
import dayjs from "dayjs";
import { parseXText } from "../utils/textParser";
import { HeartOutlined } from "@ant-design/icons";

// 渲染评论
export const renderComments = (
  comments: commentsItem[],
  is_child = false,
  getUserByName: (username: string) => void,
  onUserClick: (userInfo: xUser) => void,
  onTopicClick: (topic: string) => void,
) => {
  return (
    <div className="border-top-divider">
      <List
        size="small"
        itemLayout="horizontal"
        dataSource={comments}
        renderItem={(item) => (
          <motion.li
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="ant-list-item"
            style={{
              display: "block",
              padding: "0px",
            }}
          >
            <div
              style={{
                padding: is_child ? "8px 0px 0px" : "8px 8px 0px",
              }}
            >
              <List.Item.Meta
                avatar={
                  <Avatar
                    size={32}
                    src={
                      item.user?.avatar_hd ? (
                        <YImg useImg src={item.user.avatar_hd} />
                      ) : undefined
                    }
                  >
                    {item.user?.screen_name?.[0]?.toUpperCase()}
                  </Avatar>
                }
                title={
                  <span
                    className={"nick-name"}
                    onClick={() => {
                      if (onUserClick && item.user) {
                        onUserClick(item.user);
                      }
                    }}
                  >
                    {item.user?.screen_name}
                  </span>
                }
                description={
                  <>
                    <div className="content comment-content">
                      {parseXText(item, getUserByName, onTopicClick)}
                    </div>
                    {((item.pic_ids && item.pic_ids.length > 0) || (item.url_struct && item.url_struct.length > 0)) && (
                      <div
                        className="imglist"
                        style={{ marginBottom: "8px", padding: "0px" }}
                      >
                        <Image.PreviewGroup
                          preview={{
                            getContainer: () => document.body,
                            movable: false,
                          }}
                        >
                          {(item.pic_ids || item.url_struct?.[0]?.pic_ids)?.map((picId: string) => {
                            const picInfo = (item.pic_infos?.[picId] || item.url_struct?.[0]?.pic_infos?.[picId]);
                            if (!picInfo) return null;
                            
                            const isVideo = picInfo.type === 'video';
                            const imgProps: any = {
                              className: "img-item",
                              src: isVideo ? (picInfo.video_url || picInfo.large?.url || picInfo.bmiddle?.url) : (picInfo.large?.url || picInfo.bmiddle?.url),
                              mediaType: isVideo ? 'video' : 'image',
                            };
                            
                            return (
                              <div key={picId}>
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
                      <span>{dayjs(item.created_at).format("M-DD HH:mm")}</span>
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
                        renderComments(
                          item.comments,
                          true,
                          getUserByName,
                          onUserClick,
                          onTopicClick,
                        )}
                    </div>
                  </>
                }
              />
            </div>
          </motion.li>
        )}
      />
    </div>
  );
};
