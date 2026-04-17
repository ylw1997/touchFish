/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-08-19 13:47:05
 * @LastEditTime: 2025-08-20 10:12:12
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\zhihu\tailwind.config.js
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description:
 */
const { heroui } = require("@heroui/react");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  darkMode: "class",
  plugins: [
    heroui({
      themes: {
        dark: {
          colors: {
            default: {
              50: "#0d0d0e",
              100: "#19191c",
              200: "#26262a",
              300: "#323238",
              400: "#83838380",
              500: "#65656b",
              600: "#8c8c90",
              700: "#b2b2b5",
              800: "#d9d9da",
              900: "#ffffff",
              foreground: "#fff",
              DEFAULT: "#83838380",
            },
          },
        },
      },
    }),
  ],
};
