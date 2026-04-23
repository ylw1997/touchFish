import { ConfigProvider, theme, App as AntdApp } from "antd";
import zhCN from "antd/locale/zh_CN";
import { useState, useEffect, useMemo } from "react";
import App from "./App";

const getTheme = () => {
  return (
    document.body.getAttribute("data-vscode-theme-kind") === "vscode-light"
  );
};

const ThemeWrapper = () => {
  const [isLightTheme, setIsLightTheme] = useState(getTheme());
  const fontSize = 14;

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
        fontSizeSM: 12,
        colorBgContainer: "var(--vscode-sideBar-background)",
        colorText: "var(--vscode-foreground)",
        colorTextDescription: "var(--vscode-descriptionForeground)",
        colorTextSecondary: "var(--vscode-descriptionForeground)",
        colorBorder: "var(--vscode-widget-border)",
        colorSplit: "var(--vscode-widget-border)",
        colorLink: "var(--vscode-textLink-foreground)",
        colorLinkHover: "var(--vscode-textLink-activeForeground)",
        colorIcon: "var(--vscode-icon-foreground)",
        colorIconHover: "var(--vscode-foreground)",
        borderRadius: 4,
      },
      components: {
        Card: {
          colorBgContainer: "transparent",
          padding: 8,
        },
      },
    }),
    [isLightTheme]
  );

  return (
    <ConfigProvider theme={antdTheme} locale={zhCN}>
      <AntdApp>
        <main className={isLightTheme ? "" : "dark"}>
          <App />
        </main>
      </AntdApp>
    </ConfigProvider>
  );
};

export default ThemeWrapper;
