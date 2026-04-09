import React, { useState } from "react";
import { Button, Modal, message, Input } from "antd";
import { MobileOutlined, MessageOutlined } from "@ant-design/icons";
import { useRequest } from "../hooks/useRequest";
import { useUserStore } from "../store/user";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ open, onClose }) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [code, setCode] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const { request } = useRequest();
  const { login } = useUserStore();

  const handleSendCode = async () => {
    if (!phoneNumber || phoneNumber.length !== 11) {
      message.error("请输入有效的11位手机号");
      return;
    }

    setIsSending(true);
    try {
      const result = await request<any>("XIAOYUZHOU_SEND_CODE" as any, {
        phoneNumber
      });
      if (result.code === 0) {
        message.success("验证码发送成功");
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        message.error("发送失败, 请尝试其他方式");
      }
    } catch {
      message.error("发送失败");
    } finally {
      setIsSending(false);
    }
  };

  const handleLogin = async () => {
    if (!phoneNumber || !code) {
      message.error("请填写手机号和验证码");
      return;
    }

    setIsLoggingIn(true);
    try {
      const result = await request<any>("XIAOYUZHOU_LOGIN_WITH_SMS" as any, {
        phoneNumber,
        verifyCode: code
      });

      if (result.code === 0 && result.data?.userInfo) {
        // 后台直接封装了 credential 和 userInfo 给前端
        login({
          nickname: result.data.userInfo.nickname,
          avatar: result.data.userInfo.avatar,
          uid: result.data.userInfo.uid,
          token: result.data.credential.accessToken, // 保存认证token以供请求使用
          // 为兼容原 qq 音乐部分验证字段提供备用口
          musicid: result.data.userInfo.uid,
          musickey: result.data.credential.accessToken || "dummy_key"
        } as any);
        message.success("登录成功");
        onClose();
      } else {
        message.error("填写验证码错误或过期");
      }
    } catch {
      message.error("登录异常");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <Modal
      title={
        <span>
          <MobileOutlined /> 小宇宙手机号登录
        </span>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={400}
      centered
    >
      <div className="login-qr-container" style={{ padding: '20px 0' }}>
         <div style={{ marginBottom: 16 }}>
           <Input
             prefix={<MobileOutlined style={{ color: "rgba(0,0,0,.25)" }} />}
             placeholder="请输入11位手机号码"
             value={phoneNumber}
             onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 11))}
             size="large"
           />
         </div>
         <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
           <Input
             prefix={<MessageOutlined style={{ color: "rgba(0,0,0,.25)" }} />}
             placeholder="短信验证码"
             value={code}
             onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
             size="large"
           />
           <Button
             size="large"
             onClick={handleSendCode}
             disabled={isSending || countdown > 0 || phoneNumber.length !== 11}
           >
             {countdown > 0 ? `${countdown}s 后重新发送` : "获取验证码"}
           </Button>
         </div>

         <Button
           type="primary"
           size="large"
           block
           onClick={handleLogin}
           loading={isLoggingIn}
           disabled={!phoneNumber || code.length < 4}
         >
           一键登录
         </Button>
      </div>

      <div className="login-tips">
        <p>登录说明：</p>
        <ul>
          <li>使用小宇宙绑定的手机号登录。</li>
          <li>将通过短信发送一个6位数或4位数的验证码。</li>
          <li>只有登录后才能获取完整的体验。</li>
        </ul>
      </div>
    </Modal>
  );
};

export default LoginModal;
