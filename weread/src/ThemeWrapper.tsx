import { ConfigProvider, theme, App as AntdApp } from "antd";
import zhCN from "antd/locale/zh_CN";
import { useState, useEffect, useMemo } from "react";
import App from "./App";
import { useFontSizeStore } from "./store/fontSize";

const getThemeKind = () => {
  return document.body.getAttribute('data-vscode-theme-kind');
};

const ThemeWrapper = () => {
  const [themeKind, setThemeKind] = useState(getThemeKind());
  const fontSize = useFontSizeStore((state) => state.fontSize);
  const setFontSize = useFontSizeStore((state) => state.setFontSize);

  useEffect(() => {
    // 设置 CSS 变量，供 App.less 使用
    document.documentElement.style.setProperty('--app-font-size', `${fontSize}px`);
  }, [fontSize]);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setThemeKind(getThemeKind());
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-vscode-theme-kind'],
    });

    const handleMessage = (event: MessageEvent) => {
      const { command, payload } = event.data;
      if (command === 'SET_CONFIG') {
        if (payload.fontSize) {
          setFontSize(payload.fontSize);
        }
      }
    };
    window.addEventListener('message', handleMessage);

    return () => {
      observer.disconnect();
      window.removeEventListener('message', handleMessage);
    };
  }, [setFontSize]);

  const isLightTheme = themeKind === 'vscode-light';

  const antdTheme = useMemo(
    () => ({
      algorithm: isLightTheme ? theme.defaultAlgorithm : theme.darkAlgorithm,
      token: {
        fontSize: fontSize,
        colorText: "var(--vscode-foreground)",
        colorTextDescription: "var(--vscode-descriptionForeground)",
        colorTextSecondary: "var(--vscode-descriptionForeground)",
        colorBorder: "var(--vscode-chat-requestBorder)",
        colorSplit: "var(--vscode-chat-requestBorder)",
        colorLink: "var(--vscode-textLink-foreground)",
        colorLinkHover: "var(--vscode-textLink-activeForeground)",
        colorIcon: "var(--vscode-icon-foreground)",
        colorIconHover: "var(--vscode-foreground)",
        borderRadius: 4,
      },
    }),
    [fontSize, isLightTheme]
  );

  return (
    <ConfigProvider theme={antdTheme} locale={zhCN}>
      <AntdApp>
        <App />
      </AntdApp>
    </ConfigProvider>
  );
};

export default ThemeWrapper;
