/**
 * QQ音乐登录组件
 */
import React, { useState, useEffect, useCallback } from "react";
import { Modal, Tabs, Button, Spin, message } from "antd";
import { QqOutlined, WechatOutlined } from "@ant-design/icons";
import { useRequest } from "../hooks/useRequest";
import { useUserStore } from "../store/user";
import { LoginStatus } from "../types/qqmusic";
import type { QRCodeInfo, UserInfo } from "../types/qqmusic";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ open, onClose }) => {
  const [activeTab, setActiveTab] = useState<"qq" | "wx">("qq");
  const [qrCode, setQrCode] = useState<string>("");
  const [qrIdentifier, setQrIdentifier] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [loginStatus, setLoginStatus] = useState<LoginStatus>(LoginStatus.PENDING);
  
  const { request } = useRequest();
  const { login, setLoginStatus: setStoreLoginStatus } = useUserStore();

  // 获取登录二维码
  const fetchQRCode = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await request("QQMUSIC_GET_LOGIN_QR", { type: activeTab });
      console.log("[Login] QR Code result:", result);
      
      if (result.code === 0 && result.data) {
        const qrData: QRCodeInfo = result.data;
        setQrCode(qrData.data);
        setQrIdentifier(qrData.identifier);
        setLoginStatus(LoginStatus.PENDING);
        setStoreLoginStatus(LoginStatus.PENDING);
      } else {
        message.error(result.message || "获取二维码失败");
      }
    } catch (error) {
      console.error("[Login] 获取二维码失败:", error);
      message.error("获取二维码失败");
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, request, setStoreLoginStatus]);

  // 检查登录状态
  const checkLoginStatus = useCallback(async () => {
    if (!qrIdentifier) return;

    try {
      console.log("[Login] Checking status...", { type: activeTab, identifier: qrIdentifier.substring(0, 10) + "..." });
      const result = await request("QQMUSIC_CHECK_LOGIN_STATUS", {
        identifier: qrIdentifier,
        type: activeTab,
      });
      
      console.log("[Login] Status check result:", result);
      
      if (result.code === 0 && result.data) {
        const { status, userInfo } = result.data;
        console.log("[Login] Status:", status, "UserInfo:", userInfo);
        
        switch (status) {
          case "success":
            setLoginStatus(LoginStatus.SUCCESS);
            setStoreLoginStatus(LoginStatus.SUCCESS);
            if (userInfo) {
              console.log("[Login] Logging in with userInfo:", userInfo);
              login(userInfo as UserInfo);
              message.success("登录成功！");
              onClose();
            } else {
              console.error("[Login] Success but no userInfo!");
              message.error("登录成功但无法获取用户信息");
            }
            break;
          case "scanning":
            setLoginStatus(LoginStatus.SCANNING);
            setStoreLoginStatus(LoginStatus.SCANNING);
            break;
          case "confirming":
            setLoginStatus(LoginStatus.CONFIRMING);
            setStoreLoginStatus(LoginStatus.CONFIRMING);
            break;
          case "timeout":
            setLoginStatus(LoginStatus.TIMEOUT);
            setStoreLoginStatus(LoginStatus.TIMEOUT);
            message.error("二维码已过期，请重新获取");
            break;
          case "failed":
            setLoginStatus(LoginStatus.FAILED);
            setStoreLoginStatus(LoginStatus.FAILED);
            message.error(result.data.message || "登录失败");
            break;
          default:
            break;
        }
      } else if (result.code !== 0) {
        console.error("[Login] Status check failed:", result.message);
      }
    } catch (error) {
      console.error("[Login] 检查登录状态失败:", error);
    }
  }, [qrIdentifier, activeTab, request, login, onClose, setStoreLoginStatus]);

  // 打开时获取二维码
  useEffect(() => {
    if (open) {
      fetchQRCode();
    }
  }, [open, fetchQRCode]);

  // 轮询登录状态
  useEffect(() => {
    if (!open || !qrIdentifier || loginStatus === LoginStatus.SUCCESS) return;

    console.log("[Login] Starting status polling...");
    const interval = setInterval(() => {
      checkLoginStatus();
    }, 2000);

    return () => {
      console.log("[Login] Stopping status polling");
      clearInterval(interval);
    };
  }, [open, qrIdentifier, loginStatus, checkLoginStatus]);

  // 获取状态提示文字
  const getStatusText = () => {
    switch (loginStatus) {
      case LoginStatus.PENDING:
        return activeTab === "qq" 
          ? "请使用 QQ 扫码登录"
          : "请使用微信扫码登录";
      case LoginStatus.SCANNING:
        return activeTab === "qq"
          ? "已扫码，请在 QQ 中确认登录"
          : "已扫码，请在微信中确认";
      case LoginStatus.CONFIRMING:
        return "正在确认...";
      case LoginStatus.TIMEOUT:
        return "二维码已过期";
      case LoginStatus.FAILED:
        return "登录失败";
      case LoginStatus.SUCCESS:
        return "登录成功！";
      default:
        return "";
    }
  };

  const tabItems = [
    {
      key: "qq",
      label: (
        <span>
          <QqOutlined /> QQ登录
        </span>
      ),
    },
    {
      key: "wx",
      label: (
        <span>
          <WechatOutlined /> 微信登录
        </span>
      ),
    },
  ];

  return (
    <Modal
      title="登录QQ音乐"
      open={open}
      onCancel={onClose}
      footer={null}
      width={400}
      centered
    >
      <Tabs
        activeKey={activeTab}
        items={tabItems}
        onChange={(key) => {
          setActiveTab(key as "qq" | "wx");
          fetchQRCode();
        }}
        centered
      />

      <div className="login-qr-container">
        {isLoading ? (
          <div className="login-loading">
            <Spin size="large" />
            <p>正在获取二维码...</p>
          </div>
        ) : (
          <>
            {qrCode ? (
              <div className="login-qr-wrapper">
                <img
                  src={qrCode}
                  alt="登录二维码"
                  className="login-qr-image"
                />
                <p className="login-status-text">{getStatusText()}</p>
                {(loginStatus === LoginStatus.TIMEOUT ||
                  loginStatus === LoginStatus.FAILED) && (
                  <Button type="primary" onClick={fetchQRCode}>
                    重新获取二维码
                  </Button>
                )}
              </div>
            ) : (
              <div className="login-error">
                <p>获取二维码失败</p>
                <Button type="primary" onClick={fetchQRCode}>
                  重试
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <div className="login-tips">
        <p>登录说明：</p>
        <ul>
          <li>QQ 登录：请确保手机已安装 QQ 客户端</li>
          <li>微信登录：直接使用微信扫码即可</li>
          <li>扫码后需要在手机上确认授权</li>
          <li>二维码有效期为 5 分钟</li>
        </ul>
      </div>
    </Modal>
  );
};

export default LoginModal;
