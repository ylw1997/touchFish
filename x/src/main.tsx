/*
 * @Author: yangliwei 1280426581@qq.com
 * @Date: 2024-11-18 11:49:59
 * @LastEditTime: 2025-08-20 09:55:54
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\weibo\src\main.tsx
 * Copyright (c) 2024 by yangliwei, All Rights Reserved.
 * @Description:
 */
import { createRoot } from "react-dom/client";
import ThemeWrapper from "./ThemeWrapper";
import "./style/index.less";

createRoot(document.getElementById("root")!).render(<ThemeWrapper />);
