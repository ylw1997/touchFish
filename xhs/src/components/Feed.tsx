/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-10-23 08:49:35
 * @LastEditTime: 2025-11-03 14:54:56
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\xhs\src\components\Feed.tsx
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description:
 */
import { useEffect, useRef, useState, useCallback } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import Masonry from "react-masonry-css";
import { FloatButton } from "antd";
import {
  RedoOutlined,
  VerticalAlignTopOutlined,
  SearchOutlined,
  UserOutlined,
  PlusOutlined,
  MinusOutlined,
  FormOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from "@ant-design/icons";
import useXhsFeed from "../hooks/useXhsFeed";
import { loaderFunc } from "../utils/loader";
import XhsFeedCard from "./XhsFeedCard";
import { vscode } from "../utils/vscode";
import { debounce } from "../utils/utils";
import {
  MASONRY_BREAKPOINTS,
  INFINITE_SCROLL_CONFIG,
  DEBOUNCE_DELAY,
} from "../constants";
import FeedDetailDrawer from "./FeedDetailDrawer";
import XhsSearchDrawer from "./XhsSearchDrawer";
import UserPostedDrawer from "./UserPostedDrawer";
import XhsSendDrawer from "./XhsSendDrawer";
import { useRequest } from "../hooks/useRequest";
import { createXhsApi } from "../api";
import { useFontSizeStore } from "../store/fontSize";
import { useConfigStore } from "../store/config";

export default function Feed() {
  const { items, loadMore, hasMore, refresh } = useXhsFeed();
  // 详情状态
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeNoteId, setActiveNoteId] = useState<string>("");
  const [activeXsecToken, setActiveXsecToken] = useState<string>("");
  // 搜索弹窗状态
  const [searchOpen, setSearchOpen] = useState(false);
  // 用户主页弹窗状态
  const [userOpen, setUserOpen] = useState(false);
  // 发布抽屉状态
  const [sendDrawerOpen, setSendDrawerOpen] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [userParams, setUserParams] = useState<{
    cursor: string;
    user_id: string;
    xsec_token?: string;
    user?: any;
    xsec_source?: any;
  }>({ cursor: "", user_id: "" });
  const { increase, decrease } = useFontSizeStore();
  const { showImg, toggleShowImg, setShowImg } = useConfigStore();

  const { request, messageApi } = useRequest();
  const apiRef = useRef(createXhsApi(request));

  const handleMyInfo = useCallback(async () => {
    try {
      const data: any = await apiRef.current.getMyUserInfo();
      if (data) {
        // 映射用户信息并打开 UserPostedDrawer
        // user/me 接口返回: { user_id, nickname, images, desc, red_id, ... }
        // UserPostedDrawer 期望 user 对象包含: nick_name/nickname, avatar ...
        const mappedUser = {
          ...data,
          nickname: data.nickname,
          avatar: data.images,
        };
        setUserParams({
          cursor: "",
          user_id: data.user_id,
          xsec_token: "", // 这里传空，UserPostedDrawer 已做兼容
          user: mappedUser,
        });
        setUserOpen(true);
      }
    } catch (e: any) {
      messageApi.error(e.message || "获取用户信息失败");
    }
  }, [messageApi]);

  // 目前 Drawer 内部自行通过 useRequest 获取接口，此处仅维持滚动保存逻辑
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (items.length === 0) loadMore(true);
    const scrollableNode = scrollRef.current;
    if (!scrollableNode) return;

    const handleScroll = debounce(() => {
      vscode.postMessage({
        command: "XHS_SAVE_SCROLL_POSITION",
        payload: scrollableNode.scrollTop,
      });
    }, DEBOUNCE_DELAY.SCROLL);

    const messageHandler = (ev: MessageEvent<any>) => {
      if (ev.type !== "message" || !ev.data?.command) return;
      if (ev.data.command === "XHS_RESTORE_SCROLL_POSITION") {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = ev.data.payload;
        }
      }
      if (ev.data.command === "XHS_IMG_TOGGLED") {
        setShowImg(!!ev.data.payload);
      }
    };

    scrollableNode.addEventListener("scroll", handleScroll);
    window.addEventListener("message", messageHandler);

    return () => {
      scrollableNode.removeEventListener("scroll", handleScroll);
      window.removeEventListener("message", messageHandler);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleOpenDetail = useCallback((raw: any) => {
    if (!raw?.id) return;
    setDetailOpen(true);
    setActiveNoteId(raw.id);
    setActiveXsecToken(raw.xsec_token);
  }, []);

  const handleOpenUser = useCallback((raw: any, user: any) => {
    if (!user?.user_id) return;
    // 以当前笔记 id 作为初始 cursor，有些接口可能不认可；如果需要可置空 ''
    setUserParams({
      cursor: raw.id,
      user_id: user.user_id,
      xsec_token: raw.xsec_token,
      user,
    });
    setUserOpen(true);
  }, []);

  // 处理图片上传
  const handleUploadImage = useCallback(
    async (file: File) => {
      try {
        // 将文件转换为 base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
        });

        const result = await apiRef.current.uploadImage({
          file: base64,
          name: file.name,
          type: file.type,
        });

        messageApi.success("图片上传成功");
        // 返回完整的 fileId（包含 spectrum/ 前缀），用于发布笔记
        return { url: result.fullFileId || result.url };
      } catch (error: any) {
        messageApi.error(error.message || "图片上传失败");
        throw error;
      }
    },
    [messageApi],
  );

  // 处理发布笔记
  const handleSendNote = useCallback(
    async (params: { title: string; content: string; images: string[] }) => {
      setSendLoading(true);
      try {
        const result = await apiRef.current.publishNote({
          title: params.title,
          desc: params.content,
          images: params.images,
        });

        if (result.success) {
          messageApi.success("笔记发布成功！");
          setSendDrawerOpen(false);
        } else {
          throw new Error(result.msg || "发布失败");
        }
      } catch (error: any) {
        messageApi.error(error.message || "笔记发布失败");
      } finally {
        setSendLoading(false);
      }
    },
    [messageApi],
  );

  return (
    <div
      id="xhsScrollableDiv"
      ref={scrollRef}
      style={{ height: "100vh", overflow: "auto" }}
    >
      <FeedDetailDrawer
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setActiveNoteId("");
          setActiveXsecToken("");
        }}
        // 仅传递基础标识，Drawer 内部自行请求
        detail={{ note_id: activeNoteId, xsec_token: activeXsecToken }}
      />
      <XhsSearchDrawer open={searchOpen} onClose={() => setSearchOpen(false)} />
      {/* 使用 Antd 浮动按钮组（参考 weibo） */}
      <FloatButton.Group shape="circle" style={{ insetInlineEnd: 24 }}>
        <FloatButton.BackTop
          visibilityHeight={INFINITE_SCROLL_CONFIG.BACK_TOP_VISIBILITY_HEIGHT}
          duration={INFINITE_SCROLL_CONFIG.BACK_TOP_DURATION}
          icon={<VerticalAlignTopOutlined style={{ color: "#f37fb7" }} />}
          tooltip={{ title: "回到顶部", placement: "left" }}
          target={() => scrollRef.current || window}
        />
        <FloatButton
          onClick={refresh}
          icon={<RedoOutlined style={{ color: "#b37feb" }} />}
          tooltip={{ title: "刷新", placement: "left" }}
        />
        <FloatButton
          onClick={() => setSearchOpen(true)}
          icon={<SearchOutlined style={{ color: "#faad14" }} />}
          tooltip={{ title: "搜索", placement: "left" }}
        />
        <FloatButton
          onClick={handleMyInfo}
          icon={<UserOutlined style={{ color: "#faad14" }} />}
          tooltip={{ title: "我的", placement: "left" }}
        />
        <FloatButton
          onClick={() => setSendDrawerOpen(true)}
          icon={<FormOutlined style={{ color: "#52c41a" }} />}
          tooltip={{ title: "发布笔记", placement: "left" }}
        />
        <FloatButton
          onClick={toggleShowImg}
          icon={
            showImg ? (
              <EyeOutlined style={{ color: "#13c2c2" }} />
            ) : (
              <EyeInvisibleOutlined style={{ color: "#13c2c2" }} />
            )
          }
          tooltip={{
            title: showImg ? "隐藏图片" : "显示图片",
            placement: "left",
          }}
        />
        <FloatButton
          onClick={increase}
          icon={<PlusOutlined style={{ color: "#ff4d4f" }} />}
          tooltip={{ title: "加大字体", placement: "left" }}
        />
        <FloatButton
          onClick={decrease}
          icon={<MinusOutlined style={{ color: "#52c41a" }} />}
          tooltip={{ title: "减小字体", placement: "left" }}
        />
      </FloatButton.Group>
      {items.length === 0 ? (
        loaderFunc()
      ) : (
        <InfiniteScroll
          dataLength={items.length}
          next={() => loadMore()}
          hasMore={hasMore}
          loader={loaderFunc()}
          endMessage={
            <div style={{ padding: 8, textAlign: "center", color: "#999" }}>
              没有更多了
            </div>
          }
          scrollableTarget="xhsScrollableDiv"
          scrollThreshold={INFINITE_SCROLL_CONFIG.THRESHOLD}
        >
          <Masonry
            breakpointCols={MASONRY_BREAKPOINTS}
            className="xhs-masonry"
            columnClassName="xhs-masonry-column"
          >
            {items.map((raw: any, index: number) => (
              <div
                key={raw.id}
                className="xhs-waterfall-item"
                style={{ animationDelay: `${(index % 10) * 50}ms` }}
              >
                <XhsFeedCard
                  data={raw}
                  onClick={handleOpenDetail}
                  onUserClick={handleOpenUser}
                />
              </div>
            ))}
          </Masonry>
        </InfiniteScroll>
      )}
      <UserPostedDrawer
        open={userOpen}
        onClose={() => setUserOpen(false)}
        initParams={userParams as any}
      />
      <XhsSendDrawer
        open={sendDrawerOpen}
        onClose={() => setSendDrawerOpen(false)}
        onSend={handleSendNote}
        onUploadImage={handleUploadImage}
        loading={sendLoading}
      />
    </div>
  );
}
