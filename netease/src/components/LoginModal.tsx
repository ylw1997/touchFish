/**
 * 网易云音乐登录凭证与扫码登录设置组件
 */
import React, { useState, useEffect, useCallback } from "react";
import { Button, Modal, Input, message, Alert, Space, Segmented, Spin, QRCode } from "antd";
import { KeyOutlined, SettingOutlined, InfoCircleOutlined, QrcodeOutlined } from "@ant-design/icons";
import { useRequest } from "../hooks/useRequest";
import { useUserStore } from "../store/user";
import { LoginStatus } from "../types/qqmusic";
import type { UserInfo } from "../types/qqmusic";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ open, onClose }) => {
  const [activeTab, setActiveTab] = useState<"qr" | "cookie">("qr");

  // 扫码相关的 state
  const [qrCode, setQrCode] = useState("");
  const [qrIdentifier, setQrIdentifier] = useState("");
  const [isLoadingQr, setIsLoadingQr] = useState(false);
  const [qrStatus, setQrStatus] = useState<LoginStatus>(LoginStatus.PENDING);

  // 手动 cookie 相关的 state
  const [cookieInput, setCookieInput] = useState("");
  const [isSavingCookie, setIsSavingCookie] = useState(false);

  const { request } = useRequest();
  const { login } = useUserStore();

  // 获取网易云扫码二维码
  const fetchQRCode = useCallback(async () => {
    setIsLoadingQr(true);
    setQrCode("");
    setQrIdentifier("");
    setQrStatus(LoginStatus.PENDING);

    try {
      const result = await request<any>("NETEASE_GET_QR_CODE" as any, null);
      if (result.code === 0 && result.data) {
        setQrCode(result.data.data);
        setQrIdentifier(result.data.identifier);
      } else {
        message.error(result.message || "获取网易云二维码失败，请使用 Cookie 登录");
        setActiveTab("cookie"); // 降级为 Cookie 登录
      }
    } catch (error) {
      console.error("[Login] 获取二维码失败:", error);
      message.error("获取网易云二维码失败，已切换至 Cookie 模式");
      setActiveTab("cookie");
    } finally {
      setIsLoadingQr(false);
    }
  }, [request]);

  // 轮询网易云扫码登录状态
  const checkLoginStatus = useCallback(async () => {
    if (!qrIdentifier) return;

    try {
      const result = await request<any>("NETEASE_CHECK_QR_STATUS" as any, {
        identifier: qrIdentifier,
      });

      if (result.code === 0 && result.data) {
        const { status, userInfo } = result.data;

        switch (status) {
          case "success":
            setQrStatus(LoginStatus.SUCCESS);
            if (userInfo?.musicid) {
              login(userInfo as UserInfo);
              message.success("网易云音乐登录成功！");
              onClose();
            } else {
              message.error("登录成功，但未拿到有效凭证，请重试");
            }
            break;
          case "scanning":
            setQrStatus(LoginStatus.SCANNING);
            break;
          case "confirming":
            setQrStatus(LoginStatus.CONFIRMING);
            break;
          case "timeout":
            setQrStatus(LoginStatus.TIMEOUT);
            message.error("二维码已过期，请点击重试刷新");
            break;
          case "failed":
            setQrStatus(LoginStatus.FAILED);
            message.error("扫码登录失败");
            break;
          default:
            break;
        }
      }
    } catch (error) {
      console.error("[Login] 检查登录状态失败:", error);
    }
  }, [qrIdentifier, request, login, onClose]);

  // 自动获取二维码
  useEffect(() => {
    if (open && activeTab === "qr") {
      void fetchQRCode();
    }
  }, [open, activeTab, fetchQRCode]);

  // 自动轮询状态
  useEffect(() => {
    if (
      !open ||
      activeTab !== "qr" ||
      !qrIdentifier ||
      qrStatus === LoginStatus.SUCCESS ||
      qrStatus === LoginStatus.TIMEOUT
    ) {
      return;
    }

    const interval = setInterval(() => {
      void checkLoginStatus();
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [open, activeTab, qrIdentifier, qrStatus, checkLoginStatus]);

  // 手动保存 Cookie
  const handleSaveCookie = async () => {
    const trimmedCookie = cookieInput.trim();
    if (!trimmedCookie) {
      message.warning("请输入有效的 Cookie 凭证");
      return;
    }

    setIsSavingCookie(true);
    try {
      const result = await request<any>("NETEASE_SET_CREDENTIAL" as any, {
        cookie: trimmedCookie,
      });

      if (result.code === 0) {
        message.success("网易云音乐 Cookie 设置成功！数据已同步。");
        setCookieInput("");
        onClose();
      } else {
        message.error(result.message || "设置失败，请重试");
      }
    } catch (error: any) {
      console.error("[Login] 设置 Cookie 失败:", error);
      message.error(error.message || "连接服务失败，请重试");
    } finally {
      setIsSavingCookie(false);
    }
  };

  // 触发 VS Code 原生输入框
  const handleTriggerVscode = async () => {
    try {
      await request<any>("NETEASE_TRIGGER_VSCODE_INPUT" as any, null);
      onClose();
    } catch (error) {
      console.error("[Login] 触发 VS Code 输入失败:", error);
    }
  };

  // 获取状态说明文字
  const getStatusText = () => {
    switch (qrStatus) {
      case LoginStatus.PENDING:
        return "请使用网易云音乐手机 App 扫码登录";
      case LoginStatus.SCANNING:
        return "已扫码，请在手机上确认登录授权";
      case LoginStatus.CONFIRMING:
        return "正在确认登录状态...";
      case LoginStatus.TIMEOUT:
        return "二维码已过期，请重新获取";
      case LoginStatus.FAILED:
        return "登录失败，请尝试重新扫码";
      case LoginStatus.SUCCESS:
        return "登录成功！正在跳转...";
      default:
        return "";
    }
  };

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "16px", fontWeight: 600 }}>
          <KeyOutlined style={{ color: "#ec4141", fontSize: "18px" }} />
          网易云音乐登录
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={460}
      centered
      styles={{ body: { padding: "12px 0 0 0" } }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        
        {/* 高级极简 Segmented 选择器 */}
        <Segmented
          value={activeTab}
          onChange={(val) => {
            setActiveTab(val as any);
            setCookieInput("");
          }}
          options={[
            {
              label: (
                <div style={{ padding: "4px 12px", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <QrcodeOutlined />
                  扫码登录
                </div>
              ),
              value: "qr",
            },
            {
              label: (
                <div style={{ padding: "4px 12px", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <SettingOutlined />
                  手动 Cookie 凭证
                </div>
              ),
              value: "cookie",
            },
          ]}
          block
          style={{
            borderRadius: "10px",
            padding: "4px",
            backgroundColor: "var(--bg-secondary-color, rgba(0,0,0,0.03))",
          }}
        />

        {activeTab === "qr" ? (
          /* ==================== 扫码登录面板 ==================== */
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px", padding: "10px 0" }}>
            <div
              style={{
                width: "200px",
                height: "200px",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "14px",
                border: "1px solid var(--border-color, rgba(0,0,0,0.08))",
                boxShadow: "0 6px 18px rgba(0, 0, 0, 0.04)",
                backgroundColor: "#fff",
                padding: "8px",
              }}
            >
              {isLoadingQr ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <Spin size="default" />
                  <span style={{ fontSize: "12px", color: "#888" }}>正在生成安全二维码...</span>
                </div>
              ) : qrCode ? (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                  <QRCode
                    value={qrCode}
                    size={184}
                    bordered={false}
                    color="#000000"
                    bgColor="#ffffff"
                    status={
                      qrStatus === LoginStatus.TIMEOUT
                        ? "expired"
                        : "active"
                    }
                    onRefresh={fetchQRCode}
                  />
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: "12px", color: "#ec4141" }}>生成二维码失败</span>
                  <Button size="small" type="primary" onClick={fetchQRCode} style={{ backgroundColor: "#ec4141", border: "none" }}>
                    重试
                  </Button>
                </div>
              )}
            </div>

            <div style={{ textAlign: "center", margin: "4px 0" }}>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: qrStatus === LoginStatus.SCANNING ? "#ec4141" : "var(--text-title-color, #111)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                {qrStatus === LoginStatus.SCANNING && <Spin size="small" style={{ color: "#ec4141" }} />}
                {getStatusText()}
              </div>
              <div style={{ fontSize: "11px", color: "#888", marginTop: "4px" }}>
                提示：请确保手机与电脑在相同网络环境下能更好读取
              </div>
            </div>
          </div>
        ) : (
          /* ==================== 手动 Cookie 面板 ==================== */
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <Alert
              message="Cookie 凭证能做什么？"
              description="如果您扫码登录失败，或想直接使用浏览器已有的登录凭据，您可以手动粘贴 Cookie 凭据。该方式稳定且直接同步您的网易云收藏、喜欢列表和无损音质。"
              type="info"
              showIcon
              icon={<InfoCircleOutlined style={{ color: "#ec4141" }} />}
              style={{
                backgroundColor: "rgba(236, 65, 65, 0.04)",
                border: "1px solid rgba(236, 65, 65, 0.15)",
                borderRadius: "10px",
              }}
            />

            <div
              className="cookie-tutorial"
              style={{
                fontSize: "12px",
                lineHeight: "1.6",
                color: "var(--text-color, #555)",
                backgroundColor: "var(--bg-secondary-color, rgba(0,0,0,0.02))",
                padding: "12px",
                borderRadius: "10px",
                border: "1px solid var(--border-color, rgba(0,0,0,0.06))",
              }}
            >
              <div style={{ fontWeight: "bold", marginBottom: "6px", fontSize: "13px", color: "var(--text-title-color, #111)" }}>
                💡 极简获取 Cookie 步骤：
              </div>
              <ol style={{ paddingLeft: "18px", margin: 0, display: "flex", flexDirection: "column", gap: "5px" }}>
                <li>
                  在浏览器中打开{" "}
                  <a href="https://music.163.com" target="_blank" rel="noopener noreferrer" style={{ color: "#ec4141", fontWeight: 600 }}>
                    网易云音乐官网
                  </a>{" "}
                  并登录。
                </li>
                <li>
                  按下 <kbd style={{ padding: "1px 4px", background: "rgba(0,0,0,0.06)", borderRadius: "4px" }}>F12</kbd> (Mac 是{" "}
                  <kbd style={{ padding: "1px 4px", background: "rgba(0,0,0,0.06)", borderRadius: "4px" }}>Cmd+Opt+I</kbd>)。
                </li>
                <li>
                  在 <b>Console</b> 选项卡中，输入 <code>document.cookie</code> 回车并复制整段字符串。
                </li>
              </ol>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ fontWeight: 600, fontSize: "13px" }}>粘贴您的 Cookie：</div>
              <Input.TextArea
                rows={3}
                value={cookieInput}
                onChange={(e) => setCookieInput(e.target.value)}
                placeholder="请粘贴您的网易云 Cookie... (应包含 MUSIC_U、__csrf 等字段)"
                style={{
                  borderRadius: "8px",
                  border: "1px solid var(--border-color, rgba(0,0,0,0.15))",
                  padding: "8px",
                  fontSize: "12px",
                  fontFamily: "monospace",
                  resize: "none",
                }}
              />
            </div>

            <Space direction="vertical" size="small" style={{ width: "100%" }}>
              <Button
                type="primary"
                block
                loading={isSavingCookie}
                onClick={handleSaveCookie}
                style={{
                  height: "38px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 600,
                  backgroundColor: "#ec4141",
                  border: "none",
                  boxShadow: "0 4px 10px rgba(236, 65, 65, 0.25)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as any).style.backgroundColor = "#d33a3a";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as any).style.backgroundColor = "#ec4141";
                }}
              >
                保存凭证并同步
              </Button>

              <Button
                block
                icon={<SettingOutlined />}
                onClick={handleTriggerVscode}
                style={{
                  height: "34px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  borderColor: "rgba(0, 0, 0, 0.12)",
                  color: "var(--text-color, #333)",
                }}
              >
                使用 VS Code 顶部原生对话框设置 (推荐)
              </Button>
            </Space>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default LoginModal;
