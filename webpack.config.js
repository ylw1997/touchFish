/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-08-04 18:02:41
 * @LastEditTime: 2025-08-18 14:11:27
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\webpack.config.js
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved. 
 * @Description: 
 */
//@ts-check

'use strict';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');

//@ts-check
/** @typedef {import('webpack').Configuration} WebpackConfig **/

/** @type WebpackConfig */
const extensionConfig = {
  target: 'node', // vscode extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/
	mode: 'none', // this leaves the source code as close as possible to the original (when packaging we set this to 'production')

  entry: {
    extension: './src/extension.ts', // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
    'zhihu': './src/utils/zhihu.js'
  },
  output: {
    // the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    libraryTarget: 'commonjs2'
  },
  externals: {
    vscode: 'commonjs vscode' // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
    // modules added here also need to be added in the .vscodeignore file
  },
  resolve: {
    // support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader'
          }
        ]
      }
    ]
  },
  devtool: 'nosources-source-map',
  infrastructureLogging: {
    level: "log", // enables logging required for problem matchers
  },
};
module.exports = [ extensionConfig ];