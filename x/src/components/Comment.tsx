/*
 * @Author: yangliwei 1280426581@qq.com
 * @Date: 2024-11-22 17:02:23
 * @LastEditTime: 2025-09-25 10:18:28
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\x\src\components\Comment.tsx
 * Copyright (c) 2024 by yangliwei, All Rights Reserved.
 * @Description:
 */
import { List, Avatar, Flex, Image, Tag } from "antd";
import { motion } from "framer-motion";
import { commentsItem, xUser } from "../../../types/x";
import YImg from "./YImg";
import dayjs from "dayjs";
import { parseXText } from "../utils/textParser";
import { HeartOutlined } from "@ant-design/icons";

export const renderComments = (
  comments: commentsItem[],
  is_child = false,
  getUserByName: (username: string) => void,
  onUserClick: (userInfo: xUser) => void,
  onTopicClick: (topic: string) => void,
  onTranslate?: (item: any) => void,
  onClearTranslation?: (item: any) => void,
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
                      {(item.text_raw || item.text)?.trim() ? (
                        <Tag
                          color={item.translatedText ? "gold" : "cyan"}
                          bordered={false}
                          style={{ marginLeft: "8px", cursor: "pointer" }}
                          className="link-tag"
                          onClick={() =>
                            item.translatedText
                              ? onClearTranslation?.(item)
                              : !item.isTranslating && onTranslate?.(item)
                          }
                        >
                          {item.isTranslating
                            ? "翻译中..."
                            : item.translatedText
                              ? "还原"
                              : "翻译"}
                        </Tag>
                      ) : null}
                    </div>

                    {item.translatedText ? (
                      <div style={{ marginTop: "4px", paddingTop: "4px" }}>
                        <div
                          style={{
                            fontSize: "10px",
                            opacity: 0.6,
                            marginBottom: "2px",
                          }}
                        >
                          翻译结果
                        </div>
                        <div
                          style={{
                            color: "var(--vscode-editor-foreground)",
                            marginTop: "4px",
                          }}
                        >
                          {item.translatedText}
                        </div>
                      </div>
                    ) : null}

                    {((item.pic_ids && item.pic_ids.length > 0) ||
                      (item.url_struct && item.url_struct.length > 0)) && (
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
                          {(item.pic_ids || item.url_struct?.[0]?.pic_ids)?.map(
                            (picId: string) => {
                              const picInfo =
                                item.pic_infos?.[picId] ||
                                item.url_struct?.[0]?.pic_infos?.[picId];
                              if (!picInfo) return null;

                              const isVideo = picInfo.type === "video";
                              const totalMedia =
                                (item.pic_ids?.length || 0) +
                                (item.url_struct?.[0]?.pic_ids?.length || 0);
                              const imgProps: any = {
                                className: isVideo
                                  ? "video-item"
                                  : totalMedia > 1
                                    ? "img-item"
                                    : "img-only-item",
                                src: isVideo
                                  ? picInfo.video_url ||
                                    picInfo.large?.url ||
                                    picInfo.bmiddle?.url
                                  : picInfo.large?.url || picInfo.bmiddle?.url,
                                mediaType: isVideo ? "video" : "image",
                              };

                              return (
                                <div key={picId}>
                                  <YImg {...imgProps} />
                                </div>
                              );
                            },
                          )}
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
                          onTranslate,
                          onClearTranslation,
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
