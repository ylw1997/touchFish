/**
 * QQ音乐登录组件
 */
import React, { useCallback, useEffect, useState } from "react";
import { Button, Modal, Spin, message } from "antd";
import { WechatOutlined } from "@ant-design/icons";
import { useRequest } from "../hooks/useRequest";
import { useUserStore } from "../store/user";
import { LoginStatus } from "../types/qqmusic";
import type { QRCodeInfo, UserInfo } from "../types/qqmusic";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ open, onClose }) => {
  const [qrCode, setQrCode] = useState("");
  const [qrIdentifier, setQrIdentifier] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loginStatus, setLoginStatus] = useState<LoginStatus>(LoginStatus.PENDING);

  const { request } = useRequest();
  const { login, setLoginStatus: setStoreLoginStatus } = useUserStore();

  const fetchQRCode = useCallback(async () => {
    setIsLoading(true);
    setQrCode("");
    setQrIdentifier("");

    try {
      const result = await request<any>("QQMUSIC_GET_LOGIN_QR", { type: "wx" });

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
  }, [request, setStoreLoginStatus]);

  const checkLoginStatus = useCallback(async () => {
    if (!qrIdentifier) return;

    try {
      const result = await request<any>("QQMUSIC_CHECK_LOGIN_STATUS", {
        identifier: qrIdentifier,
        type: "wx",
      });

      if (result.code === 0 && result.data) {
        const { status, userInfo } = result.data;

        switch (status) {
          case "success":
            setLoginStatus(LoginStatus.SUCCESS);
            setStoreLoginStatus(LoginStatus.SUCCESS);
            if (userInfo?.musicid && userInfo?.musickey) {
              login(userInfo as UserInfo);
              message.success("登录成功");
              onClose();
            } else {
              message.error("登录成功，但未拿到有效凭证");
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
            message.error(result.message || result.data.message || "登录失败");
            break;
          default:
            break;
        }
      } else if (result.code !== 0) {
        message.error(result.message || "登录状态检查失败");
      }
    } catch (error) {
      console.error("[Login] 检查登录状态失败:", error);
    }
  }, [login, onClose, qrIdentifier, request, setStoreLoginStatus]);

  useEffect(() => {
    if (open) {
      void fetchQRCode();
    }
  }, [open, fetchQRCode]);

  useEffect(() => {
    if (!open || !qrIdentifier || loginStatus === LoginStatus.SUCCESS) return;

    const interval = setInterval(() => {
      void checkLoginStatus();
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [checkLoginStatus, loginStatus, open, qrIdentifier]);

  const getStatusText = () => {
    switch (loginStatus) {
      case LoginStatus.PENDING:
        return "请使用微信扫码登录";
      case LoginStatus.SCANNING:
        return "已扫码，请在微信中确认登录";
      case LoginStatus.CONFIRMING:
        return "正在确认登录...";
      case LoginStatus.TIMEOUT:
        return "二维码已过期";
      case LoginStatus.FAILED:
        return "登录失败";
      case LoginStatus.SUCCESS:
        return "登录成功";
      default:
        return "";
    }
  };

  return (
    <Modal
      title={
        <span>
          <WechatOutlined /> 微信扫码登录 QQ 音乐
        </span>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={400}
      centered
    >
      <div className="login-qr-container">
        {isLoading ? (
          <div className="login-loading">
            <Spin size="large" />
            <p>正在获取二维码...</p>
          </div>
        ) : qrCode ? (
          <div className="login-qr-wrapper">
            <img
              src={qrCode}
              alt="微信登录二维码"
              className="login-qr-image"
            />
            <p className="login-status-text">{getStatusText()}</p>
            {(loginStatus === LoginStatus.TIMEOUT ||
              loginStatus === LoginStatus.FAILED) && (
              <Button type="primary" onClick={() => void fetchQRCode()}>
                重新获取二维码
              </Button>
            )}
          </div>
        ) : (
          <div className="login-error">
            <p>获取二维码失败</p>
            <Button type="primary" onClick={() => void fetchQRCode()}>
              重试
            </Button>
          </div>
        )}
      </div>

      <div className="login-tips">
        <p>登录说明：</p>
        <ul>
          <li>请使用微信扫描二维码。</li>
          <li>扫码后需要在手机上确认授权。</li>
          <li>二维码有效期约 5 分钟，过期后可重新获取。</li>
        </ul>
      </div>
    </Modal>
  );
};

export default LoginModal;
