/*
 * @Author: yangliwei 1280426581@qq.com
 * @Date: 2025-08-07 09:19:24
 * @LastEditTime: 2025-08-19 14:49:11
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\zhihu\src\main.tsx
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description:
 */
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { ConfigProvider } from "antd";
import { theme } from "antd";
import zhCN from "antd/locale/zh_CN";
import { HeroUIProvider } from "@heroui/react";
import "../styles.css";
createRoot(document.getElementById("root")!).render(
  <ConfigProvider
    theme={{
      algorithm: theme.darkAlgorithm,
    }}
    locale={zhCN}
  >
    <HeroUIProvider>
       <main className="dark">
        <App />
      </main>
    </HeroUIProvider>
  </ConfigProvider>
);
