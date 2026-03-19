/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-09-04 17:07:50
 * @LastEditTime: 2025-09-10 14:12:47
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\zhihu\src\ThemeWrapper.tsx
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description:
 */
import { ConfigProvider, theme, App as AntdApp } from "antd";
import zhCN from "antd/locale/zh_CN";
import { HeroUIProvider } from "@heroui/react";
import { useState, useEffect, useMemo } from "react";
import App from "./App";

import { useFontSizeStore } from "./store/fontSize";

const getTheme = () => {
  return (
    document.body.getAttribute("data-vscode-theme-kind") === "vscode-light"
  );
};

const ThemeWrapper = () => {
  const [isLightTheme, setIsLightTheme] = useState(getTheme());
  const fontSize = useFontSizeStore((state) => state.fontSize);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--app-font-size",
      `${fontSize}px`
    );
  }, [fontSize]);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsLightTheme(getTheme());
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["data-vscode-theme-kind"],
    });

    return () => observer.disconnect();
  }, []);

  const antdTheme = useMemo(
    () => ({
      algorithm: isLightTheme ? theme.defaultAlgorithm : theme.darkAlgorithm,
      token: {
        fontSize: fontSize,
        fontSizeSM: 14,
        colorBorderSecondary: "var(--vscode-chat-requestBorder)",
        colorText: "var(--vscode-foreground)",
        colorTextDescription: "var(--vscode-descriptionForeground)",
        colorTextSecondary: "var(--vscode-descriptionForeground)",
        colorBorder: "var(--vscode-chat-requestBorder)",
        colorSplit: "var(--vscode-chat-requestBorder)",
        colorLink: "var(--vscode-textLink-foreground)",
        colorLinkHover: "var(--vscode-textLink-activeForeground)",
        colorIcon: "var(--vscode-icon-foreground)",
        colorIconHover: "var(--vscode-foreground)",
        borderRadius: 10,
      },
      components: {
        Card: {
          colorBgContainer: "transparent",
          padding: 10,
          paddingLG: 10,
        },
        Drawer: {
          colorBgElevated: "transparent",
        },
      },
    }),
    [fontSize, isLightTheme]
  );

  return (
    <ConfigProvider theme={antdTheme} locale={zhCN}>
      <AntdApp>
        <HeroUIProvider>
          <main className={isLightTheme ? "" : "dark"}>
            <App />
          </main>
        </HeroUIProvider>
      </AntdApp>
    </ConfigProvider>
  );
};

export default ThemeWrapper;
