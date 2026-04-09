/*
 * @Author: yangliwei 1280426581@qq.com
 * @Date: 2024-11-12 17:42:50
 * @LastEditTime: 2024-11-19 14:29:40
 * @LastEditors: yangliwei 1280426581@qq.com
 * @FilePath: \touchfish\weibo\vite.config.ts
 * Copyright (c) 2024 by yangliwei, All Rights Reserved.
 * @Description:
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    cors: true,
    port: 5178,
    strictPort: true,
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "[name].js",
        assetFileNames: "[name].[ext]",
        manualChunks(id) {
          if (id.includes("node_modules")) {
            return "vendor";
          }
        },
      },
    },
  },
});
