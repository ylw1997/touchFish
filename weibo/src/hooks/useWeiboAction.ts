import { useCallback, useEffect, useMemo, useState } from "react";
import {
  payloadType,
  weiboCommentParams,
  weiboItem,
  weiboRepostParams,
  weiboUser,
} from "../../../type";
import { updateWeiboList } from "../utils/updateWeiboList";
import { useVscodeMessage } from "./useVscodeMessage";
import { weiboSendParams } from "../types";
import { commandsType, weiboAJAX } from "../../../type";
const useWeiboAction = (source: string) => {
  // 微博列表相关状态
  const [list, setList] = useState<weiboItem[]>([]);
  const [total, setTotal] = useState(0);
  const [max_id, setMaxId] = useState<number>();
  const [userWeiboPage, setUserWeiboPage] = useState(1); // 用户微博页码

  // 当前操作项相关状态
  const [curItem, setCurItem] = useState<weiboItem>();

  // 用户详情相关状态
  const [userDetailVisible, setUserDetailVisible] = useState(false);
  const [userDetail, setUserDetail] = useState<weiboUser>();

  // 发送状态相关
  const [sendLoading, setSendLoading] = useState(false);
  const { sendMessage, contextHolder, messageApi } = useVscodeMessage();

  // 统一消息提示
  const showMessage = useCallback(
    (type: "success" | "error", content: string, key?: string) => {
      if (key) messageApi.destroy(key);
      messageApi[type](content);
    },
    [messageApi]
  );

  // 更新微博列表项
  const updateWeiboItem = useCallback(
    (id: number, updater: (item: weiboItem) => weiboItem) => {
      setList((prev) =>
        prev.map((item) => (item.id === id ? updater(item) : item))
      );
    },
    []
  );

  // 更新用户关注状态
  const updateUserFollowStatus = useCallback(
    (userId: number, following: boolean) => {
      setList((prev) =>
        prev.map((item) =>
          item.user?.id === userId
            ? { ...item, user: { ...item.user, following } as weiboUser }
            : item
        )
      );
      setUserDetail((prev) =>
        prev?.id === userId ? { ...prev, following } : prev
      );
    },
    [setUserDetail]
  );

  // 更新微博列表
  const updateList = useCallback(
    (
      matcher: (item: weiboItem) => boolean,
      updater: (item: weiboItem) => weiboItem
    ) => {
      setList((list) => updateWeiboList(list, matcher, updater));
    },
    []
  );

  // 处理函数集合
  const handleSendUserBlog = useCallback(
    (payload: payloadType) => {
      messageApi.destroy("GETUSERBLOG");
      if (payload?.ok && payload.source === source) {
        const wlist = [...list, ...payload.data.list];
        const wtotal = payload.data?.total ?? 999;
        setList(wlist);
        setTotal(wtotal);
      } else if (payload?.source === source) {
        showMessage("error", "用户微博请求失败!" + payload?.msg);
      }
    },
    [list, messageApi, showMessage, source]
  );

  const handleSendData = useCallback(
    (payload: payloadType) => {
      messageApi.destroy("GETDATA");
      if (payload?.ok && payload.source === source) {
        const wlist = [...list, ...payload.statuses];
        const wtotal = payload.total_number ?? 999;
        setList(wlist);
        setTotal(wtotal);
        setMaxId(payload.max_id);
      } else if (payload?.source === source) {
        showMessage("error", "数据请求失败!" + payload?.msg);
      }
    },
    [messageApi, source, list, showMessage]
  );

  const handleSendComment = useCallback(
    (payload: payloadType) => {
      messageApi.destroy("GETCOMMENT");
      if (payload?.ok && payload.source === source) {
        const { id } = payload.payload;
        const data = payload.data;
        updateList(
          (item) => item.id === id,
          (item) => ({ ...item, comments: data })
        );
      } else if (payload?.source === source) {
        showMessage("error", "评论请求失败!" + payload?.msg);
      }
    },
    [messageApi, source, updateList, showMessage]
  );

  const handleSendCreateComments = useCallback(
    (payload: payloadType) => {
      messageApi.destroy("GETCREATECOMMENTS");
      if (payload?.ok && payload.source === source) {
        showMessage("success", "评论成功!");
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
      } else if (payload?.source === source) {
        showMessage("error", "评论失败!" + payload?.msg);
      }
    },
    [messageApi, source, showMessage, curItem, sendMessage]
  );

  const handleSendCreateRepost = useCallback(
    (payload: payloadType) => {
      messageApi.destroy("GETCREATEREPOST");
      if (payload?.ok && payload.source === source) {
        showMessage("success", "转发成功!");
      } else if (payload?.source === source) {
        showMessage("error", "转发失败!" + payload?.msg);
      }
    },
    [messageApi, showMessage, source]
  );

  const handleSendLongText = useCallback(
    (payload: payloadType) => {
      messageApi.destroy("GETLONGTEXT");
      if (payload?.ok && payload.source === source) {
        const mblogid = payload.payload;
        const text = payload.data.longTextContent.replace(/\n/g, "<br/>");
        updateList(
          (item) => item.mblogid === mblogid,
          (item) => ({ ...item, text })
        );
      } else if (payload?.source === source) {
        showMessage("error", "长文本请求失败!" + payload?.msg);
      }
    },
    [messageApi, showMessage, source, updateList]
  );

  const handleSendFollow = useCallback(
    (payload: payloadType) => {
      messageApi.destroy("GETFOLLOW");
      if (payload?.ok && payload.source === source) {
        if (userDetail) {
          showMessage("success", "关注成功!");
          updateUserFollowStatus(userDetail.id, true);
        }
      } else if (payload?.source === source) {
        showMessage("error", "关注请求失败!" + payload?.msg);
      }
    },
    [messageApi, showMessage, source, updateUserFollowStatus, userDetail]
  );

  const handleSendNewBlogResult = useCallback(
    (payload: payloadType) => {
      messageApi.destroy("GETNEWBLOGRESULT");
      setSendLoading(false);
      if (payload?.ok && payload.source === source) {
        showMessage("success", "微博发送成功!");
        setList((prev) => [payload.data, ...prev]);
      } else if (payload?.source === source) {
        showMessage("error", "微博发送失败!" + payload?.msg);
      }
    },
    [messageApi, source, showMessage]
  );

  const handleSendCancelFollow = useCallback(
    (payload: payloadType) => {
      messageApi.destroy("GETCANCELFOLLOW");
      if (payload?.ok && payload.source === source) {
        if (userDetail) {
          showMessage("success", "取消关注成功!");
          updateUserFollowStatus(userDetail.id, false);
        }
      } else if (payload?.source === source) {
        showMessage("error", "取消关注请求失败!" + payload?.msg);
      }
    },
    [messageApi, showMessage, source, updateUserFollowStatus, userDetail]
  );

  const handleSendSetLike = useCallback(
    (payload: payloadType) => {
      messageApi.destroy("GETSETLIKE");
      if (payload?.ok && payload.source === source) {
        if (curItem) {
          showMessage("success", "点赞成功!");
          updateWeiboItem(curItem.id, (item) => ({
            ...item,
            attitudes_status: 1,
            attitudes_count: item.attitudes_count + 1,
          }));
        }
      } else if (payload?.source === source) {
        showMessage("error", "点赞失败!" + payload?.msg);
      }
    },
    [messageApi, source, curItem, showMessage, updateWeiboItem]
  );

  const handleSendCancelLike = useCallback(
    (payload: payloadType) => {
      messageApi.destroy("GETCANCELLIKE");
      if (payload?.ok && payload.source === source) {
        if (curItem) {
          showMessage("success", "取消点赞成功!");
          updateWeiboItem(curItem.id, (item) => ({
            ...item,
            attitudes_status: 0,
            attitudes_count: item.attitudes_count - 1,
          }));
        }
      } else if (payload?.source === source) {
        showMessage("error", "取消点赞失败!" + payload?.msg);
      }
    },
    [messageApi, source, curItem, showMessage, updateWeiboItem]
  );

  const handlers = useMemo(
    () => ({
      SENDUSERBLOG: handleSendUserBlog,
      SENDDATA: handleSendData,
      SENDCOMMENT: handleSendComment,
      SENDCREATECOMMENTS: handleSendCreateComments,
      SENDCREATEREPOST: handleSendCreateRepost,
      SENDLONGTEXT: handleSendLongText,
      SENDFOLLOW: handleSendFollow,
      SENTNEWBLOGRESULT: handleSendNewBlogResult,
      SENDCANCELFOLLOW: handleSendCancelFollow,
      SENDSETLIKE: handleSendSetLike,
      SENDCANCELLIKE: handleSendCancelLike,
    }),
    [
      handleSendUserBlog,
      handleSendData,
      handleSendComment,
      handleSendCreateComments,
      handleSendCreateRepost,
      handleSendLongText,
      handleSendFollow,
      handleSendNewBlogResult,
      handleSendCancelFollow,
      handleSendSetLike,
      handleSendCancelLike,
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

  // 请求数据（主列表/用户微博）
  const getListData = useCallback(
    (payload: string) => {
      sendMessage("GETDATA", payload, "请求微博中...", source);
    },
    [sendMessage, source]
  );

  // 清空列表
  const clearList = useCallback(() => {
    setList([]);
    setMaxId(undefined);
    setTotal(0);
  }, []);

  // 复制
  const copyLink = useCallback(
    (url: string) => {
      navigator.clipboard.writeText(url).then(() => {
        showMessage("success", "链接已复制到剪贴板");
      });
    },
    [showMessage]
  );

  // 合并评论展开/收起方法，支持主列表和用户微博列表
  const handleToggleComments = useCallback(
    (id: number, uid: number, is_retweeted: boolean) => {
      const citem = list.find(
        (item) => item.id === id || item.retweeted_status?.id === id
      );
      if (citem?.comments && !is_retweeted) {
        updateList(
          (item) => item.id === id,
          (item) => ({ ...item, comments: undefined })
        );
        return;
      }
      if (is_retweeted && citem?.retweeted_status?.comments) {
        updateList(
          (item) => item.retweeted_status?.id === id,
          (item) => ({
            ...item,
            retweeted_status: {
              ...item.retweeted_status!,
              comments: undefined,
            },
          })
        );
        return;
      }
      sendMessage(
        "GETCOMMENT",
        {
          url: `/statuses/buildComments?id=${id}&is_show_bulletin=2uid=${uid}&locale=zh-CN`,
          id,
          uid,
        },
        "请求评论中...",
        source
      );
    },
    [list, sendMessage, updateList, source]
  );

  // 合并长微博展开方法，支持主列表和用户微博列表
  const handleExpandLongWeibo = useCallback(
    (id: string) => {
      sendMessage("GETLONGTEXT", id, "请求长微博中...", source);
    },
    [sendMessage, source]
  );

  // 查看博主微博
  const getUserBlog = useCallback((userInfo: weiboUser) => {
    setUserDetail(userInfo);
    setUserDetailVisible(true);
  }, []);

  // 关注博主
  const followUser = useCallback(
    (userInfo?: weiboUser) => {
      if (!userInfo) return;
      setUserDetail(userInfo);
      sendMessage("GETFOLLOW", userInfo.id, "关注中...", source);
    },
    [sendMessage, source]
  );
  // 取关博主
  const cancelFollow = useCallback(
    (userInfo?: weiboUser) => {
      if (!userInfo) return;
      setUserDetail(userInfo);
      sendMessage("GETCANCELFOLLOW", userInfo.id, "取关中...", source);
    },
    [sendMessage, source]
  );
  // 发送微博功能
  const handleSendWeibo = (content: weiboSendParams) => {
    setSendLoading(true);
    sendMessage(
      "GETNEWBLOGRESULT",
      JSON.stringify(content),
      "发送中...",
      source
    );
  };

  // handleCommentOrRepost 评论或转发
  const handleCommentOrRepost = (
    comment: string,
    item: weiboItem,
    type: "comment" | "repost"
  ) => {
    if (type === "comment") {
      const obj = {
        comment,
        id: item.id,
        pic_id: "",
        is_repost: 0,
        comment_ori: 0,
        is_comment: 0,
      } as weiboCommentParams;
      sendMessage("GETCREATECOMMENTS", obj, "发送评论中...", source);
      setCurItem(item); //缓存当前微博,当收到回调时刷新
    }

    if (type === "repost") {
      const obj = {
        comment,
        id: item.id,
        pic_id: "",
        is_repost: 0,
        comment_ori: 0,
        is_comment: 0,
        visible: 0,
        share_id: "",
      } as weiboRepostParams;
      sendMessage("GETCREATEREPOST", obj, "转发微博中...", source);
    }
  };

  // 点赞,取消点赞
  const handleLike = (item: weiboItem, type: "like" | "cancel") => {
    setCurItem(item);
    if (type == "like") {
      sendMessage("GETSETLIKE", item.id, "正在点赞...", source);
    }
    if (type == "cancel") {
      sendMessage("GETCANCELLIKE", item.id, "取消点赞中...", source);
    }
  };

  return {
    getListData,
    list,
    setList,
    total,
    setTotal,
    updateList,
    sendMessage,
    copyLink,
    contextHolder,
    messageApi,
    clearList,
    max_id,
    setMaxId,
    handleToggleComments,
    handleExpandLongWeibo,
    curItem,
    setCurItem,
    userDetailVisible,
    setUserDetailVisible,
    userDetail,
    setUserDetail,
    getUserBlog,
    sendLoading,
    setSendLoading,
    handleCommentOrRepost,
    handleLike,
    handleSendWeibo,
    cancelFollow,
    followUser,
    userWeiboPage,
    setUserWeiboPage,
  };
};

export default useWeiboAction;
