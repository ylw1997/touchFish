/*
 * @Author: yangliwei 1280426581@qq.com
 * @Date: 2024-11-18 11:49:59
 * @LastEditTime: 2024-11-19 16:03:17
 * @LastEditors: yangliwei 1280426581@qq.com
 * @FilePath: \touchfish\weibo\src\main.tsx
 * Copyright (c) 2024 by yangliwei, All Rights Reserved.
 * @Description:
 */
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { ConfigProvider } from "antd";
import { theme } from "antd";

createRoot(document.getElementById("root")!).render(
  <ConfigProvider
    theme={{
      algorithm: theme.darkAlgorithm,
    }}
  >
    <App />
  </ConfigProvider>
);
