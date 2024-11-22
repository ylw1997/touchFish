/*
 * @Author: yangliwei 1280426581@qq.com
 * @Date: 2024-09-18 16:22:08
 * @LastEditTime: 2024-11-22 14:25:19
 * @LastEditors: yangliwei 1280426581@qq.com
 * @FilePath: \touchfish\eslint.config.mjs
 * Copyright (c) 2024 by yangliwei, All Rights Reserved. 
 * @Description: 
 */
import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";


export default [
  {files: ["**/*.{js,mjs,cjs,ts}"]},
  {files: ["**/*.js"], languageOptions: {sourceType: "script"}},
  {languageOptions: { globals: {...globals.browser, ...globals.node} }},
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {"@typescript-eslint/no-explicit-any": "error"}
];