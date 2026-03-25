/*
 * @Description: Bilibili 扫码登录组件
 */
import React, { useCallback, useEffect, useState } from "react";
import { Button, Modal, Spin } from "antd";
import { QrcodeOutlined } from "@ant-design/icons";
import { useUserStore, LoginStatus } from "../store/user";
import { useRequest } from "../hooks/useRequest";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ open, onClose }) => {
  const [qrImageUrl, setQrImageUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // 并发锁，防止网络卡顿时 setInterval 堆积并发请求
  const isCheckingRef = React.useRef(false);

  const { request, messageApi } = useRequest();
  const { loginStatus, setLoginStatus, setQRCode, qrKey, login } =
    useUserStore();

  // 生成二维码
  const generateQRCode = useCallback(async () => {
    setIsLoading(true);
    setQrImageUrl("");
    setQRCode(null, null);

    try {
      const result = await request<any>("BILIBILI_GET_LOGIN_QR", null);

      if (result.code === 0 && result.data) {
        const { url, qrcode_key } = result.data;
        // 使用 qrserver 生成二维码图片
        const qrImage = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(url)}&size=200x200`;
        setQrImageUrl(qrImage);
        setQRCode(url, qrcode_key);
        setLoginStatus(LoginStatus.PENDING);
      } else {
        console.error("[LoginModal] 获取二维码失败:", result.message);
      }
    } catch (error: any) {
      console.error("[Login] 获取二维码失败:", error);
    } finally {
      setIsLoading(false);
    }
  }, [request, setQRCode, setLoginStatus]);

  // 轮询登录状态
  const checkLoginStatus = useCallback(async () => {
    if (!qrKey || isCheckingRef.current) return;

    isCheckingRef.current = true;
    try {
      const result = await request<any>("BILIBILI_CHECK_LOGIN_STATUS", {
        qrcode_key: qrKey,
      });

      if (result.code === 0 && result.data) {
        const { status, userInfo, message: msg } = result.data;

        switch (status) {
          case "success":
            setLoginStatus(LoginStatus.SUCCESS);
            if (userInfo) {
              login(userInfo);
              messageApi.success("登录成功");
              onClose();
            } else {
              messageApi.error("登录成功，但未获取到用户信息");
            }
            break;
          case "scanning":
            setLoginStatus(LoginStatus.SCANNING);
            break;
          case "confirming":
            setLoginStatus(LoginStatus.CONFIRMING);
            break;
          case "timeout":
            setLoginStatus(LoginStatus.TIMEOUT);
            messageApi.error("二维码已过期，请重新获取");
            break;
          case "failed":
            setLoginStatus(LoginStatus.FAILED);
            messageApi.error(msg || "登录失败");
            break;
        }
      }
    } catch (error) {
      console.error("[Login] 检查登录状态失败:", error);
    } finally {
      isCheckingRef.current = false;
    }
  }, [qrKey, request, setLoginStatus, login, onClose, messageApi]);

  // 打开弹窗时生成二维码
  useEffect(() => {
    if (open) {
      void generateQRCode();
    }
  }, [open, generateQRCode]);

  // 轮询二维码状态
  useEffect(() => {
    if (!open || !qrKey || loginStatus === LoginStatus.SUCCESS) return;

    const interval = setInterval(() => {
      void checkLoginStatus();
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [checkLoginStatus, loginStatus, open, qrKey]);

  // 获取状态文本
  const getStatusText = () => {
    switch (loginStatus) {
      case LoginStatus.PENDING:
        return "请使用B站APP扫码登录";
      case LoginStatus.SCANNING:
        return "已扫码，请在手机上确认";
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
          <QrcodeOutlined /> B站扫码登录
        </span>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={360}
      centered
    >
      <div
        className="login-qr-container"
        style={{ textAlign: "center", padding: "20px 0" }}
      >
        {isLoading ? (
          <div style={{ padding: "40px 0" }}>
            <Spin size="large" />
            <p style={{ marginTop: 16, color: "#888" }}>正在获取二维码...</p>
          </div>
        ) : qrImageUrl ? (
          <div>
            <div
              style={{
                position: "relative",
                display: "inline-block",
                padding: 12,
                background: "#fff",
                borderRadius: 8,
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              <img
                src={qrImageUrl}
                alt="B站登录二维码"
                style={{
                  width: 180,
                  height: 180,
                  display: "block",
                  filter:
                    loginStatus === LoginStatus.TIMEOUT
                      ? "grayscale(100%)"
                      : "none",
                }}
              />
              {loginStatus === LoginStatus.SCANNING && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "rgba(251, 114, 153, 0.9)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 8,
                    color: "#fff",
                    fontSize: 16,
                    fontWeight: "bold",
                  }}
                >
                  已扫码
                </div>
              )}
            </div>
            <p
              style={{
                marginTop: 16,
                color:
                  loginStatus === LoginStatus.TIMEOUT ||
                  loginStatus === LoginStatus.FAILED
                    ? "#ff4d4f"
                    : "#666",
              }}
            >
              {getStatusText()}
            </p>
            {(loginStatus === LoginStatus.TIMEOUT ||
              loginStatus === LoginStatus.FAILED) && (
              <Button
                type="primary"
                onClick={() => void generateQRCode()}
                style={{ marginTop: 8 }}
              >
                重新获取二维码
              </Button>
            )}
          </div>
        ) : (
          <div style={{ padding: "40px 0" }}>
            <p>获取二维码失败</p>
            <Button
              type="primary"
              onClick={() => void generateQRCode()}
              style={{ marginTop: 8 }}
            >
              重试
            </Button>
          </div>
        )}
      </div>

      <div style={{ padding: "0 16px", fontSize: 12, color: "#888" }}>
        <p>登录说明：</p>
        <ul style={{ paddingLeft: 16, margin: "8px 0" }}>
          <li>请使用Bilibili APP扫描二维码</li>
          <li>扫码后需要在手机上确认授权</li>
          <li>二维码有效期约3分钟，过期后可重新获取</li>
        </ul>
      </div>
    </Modal>
  );
};

export default LoginModal;
