/*
 * @Author: YangLiwei
 * @Date: 2022-05-19 12:00:43
 * @LastEditTime: 2024-09-18 11:54:07
 * @LastEditors: yangliwei 1280426581@qq.com
 * @FilePath: \touchfish\src\commands\openUrl.ts
 * @Description: +
 */
import * as vscode from 'vscode';
import { getChipHellNewsDetail } from '../api/chipHell';
import { getNewsDetail } from '../api/ithome';
import { getKKJNewsDetail } from '../api/kjj';
import { getV2exDetail } from '../api/v2ex';
import { getHupuDetail } from '../api/hupu';
import { getNgaNewsDetail } from '../api/nga';

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
    { enableFindWidget: true, retainContextWhenHidden: true, enableScripts: false }
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
export const openUrl = vscode.commands.registerCommand('itHome.openUrl', async (title: string, id: number) => {

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
export const openKKJUrl = vscode.commands.registerCommand('kkj.openUrl', async (title: string, url: string) => {

  // 如果没有创建过webview,则创建一个
  if (!isCreatePanel) {
    panel = createPanel();
  }
  panel!.webview.html = "加载中....";
  let newsUrl = url;
  if (title.includes('评测')) {
    newsUrl = url.replace('.htm', '_all.htm');
  }
  // 获取新闻详情
  await getKKJNewsDetail(newsUrl).then(res => {
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
export const openCLSUrl = vscode.commands.registerCommand('cls.openUrl', async (title: string, url: string) => {
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
      <div class="news_detail">${url}</div>
    </body>
    </html>
  `;
  panel!.title = title;
});


// 打开chiphell新闻详情
export const openCHUrl = vscode.commands.registerCommand('chiphell.openUrl', async (title: string, url: string) => {
  // 如果没有创建过webview,则创建一个
  if (!isCreatePanel) {
    panel = createPanel();
  }
  panel!.webview.html = "加载中....";
  // 获取新闻详情
  await getChipHellNewsDetail(url).then(res => {
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
        * {
          color: var(--vscode-editor-foreground) !important;;
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


// 打开v2ex新闻详情
export const openV2exUrl = vscode.commands.registerCommand('v2ex.openUrl', async (title: string, url: string) => {
  // 如果没有创建过webview,则创建一个
  if (!isCreatePanel) {
    panel = createPanel();
  }
  panel!.webview.html = "加载中....";
  // 获取新闻详情
  await getV2exDetail(url).then(res => {
    panel!.webview.html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <style>
        .topic_content {
          font-size: 16px;
        }
        .cell {
          padding: 10px;
          font-size: 14px;
          line-height: 150%;
          text-align: left;
          border-bottom: 1px solid var(--vscode-textBlockQuote-border);
        }
        .tag ,.votes{
          display: none;
        }
        img{
          max-width: 60%;
        }
        .fr {
          float: right;
          text-align: right;
        }
        .news_detail{
          width: 75%;
          margin-left: 12.5%;
          font-size: 18px;
          line-height: 2;
        }
        * {
          color: var(--vscode-editor-foreground) !important;
        }
      </style>
    </head>
    <body>
      <div class="news_detail">${res}</div>
    </body>
    </html>
  `;
  });
  panel!.title = title;
});

// 打开虎扑新闻详情
export const openHupuUrl = vscode.commands.registerCommand('hupu.openUrl', async (title: string, url: string) => {
  // 如果没有创建过webview,则创建一个
  if (!isCreatePanel) {
    panel = createPanel();
  }
  panel!.webview.html = "加载中....";
  // 获取新闻详情
  await getHupuDetail(url).then(res => {
    panel!.webview.html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <style>
      p{
        font-size: 18px;
      }
      .post-user_post-user-comp {
        min-height: 54px;
        display: -ms-flexbox;
        display: flex;
        -ms-flex-align: start;
        align-items: flex-start
    }
      .post-user_post-user-comp-avatar-wrapper {
        -ms-flex: 0 0 48px;
        flex: 0 0 48px;
        margin-right: 10px;
        border-radius: 50%
      }
      .post-user_post-user-comp-info {
        -ms-flex: 1 1 auto;
        flex: 1 1 auto;
        display: -ms-flexbox;
        display: flex;
        -ms-flex-align: start;
        align-items: flex-start;
        -ms-flex-pack: distribute;
        justify-content: space-around;
        -ms-flex-direction: column;
        flex-direction: column;
        font-weight: 400;
        font-size: 14px;
    }
    
    .post-user_post-user-comp-info-top {
        display: -ms-flexbox;
        display: flex;
        -ms-flex-align: center;
        align-items: center
    }
    .post-user_post-user-comp-info-top-name{
        color: #4b8dc3;
        margin-right: 8px;
        line-height: 1
    }

    .post-user_post-user-comp-info-bottom {
      line-height: 1.5;
      margin-top: 7px
  }
  
  .post-user_post-user-comp-info-bottom-title {
      font-size: 14px;
  }
  
  .post-user_post-user-comp-info-bottom-from {
      font-size: 12px;
      color: #96999f;
      margin-left: 7px
  }
  
  .post-user_post-user-comp-info-bottom-link {
      color: #96999f;
      margin-left: 7px
  }
  .seo-dom,.index_bbs-post-web-quote-title-container,.post-wrapper_toggle-tool,.index_pagination,.index_br,.post-operate_post-operate-comp-wrapper{
    display:none;
  }
  .post-reply-list-user-info-top-time{
    margin: 0 10px;
  }

  .post-reply-list-wrapper {
    padding: 14px 0;
    border-bottom: 1px solid var(--vscode-textBlockQuote-border);
  }
    
    .post-user_post-user-comp-info-top-tip {
        margin: 0 8px;
        background: #d8d8d8;
        border-radius: 9px;
        color: #191c22;
        font-size: 12px;
        padding: 1px 6px;
        cursor: default
    }

    .post-wrapper_bbs-post-wrapper.post-wrapper_light {
      padding: 0 14px;
      border: 1px solid var(--vscode-scrollbar-shadow);
      -webkit-box-sizing: border-box;
      box-sizing: border-box;
      background: var(--vscode-input-background)
  }

      .post-reply-list_post-reply-list-wrapper .post-reply-list .post-reply-list-container {
        display: -ms-flexbox;
        display: flex;
        -ms-flex-align: start;
        align-items: flex-start;
        -ms-flex-pack: start;
        justify-content: flex-start
    }

    .post-reply-list_post-reply-list-wrapper .post-reply-list .reply-list-avatar-wrapper .avatar,.post-reply-list_post-reply-list-wrapper .post-reply-list .reply-list-avatar-wrapper .avatar-placeholder img {
      width: 36px;
      height: 36px;
      border-radius: 4px;
      border-radius: 50%
  }
  .post-reply-list_post-reply-list-wrapper .post-reply-list .reply-list-avatar {
    -ms-flex: 0 0 36px;
    flex: 0 0 36px;
    width: 36px;
    margin-right: 10px
}
.post-wrapper_bbs-post-wrapper-title {
  height: 46px;
  line-height: 46px;
  padding-left: 19px;
  font-family: PingFangSC-Semibold;
  font-weight: 700;
  font-size: 18px;
  color: #191c22;
  position: relative;
  letter-spacing: 0;
  display: -ms-flexbox;
  display: flex;
  -ms-flex-align: center;
  align-items: center;
  -ms-flex-pack: start;
  justify-content: flex-start
}
.post-reply-list_post-reply-list-wrapper .post-reply-list .reply-list-content .post-reply-list-operate {
  font-family: PingFangSC-Regular;
  font-size: 14px;
  color: #7b7e86;
  display: -ms-flexbox;
  display: flex;
  -ms-flex-align: center;
  align-items: center;
  -ms-flex-pack: start;
  justify-content: flex-start;
  margin-top: 16px;
  margin-left: -10px
}

.ngabtn{
  position: absolute;
  font-size: 15px;
  right: 20px;
  top: 20px;
  background-color: var(--vscode-button-background);
  max-width: 300px;
  box-sizing: border-box;
  display: flex;
  width: 300px;
  padding: 4px;
  border-radius: 2px;
  text-align: center;
  cursor: pointer;
  justify-content: center;
  align-items: center;
  border: 1px solid var(--vscode-button-border,transparent);
  line-height: 18px;
  text-decoration: none;
  color: var(--vscode-button-foreground);
}
.ngabtn:hover{
  background-color: var(--vscode-button-hoverBackground);
}

.index_bbs-thread-comp-container {
  position: relative;
  padding: 10px 14px;
  background: var(--vscode-button-secondaryBackground)
}     
.todo-list{
  margin:0 10px;
}   
        .news_detail{
          width: 75%;
          margin-left: 12.5%;
          line-height: 2;
        }
        div {
          color: var(--vscode-editor-foreground) !important;
        }
        .index_bbs-thread-comp img,.index_bbs-thread-comp video {
          max-width: 50%;
        }

      </style>
    </head>
    <body>
      <a class="ngabtn" href="${"https://bbs.hupu.com"+url}" >打开原文章</a>
      <div class="news_detail">${res}</div>
    </body>
    </html>
  `;
  });
  panel!.title = title;
});

// 打开nga新闻详情
export const openNgaUrl = vscode.commands.registerCommand('nga.openUrl', async (title: string, url: string) => {
  // 如果没有创建过webview,则创建一个
  if (!isCreatePanel) {
    panel = createPanel();
  }
  panel!.webview.html = "加载中....";
  // 获取新闻详情
  await getNgaNewsDetail(url).then(res => {
    panel!.webview.html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <style>
        img{
          max-width: 45%;
          display: block;
        }
        #postcontent0 br {
          display: block !important;
        }
        #post1strow0 .c2 {
          flex-wrap: wrap;
        }
        .postbox{
          margin: 15px 0;
          width:100%;
          border-bottom: 1px solid var(--vscode-button-secondaryBackground);
        }
        .news_detail{
          width: 75%;
          margin-left: 12.5%;
          font-size: 18px;
          line-height: 3;
        }
        .postInfo{
          font-size: 16px;
          margin-right: 20px;
          width: 130px;
          flex-shrink: 0;
        }
        .c2{
          display:flex;
        }
        .posterinfo,.postrow span br,h3,.postbodysubtitle,.comment_c .postInfo,.small_colored_text_btn{
          display:none
        }
        #hightlight_for_0{
          display: flex;
          flex-wrap: wrap;
          width: 100%;
        }
        .comment_c{
          background: var(--vscode-list-inactiveSelectionBackground);
          padding: 10px;
          margin-bottom: 5px;
          margin-right: 5px;
        }
        .ngabtn{
          position: absolute;
          font-size: 15px;
          right: 20px;
          top: 20px;
          background-color: var(--vscode-button-background);
          max-width: 300px;
          box-sizing: border-box;
          display: flex;
          width: 300px;
          padding: 4px;
          border-radius: 2px;
          text-align: center;
          cursor: pointer;
          justify-content: center;
          align-items: center;
          border: 1px solid var(--vscode-button-border,transparent);
          line-height: 18px;
          text-decoration: none;
          color: var(--vscode-button-foreground);
        }
        .ngabtn:hover{
          background-color: var(--vscode-button-hoverBackground);
        }
        * {
          color: var(--vscode-editor-foreground) !important;
        }
      </style>
    </head>
    <body>
      <h1 style="text-align:center" >${title}</h1>
      <a class="ngabtn" href="${"https://bbs.nga.cn"+url}" >打开原文章</a>
      <div class="news_detail">${res}</div>
    </body>
    </html>
  `;
  });
  panel!.title = title;
});
