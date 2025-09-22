import { useCallback, useState } from "react";
import {
  payloadType,
  weiboCommentParams,
  weiboItem,
  weiboRepostParams,
  weiboUser,
  SearchType,
  uploadType,
  UploadImageResponsePayload,
} from "../../../type";
import { updateWeiboList } from "../utils/updateWeiboList";
import { weiboSendParams } from "../types";
import { parseArray } from "../utils";
import { useRequest } from "./useRequest";

const useWeiboAction = () => {
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
  const { request, contextHolder, messageApi } = useRequest();

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
    async (payload: string, replace = false) => {
      setIsFetching(true);
      try {
        const result = await request<payloadType>("GETDATA", payload, "请求微博中...");
        const newList = result.statuses.filter((item) => item.mblogtype !== 1);
        setList(currentList => replace ? newList : [...currentList, ...newList]);
        const wtotal = result.total_number ?? 999;
        setTotal(wtotal);
        setMaxId(result.max_id);
      } finally {
        setIsFetching(false);
      }
    },
    [request]
  );

  const getUserBlogData = useCallback(
    async (uid: string | number, page: number) => {
      setIsFetching(true);
      try {
        const result = await request<payloadType>(
          "GETUSERBLOG",
          JSON.stringify({ uid, page }),
          "请求用户微博中..."
        );
        const newList = result.data.list;
        setList(currentList => [...currentList, ...newList]);
        const wtotal = result.data?.total ?? 999;
        setTotal(wtotal);
      } finally {
        setIsFetching(false);
      }
    },
    [request]
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

  // 合并评论展开/收起方法
  const handleToggleComments = useCallback(
    async (id: number, uid: number, is_retweeted: boolean) => {
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
      const result = await request<any>(
        "GETCOMMENT",
        {
          url: `/statuses/buildComments?id=${id}&is_show_bulletin=2uid=${uid}&locale=zh-CN`,
          id,
          uid,
        },
        "请求评论中..."
      );
      updateList(
        (item) => item.id === id,
        (item) => ({ ...item, comments: result.data })
      );
    },
    [list, updateList, request]
  );

  // 合并长微博展开方法
  const handleExpandLongWeibo = useCallback(
    async (id: string | number) => {
      const result = await request<payloadType>("GETLONGTEXT", id, "请求长微博中...");
      const mblogid = result.payload;
      updateList(
        (item) => (item.mblogid ? item.mblogid : item.bid) === mblogid,
        (item) => ({
          ...item,
          text_raw: result.data.longTextContent,
          isLongText: false,
          text: result.data.longTextContent,
        })
      );
    },
    [updateList, request]
  );

  // 查看博主微博
  const getUserBlog = useCallback(
    async (userInfo: weiboUser) => {
      if (!userInfo) return;
      const result = await request<payloadType>("GETUSERBYNAME", "," + String(userInfo.id), "获取用户信息中...");
      setUserDetail({
        ...result.data,
        avatar_hd: result.data.avatar,
      });
      setUserDetailVisible(true);
    },
    [request]
  );

  const getUserByName = useCallback(
    async (username: string) => {
      const result = await request<payloadType>("GETUSERBYNAME", username, "获取用户信息中...");
      setUserDetail({
        ...result.data,
        avatar_hd: result.data.avatar,
      });
      setUserDetailVisible(true);
    },
    [request]
  );

  // 关注博主
  const followUser = useCallback(
    async (userInfo?: weiboUser) => {
      if (!userInfo) return;
      await request("GETFOLLOW", userInfo.id, "关注中...");
      messageApi.success("关注成功!");
      setUserDetail((prev) => (prev ? { ...prev, following: true } : prev));
      updateList(
        (item) => item.user?.id === userInfo!.id,
        (item) => ({
          ...item,
          user: { ...item.user, following: true } as weiboUser,
        })
      );
    },
    [updateList, request, messageApi]
  );

  // 取关博主
  const cancelFollow = useCallback(
    async (userInfo?: weiboUser) => {
      if (!userInfo) return;
      await request("GETCANCELFOLLOW", userInfo.id, "取关中...");
      messageApi.success("取消关注成功!");
      setUserDetail((prev) => (prev ? { ...prev, following: false } : prev));
      updateList(
        (item) => item.user?.id === userInfo!.id,
        (item) => ({
          ...item,
          user: { ...item.user, following: false } as weiboUser,
        })
      );
    },
    [updateList, request, messageApi]
  );

  // 搜索
  const getHotSearch = useCallback(async () => {
    const result = await request<payloadType>("GETHOTSEARCH", null, "正在刷新热搜...");
    return (result.data.realtime || []).slice(0, 20);
  }, [request]);

  const getWeiboSearch = useCallback(async (keyword: string, searchType: SearchType) => {
      const payload = `100103type=${searchType.type}&q=${keyword}&t=`;
      const result = await request<payloadType>("GETSEARCH", payload, "正在搜索...");
      return parseArray(result.data.cards, searchType);
  }, [request]);

  const uploadImage = useCallback(async (uploadData: uploadType) => {
    const result = await request<UploadImageResponsePayload>(
      "GETUPLOADIMGURL",
      JSON.stringify(uploadData),
      "上传图片中..."
    );
    return result;
  }, [request]);


  // 发送微博功能
  const handleSendWeibo = useCallback(
    async (content: weiboSendParams) => {
      setSendLoading(true);
      try {
        const result = await request<payloadType>(
          "GETNEWBLOGRESULT",
          JSON.stringify(content),
          "发送中..."
        );
        messageApi.success("微博发送成功!");
        setList((prev) => [result.data, ...prev]);
      } finally {
        setSendLoading(false);
      }
    },
    [request, messageApi]
  );

  // handleCommentOrRepost 评论或转发
  const handleCommentOrRepost = useCallback(
    async (comment: string, item: weiboItem, type: "comment" | "repost") => {
      if (type === "comment") {
        const obj = {
          comment,
          id: item.id,
          pic_id: "",
          is_repost: 0,
          comment_ori: 0,
          is_comment: 0,
        } as weiboCommentParams;
        await request("GETCREATECOMMENTS", obj, "发送评论中...");
        messageApi.success("评论成功!");
        updateList(
          (i) => i.id === item.id,
          (i) => ({ ...i, comments_count: i.comments_count + 1 })
        );
        // 刷新评论
        const result = await request<any>(
          "GETCOMMENT",
          {
            url: `/statuses/buildComments?flow=1&id=${item.id}&is_show_bulletin=2uid=${item.user?.id}&locale=zh-CN`,
            id: item.id,
            uid: item.user?.id,
          },
          "请求评论中..."
        );
        updateList(
          (i) => i.id === item.id,
          (i) => ({ ...i, comments: result.data })
        );
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
        await request("GETCREATEREPOST", obj, "转发微博中...");
        messageApi.success("转发成功!");
      }
    },
    [updateList, request, messageApi]
  );

  // 点赞,取消点赞
  const handleLike = useCallback(
    async (item: weiboItem, type: "like" | "cancel") => {
      setCurItem(item);
      if (type === "like") {
        await request("GETSETLIKE", item.id, "正在点赞...");
        messageApi.success("点赞成功!");
        updateList(
          (i) => i.id === item.id,
          (i) => ({
            ...i,
            attitudes_status: 1,
            attitudes_count: i.attitudes_count + 1,
          })
        );
      }
      if (type === "cancel") {
        await request("GETCANCELLIKE", item.id, "取消点赞中...");
        messageApi.success("取消点赞成功!");
        updateList(
          (i) => i.id === item.id,
          (i) => ({
            ...i,
            attitudes_status: 0,
            attitudes_count: i.attitudes_count - 1,
          })
        );
      }
    },
    [updateList, request, messageApi]
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
    copyLink,
    contextHolder,
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
    getHotSearch,
    getWeiboSearch,
    uploadImage,
    messageApi,
  };
};

export default useWeiboAction;
