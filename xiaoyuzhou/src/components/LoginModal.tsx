import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button, Modal, Input, Tabs, QRCode, Typography, Space, Alert } from "antd";
import {
  QrcodeOutlined,
  KeyOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import { useRequest } from "../hooks/useRequest";
import { useUserStore } from "../store/user";

const { Text } = Typography;

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

type TabKey = "qrcode" | "token";

const LoginModal: React.FC<LoginModalProps> = ({ open, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabKey>("qrcode");

  // 使用 ref 保存回调，彻底隔断父组件重绘带来的依赖抖动
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const { login } = useUserStore();
  const loginRef = useRef(login);
  loginRef.current = login;

  const { request, messageApi } = useRequest();
  const requestRef = useRef(request);
  requestRef.current = request;

  // 二维码登录状态
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [qrStatus, setQrStatus] = useState<"loading" | "active" | "scanned" | "expired">("loading");
  const isPollingRef = useRef(false);
  const pollTimerRef = useRef<any>(null);
  const isLoadingQrRef = useRef(false);

  // Token 登录状态
  const [tokenInput, setTokenInput] = useState("");
  const [isTokenSubmitting, setIsTokenSubmitting] = useState(false);

  // 清除轮询定时器
  const stopPolling = useCallback(() => {
    isPollingRef.current = false;
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  // 统一登录成功处理
  const onLoginSuccess = useCallback(
    (credential: any, userInfo: any) => {
      stopPolling();
      loginRef.current({
        nickname: userInfo?.nickname || "小宇宙用户",
        avatar: userInfo?.avatar,
        musicid: userInfo?.uid || "",
        musickey: credential?.accessToken || "",
      } as any);
      messageApi.success("小宇宙账号登录成功！");
      onCloseRef.current();
    },
    [messageApi, stopPolling]
  );

  // 串行轮询检查二维码状态（避免并发请求导致服务端二维码被消耗而报错）
  const startSerialPolling = useCallback(
    (qid: string) => {
      stopPolling();
      isPollingRef.current = true;

      const poll = async () => {
        if (!isPollingRef.current) return;

        try {
          const statusRes = await requestRef.current<any>(
            "XIAOYUZHOU_CHECK_QR_STATUS" as any,
            { id: qid }
          );

          if (!isPollingRef.current) return;

          if (statusRes?.code === 0 && statusRes?.data) {
            const status = statusRes.data.status;
            console.log("[xiaoyuzhou] Polled QR status:", status, statusRes.data);

            if (status === "CONFIRMED") {
              onLoginSuccess(statusRes.data.credential, statusRes.data.userInfo);
              return;
            } else if (status === "SCANNED") {
              setQrStatus("scanned");
            } else if (status === "EXPIRED") {
              stopPolling();
              setQrStatus("expired");
              return;
            }
          }
        } catch (err) {
          console.warn("[xiaoyuzhou] QR polling error:", err);
        }

        // 上一次请求完成后，等待 1.5 秒再执行下一次，完全杜绝并发冲突
        if (isPollingRef.current) {
          pollTimerRef.current = setTimeout(poll, 1500);
        }
      };

      // 启动首次查询
      pollTimerRef.current = setTimeout(poll, 1500);
    },
    [stopPolling, onLoginSuccess]
  );

  // 请求并生成登录二维码
  const fetchQrCode = useCallback(async () => {
    if (isLoadingQrRef.current) return;
    isLoadingQrRef.current = true;

    stopPolling();
    setQrStatus("loading");

    try {
      console.log("[xiaoyuzhou] Requesting new login QR code...");
      const res = await requestRef.current<any>("XIAOYUZHOU_GET_LOGIN_QR" as any, {});
      console.log("[xiaoyuzhou] QR code response:", res);

      if (res?.code === 0 && res?.data?.url && res?.data?.id) {
        setQrCodeUrl(res.data.url);
        setQrStatus("active");
        startSerialPolling(res.data.id);
      } else {
        setQrStatus("expired");
        messageApi.error(res?.message || "获取登录二维码失败，请点击刷新重试");
      }
    } catch (err) {
      console.error("[xiaoyuzhou] QR fetch error:", err);
      setQrStatus("expired");
      messageApi.error("请求二维码异常，请重试");
    } finally {
      isLoadingQrRef.current = false;
    }
  }, [messageApi, stopPolling, startSerialPolling]);

  // 弹窗打开或关闭时的副作用
  useEffect(() => {
    if (!open) {
      stopPolling();
      return;
    }

    if (activeTab === "qrcode") {
      fetchQrCode();
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [open, activeTab, fetchQrCode, stopPolling]);

  // Token 凭证登录
  const handleTokenLogin = async () => {
    if (!tokenInput.trim()) {
      messageApi.error("请输入凭证内容");
      return;
    }

    setIsTokenSubmitting(true);
    try {
      let accessToken = "";
      let refreshToken = "";

      try {
        const parsed = JSON.parse(tokenInput);
        accessToken = parsed.accessToken || parsed["x-jike-access-token"] || "";
        refreshToken = parsed.refreshToken || parsed["x-jike-refresh-token"] || "";
      } catch {
        const matchAccess = tokenInput.match(/(?:x-jike-access-token|accessToken)[:=]\s*([a-zA-Z0-9_\-\.]+)/i);
        const matchRefresh = tokenInput.match(/(?:x-jike-refresh-token|refreshToken)[:=]\s*([a-zA-Z0-9_\-\.]+)/i);

        if (matchAccess) accessToken = matchAccess[1];
        if (matchRefresh) refreshToken = matchRefresh[1];

        if (!accessToken && !refreshToken) {
          const lines = tokenInput.split(/[\r\n\s]+/).filter(Boolean);
          if (lines.length >= 2) {
            accessToken = lines[0];
            refreshToken = lines[1];
          } else if (lines.length === 1) {
            accessToken = lines[0];
            refreshToken = lines[0];
          }
        }
      }

      if (!accessToken || !refreshToken) {
        messageApi.error("未能识别出有效的 accessToken 与 refreshToken");
        setIsTokenSubmitting(false);
        return;
      }

      const result = await requestRef.current<any>("XIAOYUZHOU_SET_CREDENTIAL" as any, {
        credential: { accessToken, refreshToken },
      });

      if (result?.code === 0 && result?.data) {
        onLoginSuccess(result.data.credential, result.data.userInfo);
      } else {
        messageApi.error(result?.message || "凭证无效或已过期");
      }
    } catch {
      messageApi.error("登录失败，请检查凭证有效性");
    } finally {
      setIsTokenSubmitting(false);
    }
  };

  const copyQrLink = () => {
    if (qrCodeUrl) {
      navigator.clipboard.writeText(qrCodeUrl);
      messageApi.success("已复制登录链接到剪贴板");
    }
  };

  const tabItems = [
    {
      key: "qrcode",
      label: (
        <span>
          <QrcodeOutlined /> App 扫码登录
        </span>
      ),
      children: (
        <div style={{ textAlign: "center", padding: "16px 0" }}>
          {/* 白色纯净卡片，确保在任何 VSCode 深色/浅色主题下黑白二维码均高对比度呈现 */}
          <div
            style={{
              display: "inline-block",
              padding: 16,
              background: "#ffffff",
              borderRadius: 12,
              boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            }}
          >
            {qrStatus === "scanned" ? (
              <div
                style={{
                  width: 180,
                  height: 180,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#52c41a",
                }}
              >
                <CheckCircleOutlined style={{ fontSize: 52, marginBottom: 12 }} />
                <Text strong style={{ color: "#52c41a", fontSize: 15 }}>
                  已扫描，请在手机上确认
                </Text>
              </div>
            ) : (
              <QRCode
                type="svg"
                value={qrCodeUrl || "https://www.xiaoyuzhoufm.com"}
                size={180}
                color="#000000"
                bgColor="#ffffff"
                bordered={false}
                status={qrStatus === "expired" ? "expired" : qrStatus === "loading" ? "loading" : "active"}
                onRefresh={fetchQrCode}
              />
            )}
          </div>

          <div style={{ marginTop: 16 }}>
            <p style={{ margin: "4px 0", fontSize: 14, color: "var(--vscode-descriptionForeground)" }}>
              请打开手机 <strong>小宇宙 App</strong> 扫一扫
            </p>
            <Space style={{ marginTop: 8 }}>
              <Button
                type="link"
                size="small"
                icon={<ReloadOutlined />}
                onClick={fetchQrCode}
                loading={qrStatus === "loading"}
              >
                刷新二维码
              </Button>
              {qrCodeUrl && (
                <Button
                  type="link"
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={copyQrLink}
                >
                  复制扫码链接
                </Button>
              )}
            </Space>
          </div>
        </div>
      ),
    },
    {
      key: "token",
      label: (
        <span>
          <KeyOutlined /> Token 凭证登录
        </span>
      ),
      children: (
        <div style={{ padding: "12px 0" }}>
          <Input.TextArea
            rows={5}
            placeholder="粘贴小宇宙网页端 Cookie 或 accessToken / refreshToken&#10;支持格式：&#10;1. JSON: { &quot;accessToken&quot;: &quot;...&quot;, &quot;refreshToken&quot;: &quot;...&quot; }&#10;2. 两行文本：第一行 accessToken，第二行 refreshToken&#10;3. 包含 x-jike-access-token 和 x-jike-refresh-token 的字符串"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            style={{ marginBottom: 16 }}
          />
          <Button
            type="primary"
            size="large"
            block
            onClick={handleTokenLogin}
            loading={isTokenSubmitting}
            disabled={!tokenInput.trim()}
          >
            使用 Token 登录
          </Button>

          <Alert
            type="info"
            showIcon
            style={{ marginTop: 16 }}
            message="支持直接从小宇宙网页端控制台或请求中复制 Cookie 填入登录"
          />
        </div>
      ),
    },
  ];

  return (
    <Modal
      title="登录小宇宙"
      open={open}
      onCancel={() => {
        stopPolling();
        onCloseRef.current();
      }}
      footer={null}
      width={400}
      centered
      destroyOnClose
    >
      <Tabs
        activeKey={activeTab}
        onChange={(k) => setActiveTab(k as TabKey)}
        items={tabItems}
        centered
      />

      <div
        style={{
          marginTop: 12,
          padding: "8px 12px",
          background: "rgba(0,0,0,0.02)",
          borderRadius: 6,
          fontSize: 12,
          color: "var(--vscode-descriptionForeground)",
          textAlign: "center",
        }}
      >
        <span>💡 手机小宇宙 App 扫码即可一键秒登，自动同步全部订阅与播放记录。</span>
      </div>
    </Modal>
  );
};

export default LoginModal;
