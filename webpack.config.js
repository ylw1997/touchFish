/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-08-04 18:02:41
 * @LastEditTime: 2025-10-22 12:10:27
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\webpack.config.js
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description:
 */
//@ts-check

"use strict";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require("path");

//@ts-check
/** @typedef {import('webpack').Configuration} WebpackConfig **/
const isDev = process.env.NODE_ENV === "development";

/** @type WebpackConfig */
const extensionConfig = {
  target: "node",
  mode: isDev ? "development" : "production",
  entry: {
    extension: "./src/extension.ts", // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
  },
  output: {
    // the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
    libraryTarget: "commonjs2",
  },
  externals: {
    vscode: "commonjs vscode", // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
    // modules added here also need to be added in the .vscodeignore file
    jsdom: "commonjs jsdom", // 排除 jsdom，运行时动态加载
    bufferutil: "commonjs bufferutil", // 可选依赖
    "utf-8-validate": "commonjs utf-8-validate", // 可选依赖
    canvas: "commonjs canvas", // 可选依赖
  },
  resolve: {
    // support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "ts-loader",
          },
        ],
      },
      {
        test: /(zhihu|xhs)\.raw\.js$/,
        type: "asset/source",
      },
    ],
  },
  plugins: [],
  devtool: "nosources-source-map",
  infrastructureLogging: {
    level: "log", // enables logging required for problem matchers
  },
};
module.exports = [extensionConfig];
