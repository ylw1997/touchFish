/*
 * @Author: YangLiwei
 * @Date: 2022-05-19 12:00:43
 * @LastEditTime: 2022-05-20 11:28:28
 * @LastEditors: YangLiwei
 * @FilePath: \hello-world\src\commands\openUrl.ts
 * @Description: +
 */
import * as vscode from 'vscode';
import { getNewsDetail } from '../api/ithome';

// 是否已经创建webview
let isCreatePanel = false;
// 新闻详情页面
let panel: vscode.WebviewPanel | null = null;

// 创建一个webview
const createPanel = (): vscode.WebviewPanel => {
  const panel = vscode.window.createWebviewPanel(
    'Hello World',
    "新闻",
    vscode.ViewColumn.One,
    {}
  );
  isCreatePanel = true;
  panel.dispose = () => {
    isCreatePanel = false;
  };
  return panel;
};

/**
 * 打开新闻详情
 */
export const openUrl = vscode.commands.registerCommand('itHome.openUrl',async (title: string, time: string, id: number) => {

  // 如果没有创建过webview,则创建一个
  if (!isCreatePanel) {
    panel = createPanel();
  }
  panel!.webview.html = "加载中....";
  // 获取新闻详情
  await getNewsDetail(id).then(res => {
    panel!.webview.html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="ie=edge">
      <title>Document</title>
      <link rel="stylesheet" href="https://www.ithome.com/css/detail.min.css">
      <style>
        p {
          font-size: 18px;
          line-height: 2;
        }
        img{
          max-width: 60%;
        }
        .news_detail{
          width: 75%;
          margin-left: 12.5%;
        }
      </style>
    </head>
    <body>
      <h1 style="text-align:center" >${title}</h1>
      <div class="news_detail">${res.data.detail}</div>
    </body>
    </html>
  `;
  });
  panel!.title = title;
});

