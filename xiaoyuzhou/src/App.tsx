import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Button,
  Card,
  Drawer,
  Empty,
  Flex,
  Input,
  List,
  Modal,
  Segmented,
  Space,
  Spin,
  Tabs,
  Typography,
} from "antd";
import {
  CustomerServiceOutlined,
  FireOutlined,
  LoginOutlined,
  LogoutOutlined,
  MinusOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  StarOutlined,
} from "@ant-design/icons";
import { useRequest } from "./hooks/useRequest";
import { useFontSizeStore } from "./store/fontSize";
import type {
  ApiResponse,
  XiaoyuzhouEpisode,
  XiaoyuzhouPodcast,
  XiaoyuzhouUserInfo,
} from "./types/xiaoyuzhou";

const { Title, Paragraph, Text } = Typography;

type AuthPayload = {
  isLoggedIn: boolean;
  userInfo: XiaoyuzhouUserInfo | null;
};

function getImageUrl(entity: any) {
  return (
    entity?.image?.smallPicUrl ||
    entity?.image?.middlePicUrl ||
    entity?.image?.picUrl ||
    entity?.avatar
  );
}

function getPlayableUrl(episode: any) {
  return (
    episode?.enclosure?.url ||
    episode?.media?.source?.url ||
    episode?.media?.backupSource?.url ||
    ""
  );
}

function extractDiscoverySections(raw: any): Array<{ title: string; items: any[] }> {
  const blocks = Array.isArray(raw?.data) ? raw.data : [];

  return blocks
    .flatMap((block: any) => (Array.isArray(block?.data) ? block.data : []))
    .map((section: any) => ({
      title:
        section?.title ||
        section?.header?.title ||
        section?.rightContent?.text ||
        section?.moduleType ||
        "推荐",
      items: Array.isArray(section?.target)
        ? section.target.map((entry: any) => entry?.podcast || entry?.episode || entry)
        : section?.url
          ? [
              {
                title: section?.rightContent?.text || "推荐入口",
                description: section?.url,
                image: section?.leftImage?.images?.[0],
              },
            ]
          : [],
    }))
    .filter((section: { title: string; items: any[] }) => section.items.length > 0);
}

function App() {
  const { request, messageApi } = useRequest();
  const { fontSize, increase, decrease } = useFontSizeStore();

  const [auth, setAuth] = useState<AuthPayload>({
    isLoggedIn: false,
    userInfo: null,
  });
  const [loginOpen, setLoginOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [sendingCode, setSendingCode] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [discoverySections, setDiscoverySections] = useState<
    Array<{ title: string; items: any[] }>
  >([]);
  const [topCategory, setTopCategory] = useState<"HOT" | "ROCK" | "NEW">("HOT");
  const [topList, setTopList] = useState<any | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<XiaoyuzhouPodcast[]>([]);
  const [podcastOpen, setPodcastOpen] = useState(false);
  const [podcastDetail, setPodcastDetail] = useState<XiaoyuzhouPodcast | null>(null);
  const [podcastEpisodes, setPodcastEpisodes] = useState<XiaoyuzhouEpisode[]>([]);
  const [podcastLoading, setPodcastLoading] = useState(false);
  const [episodeOpen, setEpisodeOpen] = useState(false);
  const [episodeDetail, setEpisodeDetail] = useState<XiaoyuzhouEpisode | null>(null);
  const [audioUrl, setAudioUrl] = useState("");

  const syncAuth = useCallback(async () => {
    const result = await request<ApiResponse<AuthPayload>>(
      "XIAOYUZHOU_GET_USER_INFO",
      null,
    );

    if (result.code === 0 && result.data) {
      setAuth(result.data);
    }
  }, [request]);

  const loadDiscovery = useCallback(async () => {
    const result = await request<ApiResponse<any>>(
      "XIAOYUZHOU_GET_DISCOVERY_FEED",
      {},
    );
    if (result.code === 0 && result.data) {
      setDiscoverySections(extractDiscoverySections(result.data));
      return;
    }
    messageApi.error(result.message || "加载推荐失败");
  }, [messageApi, request]);

  const loadTopList = useCallback(
    async (category: "HOT" | "ROCK" | "NEW") => {
      const result = await request<ApiResponse<any>>("XIAOYUZHOU_GET_TOP_LIST", {
        category,
      });
      if (result.code === 0 && result.data) {
        setTopList(result.data?.data || null);
        return;
      }
      messageApi.error(result.message || "加载榜单失败");
    },
    [messageApi, request],
  );

  const openPodcast = useCallback(
    async (pid: string) => {
      setPodcastLoading(true);
      setPodcastOpen(true);
      try {
        const [detailResult, listResult] = await Promise.all([
          request<ApiResponse<any>>("XIAOYUZHOU_GET_PODCAST_DETAIL", { pid }),
          request<ApiResponse<any>>("XIAOYUZHOU_GET_EPISODE_LIST", { pid, order: "desc" }),
        ]);

        if (detailResult.code === 0) {
          setPodcastDetail(detailResult.data?.data || null);
        }
        if (listResult.code === 0) {
          setPodcastEpisodes(listResult.data?.data || []);
        }
      } finally {
        setPodcastLoading(false);
      }
    },
    [request],
  );

  const openEpisode = useCallback(
    async (eid: string) => {
      const result = await request<ApiResponse<any>>("XIAOYUZHOU_GET_EPISODE_DETAIL", {
        eid,
      });

      if (result.code !== 0 || !result.data?.data) {
        messageApi.error(result.message || "加载单集详情失败");
        return;
      }

      const detail = result.data.data as XiaoyuzhouEpisode;
      setEpisodeDetail(detail);
      setAudioUrl(getPlayableUrl(detail));
      setEpisodeOpen(true);
    },
    [messageApi, request],
  );

  const handleSendCode = useCallback(async () => {
    setSendingCode(true);
    try {
      const result = await request<ApiResponse<boolean>>("XIAOYUZHOU_SEND_CODE", {
        areaCode: "+86",
        phoneNumber,
      });
      if (result.code === 0) {
        messageApi.success("验证码已发送");
        return;
      }
      messageApi.error(result.message || "验证码发送失败");
    } finally {
      setSendingCode(false);
    }
  }, [messageApi, phoneNumber, request]);

  const handleLogin = useCallback(async () => {
    setLoggingIn(true);
    try {
      const result = await request<ApiResponse<any>>("XIAOYUZHOU_LOGIN_WITH_SMS", {
        areaCode: "+86",
        phoneNumber,
        verifyCode,
      });

      if (result.code === 0 && result.data?.userInfo) {
        setAuth({ isLoggedIn: true, userInfo: result.data.userInfo });
        setLoginOpen(false);
        setVerifyCode("");
        messageApi.success("小宇宙登录成功");
        await Promise.all([loadDiscovery(), loadTopList(topCategory)]);
        return;
      }

      messageApi.error(result.message || "登录失败");
    } finally {
      setLoggingIn(false);
    }
  }, [loadDiscovery, loadTopList, messageApi, phoneNumber, request, topCategory, verifyCode]);

  const handleLogout = useCallback(async () => {
    await request("XIAOYUZHOU_LOGOUT", null);
    setAuth({ isLoggedIn: false, userInfo: null });
    setDiscoverySections([]);
    setTopList(null);
    setSearchResults([]);
    messageApi.success("已退出小宇宙登录");
  }, [messageApi, request]);

  const handleSearch = useCallback(async () => {
    if (!searchKeyword.trim()) return;
    setSearching(true);
    try {
      const result = await request<ApiResponse<any>>("XIAOYUZHOU_SEARCH_PODCASTS", {
        keyword: searchKeyword.trim(),
      });
      if (result.code === 0) {
        setSearchResults(result.data?.data || []);
        return;
      }
      messageApi.error(result.message || "搜索失败");
    } finally {
      setSearching(false);
    }
  }, [messageApi, request, searchKeyword]);

  useEffect(() => {
    void syncAuth();

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.command !== "XIAOYUZHOU_AUTH_SYNC") return;
      setAuth(event.data.payload as AuthPayload);
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [syncAuth]);

  useEffect(() => {
    if (auth.isLoggedIn) {
      void loadDiscovery();
      void loadTopList(topCategory);
    }
  }, [auth.isLoggedIn, loadDiscovery, loadTopList, topCategory]);

  const topItems = useMemo(() => topList?.items || [], [topList]);

  const tabs = [
    {
      key: "discovery",
      label: "推荐",
      icon: <StarOutlined />,
      children: auth.isLoggedIn ? (
        <div className="xy-section-stack">
          {discoverySections.length === 0 ? (
            <Empty description="暂无推荐内容" />
          ) : (
            discoverySections.map((section: { title: string; items: any[] }) => (
              <Card key={section.title} title={section.title} className="xy-card">
                <List
                  dataSource={section.items}
                  renderItem={(item: any) => (
                    <List.Item
                      className="xy-list-item"
                      actions={
                        item?.pid
                          ? [<Button key="open" type="link" onClick={() => void openPodcast(item.pid)}>查看节目</Button>]
                          : undefined
                      }
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar shape="square" size={52} src={getImageUrl(item)} />
                        }
                        title={item?.title || item?.name || "推荐内容"}
                        description={item?.description || item?.brief || item?.author}
                      />
                    </List.Item>
                  )}
                />
              </Card>
            ))
          )}
        </div>
      ) : (
        <Empty description="登录后查看小宇宙推荐与精选" />
      ),
    },
    {
      key: "top",
      label: "榜单",
      icon: <FireOutlined />,
      children: auth.isLoggedIn ? (
        <div className="xy-section-stack">
          <Flex justify="space-between" align="center" wrap gap={12}>
            <Segmented
              value={topCategory}
              options={[
                { label: "最热榜", value: "HOT" },
                { label: "飙升榜", value: "ROCK" },
                { label: "新星榜", value: "NEW" },
              ]}
              onChange={(value) => {
                const category = value as "HOT" | "ROCK" | "NEW";
                setTopCategory(category);
                void loadTopList(category);
              }}
            />
            <Button icon={<ReloadOutlined />} onClick={() => void loadTopList(topCategory)}>
              刷新榜单
            </Button>
          </Flex>

          <Card
            title={topList?.title || "榜单"}
            extra={topList?.publishDate ? <Text type="secondary">{topList.publishDate}</Text> : null}
            className="xy-card"
          >
            <Paragraph type="secondary">{topList?.information}</Paragraph>
            <List
              dataSource={topItems}
              renderItem={(entry: any, index) => {
                const item = entry?.item || {};
                return (
                  <List.Item
                    className="xy-list-item"
                    actions={[
                      <Button key="podcast" type="link" onClick={() => void openPodcast(item.pid)}>
                        节目
                      </Button>,
                      <Button key="episode" type="link" onClick={() => void openEpisode(item.eid)}>
                        播放
                      </Button>,
                    ]}
                  >
                    <div className="xy-rank">{index + 1}</div>
                    <List.Item.Meta
                      avatar={<Avatar shape="square" size={52} src={getImageUrl(item)} />}
                      title={item.title}
                      description={item.podcast?.title || item.description}
                    />
                  </List.Item>
                );
              }}
            />
          </Card>
        </div>
      ) : (
        <Empty description="登录后查看小宇宙榜单" />
      ),
    },
    {
      key: "search",
      label: "搜索",
      icon: <SearchOutlined />,
      children: auth.isLoggedIn ? (
        <div className="xy-section-stack">
          <Flex gap={12}>
            <Input
              value={searchKeyword}
              placeholder="搜索播客节目，比如：科技、商业、喜剧"
              onChange={(event) => setSearchKeyword(event.target.value)}
              onPressEnter={() => void handleSearch()}
            />
            <Button
              type="primary"
              loading={searching}
              icon={<SearchOutlined />}
              onClick={() => void handleSearch()}
            >
              搜索
            </Button>
          </Flex>
          <Card className="xy-card">
            <List
              locale={{ emptyText: "输入关键词开始搜索" }}
              dataSource={searchResults}
              renderItem={(item) => (
                <List.Item
                  className="xy-list-item"
                  actions={[
                    <Button key="open" type="link" onClick={() => void openPodcast(item.pid)}>
                      查看节目
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar shape="square" size={52} src={getImageUrl(item)} />}
                    title={item.title}
                    description={item.description || item.brief || item.author}
                  />
                </List.Item>
              )}
            />
          </Card>
        </div>
      ) : (
        <Empty description="登录后搜索小宇宙播客" />
      ),
    },
  ];

  return (
    <div className="xy-app" style={{ fontSize: `${fontSize}px` }}>
      <header className="xy-header">
        <div>
          <Title level={3} className="xy-title">
            小宇宙
          </Title>
          <Text type="secondary">
            首版已接通短信登录、推荐、榜单、搜索、播客详情和单集播放。
          </Text>
        </div>
        <Space wrap>
          <Button icon={<MinusOutlined />} onClick={decrease} />
          <Button icon={<PlusOutlined />} onClick={increase} />
          {auth.isLoggedIn ? (
            <>
              <Avatar src={auth.userInfo?.avatar} icon={<CustomerServiceOutlined />} />
              <Text>{auth.userInfo?.nickname || "已登录"}</Text>
              <Button icon={<LogoutOutlined />} onClick={() => void handleLogout()}>
                退出
              </Button>
            </>
          ) : (
            <Button type="primary" icon={<LoginOutlined />} onClick={() => setLoginOpen(true)}>
              短信登录
            </Button>
          )}
        </Space>
      </header>

      <Tabs items={tabs} />

      <Drawer
        open={podcastOpen}
        title={podcastDetail?.title || "播客详情"}
        width={520}
        onClose={() => setPodcastOpen(false)}
      >
        <Spin spinning={podcastLoading}>
          {podcastDetail ? (
            <div className="xy-section-stack">
              <Flex gap={12}>
                <Avatar shape="square" size={88} src={getImageUrl(podcastDetail)} />
                <div>
                  <Title level={4}>{podcastDetail.title}</Title>
                  <Text type="secondary">{podcastDetail.author}</Text>
                  <Paragraph type="secondary">
                    订阅 {podcastDetail.subscriptionCount || 0} · 单集 {podcastDetail.episodeCount || 0}
                  </Paragraph>
                </div>
              </Flex>
              <Paragraph>{podcastDetail.description || podcastDetail.brief}</Paragraph>
              <Card title="最新单集" className="xy-card">
                <List
                  dataSource={podcastEpisodes}
                  renderItem={(episode) => (
                    <List.Item
                      className="xy-list-item"
                      actions={[
                        <Button key="play" type="link" onClick={() => void openEpisode(episode.eid)}>
                          查看 / 播放
                        </Button>,
                      ]}
                    >
                      <List.Item.Meta
                        title={episode.title}
                        description={episode.description}
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </div>
          ) : (
            <Empty description="暂无播客详情" />
          )}
        </Spin>
      </Drawer>

      <Drawer
        open={episodeOpen}
        title={episodeDetail?.title || "单集详情"}
        width={560}
        onClose={() => setEpisodeOpen(false)}
      >
        {episodeDetail ? (
          <div className="xy-section-stack">
            <Paragraph>{episodeDetail.description}</Paragraph>
            {audioUrl ? (
              <audio className="xy-audio" controls src={audioUrl} />
            ) : (
              <Empty description="当前单集没有可播放音频地址" />
            )}
            <Card title="Shownotes" className="xy-card">
              <div
                className="xy-html"
                dangerouslySetInnerHTML={{ __html: episodeDetail.shownotes || "<p>暂无 shownotes</p>" }}
              />
            </Card>
          </div>
        ) : (
          <Empty description="暂无单集详情" />
        )}
      </Drawer>

      <Modal
        open={loginOpen}
        title="小宇宙短信登录"
        onCancel={() => setLoginOpen(false)}
        onOk={() => void handleLogin()}
        confirmLoading={loggingIn}
        okText="登录"
      >
        <div className="xy-section-stack">
          <Input
            value={phoneNumber}
            placeholder="手机号"
            onChange={(event) => setPhoneNumber(event.target.value)}
          />
          <Flex gap={12}>
            <Input
              value={verifyCode}
              placeholder="短信验证码"
              onChange={(event) => setVerifyCode(event.target.value)}
            />
            <Button loading={sendingCode} onClick={() => void handleSendCode()}>
              发送验证码
            </Button>
          </Flex>
        </div>
      </Modal>
    </div>
  );
}

export default App;
