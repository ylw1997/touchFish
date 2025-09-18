import { useCallback, useMemo, useState, RefObject } from "react";
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
import { useMessageHandler } from "./useMessageHandler";

const useWeiboAction = (
  source: string,
  scrollableNodeRef?: RefObject<HTMLDivElement | null>
) => {
  // 微博列表相关状态
  const [list, setList] = useState<weiboItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isFetching, setIsFetching] = useState(false);
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
      setIsFetching(false);
      messageApi.destroy("GETUSERBLOG");
      const wlist = [...list, ...payload.data.list];
      const wtotal = payload.data?.total ?? 999;
      setList(wlist);
      setTotal(wtotal);
    },
    [list, messageApi]
  );

  const handleSendData = useCallback(
    (payload: payloadType) => {
      setIsFetching(false);
      messageApi.destroy("GETDATA");
      const wlist = [
        ...list,
        ...payload.statuses.filter((item) => item.mblogtype !== 1),
      ];
      const wtotal = payload.total_number ?? 999;
      setList(wlist);
      setTotal(wtotal);
      setMaxId(payload.max_id);
    },
    [list, messageApi, setMaxId]
  );

  const handleSendComment = useCallback(
    (payload: payloadType) => {
      messageApi.destroy("GETCOMMENT");
      const { id } = payload.payload;
      const data = payload.data;
      updateList(
        (item) => item.id === id,
        (item) => ({ ...item, comments: data })
      );
    },
    [messageApi, updateList]
  );

  const handleSendCreateComments = useCallback(
    () => {
      messageApi.destroy("GETCREATECOMMENTS");
      messageApi.success("评论成功!");
      if (curItem) {
        updateList(
          (item) => item.id === curItem.id,
          (item) => ({ ...item, comments_count: item.comments_count + 1 })
        );
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
    },
    [messageApi, source, curItem, updateList, sendMessage]
  );

  const handleSendCreateRepost = useCallback(
    () => {
      messageApi.destroy("GETCREATEREPOST");
      messageApi.success("转发成功!");
    },
    [messageApi]
  );

  const handleSendLongText = useCallback(
    (payload: payloadType) => {
      messageApi.destroy("GETLONGTEXT");
      const mblogid = payload.payload;
      updateList(
        (item) => (item.mblogid ? item.mblogid : item.bid) === mblogid,
        (item) => ({
          ...item,
          text_raw: payload.data.longTextContent,
          isLongText: false,
          text: payload.data.longTextContent,
        })
      );
    },
    [messageApi, updateList]
  );

  const handleSendFollow = useCallback(
    () => {
      messageApi.destroy("GETFOLLOW");
      messageApi.success("关注成功!");
      if (userDetail) {
        setUserDetail((prev) => (prev ? { ...prev, following: true } : prev));
        updateList(
          (item) => item.user?.id === userDetail!.id,
          (item) => ({
            ...item,
            user: { ...item.user, following: true } as weiboUser,
          })
        );
      }
    },
    [messageApi, updateList, userDetail]
  );

  const handleSendNewBlogResult = useCallback(
    (payload: payloadType) => {
      messageApi.destroy("GETNEWBLOGRESULT");
      setSendLoading(false);
      messageApi.success("微博发送成功!");
      setList((prev) => [payload.data, ...prev]);
    },
    [messageApi, setSendLoading]
  );

  const handleSendCancelFollow = useCallback(
    () => {
      messageApi.destroy("GETCANCELFOLLOW");
      messageApi.success("取消关注成功!");
      if (userDetail) {
        setUserDetail((prev) => (prev ? { ...prev, following: false } : prev));
        updateList(
          (item) => item.user?.id === userDetail!.id,
          (item) => ({
            ...item,
            user: { ...item.user, following: false } as weiboUser,
          })
        );
      }
    },
    [messageApi, updateList, userDetail]
  );

  const handleSendSetLike = useCallback(
    () => {
      messageApi.destroy("GETSETLIKE");
      messageApi.success("点赞成功!");
      if (curItem) {
        updateList(
          (item) => item.id === curItem.id,
          (item) => ({
            ...item,
            attitudes_status: 1,
            attitudes_count: item.attitudes_count + 1,
          })
        );
      }
    },
    [messageApi, updateList, curItem]
  );

  const handleSendCancelLike = useCallback(
    () => {
      messageApi.destroy("GETCANCELLIKE");
      messageApi.success("取消点赞成功!");
      if (curItem) {
        updateList(
          (item) => item.id === curItem.id,
          (item) => ({
            ...item,
            attitudes_status: 0,
            attitudes_count: item.attitudes_count - 1,
          })
        );
      }
    },
    [messageApi, updateList, curItem]
  );

  const handleSendUserByName = useCallback(
    (payload: payloadType) => {
      messageApi.destroy("GETUSERBYNAME");
      setUserDetail({
        ...payload.data,
        avatar_hd: payload.data.avatar,
      });
      setUserDetailVisible(true);
    },
    [messageApi]
  );

  const handleRestoreScrollPosition = useCallback(
    (payload: number) => {
      if (scrollableNodeRef?.current) {
        // console.log("恢复滚动位置:", payload);
        scrollableNodeRef.current.scrollTop = payload;
      }
    },
    [scrollableNodeRef]
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
      SENDNEWBLOGRESULT: handleSendNewBlogResult,
      SENDCANCELFOLLOW: handleSendCancelFollow,
      SENDSETLIKE: handleSendSetLike,
      SENDCANCELLIKE: handleSendCancelLike,
      SENDUSERBYNAME: handleSendUserByName,
      RESTORE_SCROLL_POSITION: handleRestoreScrollPosition,
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
      handleSendUserByName,
      handleRestoreScrollPosition,
    ]
  );

  useMessageHandler(handlers, { source, messageApi });

  // 请求数据（主列表/用户微博）
  const getListData = useCallback(
    (payload: string) => {
      setIsFetching(true);
      sendMessage("GETDATA", payload, "请求微博中...", source);
    },
    [sendMessage, source]
  );

  const getUserBlogData = useCallback(
    (uid: string | number, page: number) => {
      setIsFetching(true);
      sendMessage(
        "GETUSERBLOG",
        JSON.stringify({ uid, page }),
        "请求用户微博中...",
        source
      );
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
    (id: string | number) => {
      sendMessage("GETLONGTEXT", id, "请求长微博中...", source);
    },
    [sendMessage, source]
  );

  // 查看博主微博
  const getUserBlog = useCallback((userInfo: weiboUser) => {
    setUserDetail(userInfo);
    setUserDetailVisible(true);
  }, []);

  const getUserByName = useCallback(
    (username: string) => {
      sendMessage("GETUSERBYNAME", username, "获取用户信息中...", source);
    },
    [sendMessage, source]
  );

  // 关注博主
  const followUser = useCallback(
    (userInfo?: weiboUser, sourceStr = source) => {
      if (!userInfo) return;
      setUserDetail(userInfo);
      sendMessage("GETFOLLOW", userInfo.id, "关注中...", sourceStr);
    },
    [sendMessage, source]
  );
  // 取关博主
  const cancelFollow = useCallback(
    (userInfo?: weiboUser, sourceStr = source) => {
      if (!userInfo) return;
      setUserDetail(userInfo);
      sendMessage("GETCANCELFOLLOW", userInfo.id, "取关中...", sourceStr);
    },
    [sendMessage, source]
  );
  // 发送微博功能
  const handleSendWeibo = useCallback(
    (content: weiboSendParams) => {
      setSendLoading(true);
      sendMessage(
        "GETNEWBLOGRESULT",
        JSON.stringify(content),
        "发送中...",
        source
      );
    },
    [sendMessage, source]
  );

  // handleCommentOrRepost 评论或转发
  const handleCommentOrRepost = useCallback(
    (comment: string, item: weiboItem, type: "comment" | "repost") => {
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
    },
    [sendMessage, source]
  );

  // 点赞,取消点赞
  const handleLike = useCallback(
    (item: weiboItem, type: "like" | "cancel") => {
      setCurItem(item);
      if (type == "like") {
        sendMessage("GETSETLIKE", item.id, "正在点赞...", source);
      }
      if (type == "cancel") {
        sendMessage("GETCANCELLIKE", item.id, "取消点赞中...", source);
      }
    },
    [sendMessage, source]
  );

  return {
    getListData,
    getUserBlogData,
    isFetching,
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
    getUserByName,
  };
};

export default useWeiboAction;
