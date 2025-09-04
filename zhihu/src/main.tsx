/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-09-03 17:06:20
 * @LastEditTime: 2025-09-04 17:09:01
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\zhihu\src\main.tsx
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved. 
 * @Description: 
 */
import { createRoot } from "react-dom/client";
import ThemeWrapper from "./ThemeWrapper";
import "../styles.css";

createRoot(document.getElementById("root")!).render(<ThemeWrapper />);