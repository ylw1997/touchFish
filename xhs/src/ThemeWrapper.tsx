import { ConfigProvider, theme } from "antd";
import zhCN from "antd/locale/zh_CN";
import { useState, useEffect, useMemo } from "react";
import Feed from "./components/Feed";

const getTheme = () => {
  return document.body.getAttribute('data-vscode-theme-kind') === 'vscode-light';
};

const ThemeWrapper = () => {
  const [isLightTheme, setIsLightTheme] = useState(getTheme());

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsLightTheme(getTheme());
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-vscode-theme-kind'],
    });

    return () => observer.disconnect();
  }, []);

  const antdTheme = useMemo(() => ({
    algorithm: isLightTheme ? theme.defaultAlgorithm : theme.darkAlgorithm,
    token: {
      fontSize: 14,
      fontSizeSM: 13,
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
  }), [isLightTheme]);

  return (
    <ConfigProvider theme={antdTheme} locale={zhCN}>
        <main className={isLightTheme ? "" : "dark"}>
          <Feed />
        </main>
    </ConfigProvider>
  );
};

export default ThemeWrapper;