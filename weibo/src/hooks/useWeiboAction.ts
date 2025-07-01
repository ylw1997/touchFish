import { useCallback, useState } from "react";
import {
  weiboCommentParams,
  weiboItem,
  weiboRepostParams,
  weiboUser,
} from "../../../type";
import { updateWeiboList } from "../utils/updateWeiboList";
import { useVscodeMessage } from "./useVscodeMessage";
import { weiboSendParams } from "../types";
const useWeiboAction = (source: string) => {
  const [list, setList] = useState<weiboItem[]>([]);
  const [total, setTotal] = useState(0);
  const [max_id, setMaxId] = useState<number>();
  const [curItem, setCurItem] = useState<weiboItem>();
  const [userDetailVisible, setUserDetailVisible] = useState(false);
  const [userDetail, setUserDetail] = useState<weiboUser>();
  const [sendLoading, setSendLoading] = useState(false);
  const [userWeiboPage, setUserWeiboPage] = useState(1); // 用户微博页码

  const { sendMessage, contextHolder, messageApi } = useVscodeMessage();

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
        messageApi.success("链接已复制到剪贴板");
      });
    },
    [messageApi]
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
