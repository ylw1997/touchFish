/*
 * @Author: YangLiwei
 * @Date: 2022-05-19 12:00:43
 * @LastEditTime: 2022-05-23 11:08:17
 * @LastEditors: YangLiwei
 * @FilePath: \hello-world\src\commands\openUrl.ts
 * @Description: +
 */
import * as vscode from 'vscode';
import { getNewsDetail } from '../api/ithome';
import { getKKJNewsDetail } from '../api/kjj';

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
 * 打开之家新闻详情
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


/**
 * 打开快科技新闻详情
 */
export const openKKJUrl = vscode.commands.registerCommand('kkj.openUrl',async (title: string, url: string) => {
  
    // 如果没有创建过webview,则创建一个
    if (!isCreatePanel) {
      panel = createPanel();
    }
    panel!.webview.html = "加载中....";
    // 获取新闻详情
    await getKKJNewsDetail(url).then(res => {
      panel!.webview.html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="ie=edge">
        <title>Document</title>
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
        <div class="news_detail">${res}</div>
      </body>
      </html>
    `;
    });
    panel!.title = title;
  });

  /**
   *  打开财联社新闻详情
   * @param title  新闻标题
   * @param content  新闻内容
   */
  export const openCLSUrl = vscode.commands.registerCommand('cls.openUrl',async (title: string, content: string) => {
    // 如果没有创建过webview,则创建一个
    if (!isCreatePanel) {
      panel = createPanel();
    }
    panel!.webview.html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="ie=edge">
      <title>Document</title>
      <style>
        .news_detail{
          width: 75%;
          margin-left: 12.5%;
          font-size: 18px;
          line-height: 2;
        }
      </style>
    </head>
    <body>
      <h1 style="text-align:center" >${title}</h1>
      <div class="news_detail">${content}</div>
    </body>
    </html>
  `;
    panel!.title = title;
  });
  