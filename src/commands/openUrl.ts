/*
 * @Author: YangLiwei
 * @Date: 2022-05-19 12:00:43
 * @LastEditTime: 2025-08-19 09:03:43
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\src\commands\openUrl.ts
 * @Description: +
 */
import * as vscode from "vscode";
import { getChipHellNewsDetail } from "../api/chipHell";
import { getNewsDetail } from "../api/ithome";
import { getV2exDetail } from "../api/v2ex";
import { getHupuDetail } from "../api/hupu";
import { getNgaNewsDetail } from "../api/nga";

// 新闻详情页面
let panel: vscode.WebviewPanel | null = null;

// 创建一个 webview
const createPanel = (): vscode.WebviewPanel => {
  const newPanel = vscode.window.createWebviewPanel(
    "Hello World",
    "新闻",
    vscode.ViewColumn.One,
    { retainContextWhenHidden: false, enableScripts: false }
  );
  newPanel.onDidDispose(() => {
    panel = null;
  });
  return newPanel;
};

const createWebviewHtml = (
  title: string,
  content: string,
  originalUrl?: string,
  extraCss: string = "",
  extraHead: string = "",
  showTitle: boolean = true
) => {
  const buttonHtml = originalUrl
    ? `<a class="open-article-btn" href="${originalUrl}" >打开原文章</a>`
    : "";
  const titleHtml = showTitle
    ? `<h1 style="text-align:center" >${title}</h1>`
    : "";
  content = content.replace(/<img/g, '<img referrerpolicy="no-referrer"').replace(/<video/g, '<video referrerpolicy="no-referrer"');
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="ie=edge">
      <title>Document</title>
      ${extraHead}
      <style>
        .news_detail {
          width: 75%;
          margin-left: 12.5%;
        }
        
        * {
          color: var(--vscode-editor-foreground) !important;
          font-family:'Microsoft YaHei';
          line-height: 2;
        }
        .open-article-btn {
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
          line-height: 16px;
          text-decoration: none;
          color: var(--vscode-button-foreground);
        }
        .open-article-btn:hover {
          background-color: var(--vscode-button-hoverBackground);
        }
        ${extraCss}
      </style>
    </head>
    <body>
      ${titleHtml}
      ${buttonHtml}
      <div class="news_detail">${content}</div>
    </body>
    </html>
  `;
};

const openDetailView = async (
  title: string,
  fetchData: () => Promise<any>,
  processData: (data: any) => {
    content: string;
    originalUrl?: string;
    extraCss?: string;
    extraHead?: string;
    showTitle?: boolean;
  }
) => {
  if (!panel) {
    panel = createPanel();
  }
  panel.title = title;
  panel.webview.html = "加载中....";
  panel.reveal();

  try {
    const data = await fetchData();
    const { content, originalUrl, extraCss, extraHead, showTitle } = processData(data);
    if (panel) {
      panel.webview.html = createWebviewHtml(
        title,
        content,
        originalUrl,
        extraCss,
        extraHead,
        showTitle
      );
    }
  } catch (error) {
    console.error(error);
    if (panel) {
      panel.webview.html = createWebviewHtml(title, "内容加载失败");
    }
  }
};

/**
 * 打开之家新闻详情
 */
export const openUrl = vscode.commands.registerCommand(
  "itHome.openUrl",
  async (title: string, id: number) => {
    await openDetailView(
      title,
      () => getNewsDetail(id),
      (res) => {
        const extraCss = `
        p {
          font-size: 16px;
          line-height: 2;
        }
    `;
        const extraHead =
          '<link rel="stylesheet" href="https://www.ithome.com/css/detail.min.css">';
        const content = res && res.data && res.data.detail;
        return {
          content: content || "内容加载失败",
          extraCss,
          extraHead,
        };
      }
    );
  }
);

// 打开chiphell新闻详情
export const openCHUrl = vscode.commands.registerCommand(
  "chiphell.openUrl",
  async (title: string, url: string) => {
    await openDetailView(
      title,
      () => getChipHellNewsDetail(url),
      (res) => ({
        
        content: res || "内容加载失败",
        originalUrl: url,
        extraCss: `
          img{
            max-width: 60%;
          }
          .news_detail {
            font-size: 16px;  
          }
        `,
      })
    );
  }
);

// 打开v2ex新闻详情
export const openV2exUrl = vscode.commands.registerCommand(
  "v2ex.openUrl",
  async (title: string, url: string) => {
    await openDetailView(
      title,
      () => getV2exDetail(url),
      (res) => {
        const extraCss = `
        .open-article-btn{
          top: 90px;
        }
        .topic_content,.reply_content {
          font-size: 16px;
        }
        .cell {
          padding: 10px 0;
          font-size: 14px;
          line-height: 150%;
          text-align: left;
          border-bottom: 1px solid var(--vscode-textBlockQuote-border);
        }
        .tag ,.votes{
          display: none;
        }
        .fr {
          float: right;
          text-align: right;
        }
    `;
        return {
          content: res || "内容加载失败",
          originalUrl: "https://www.v2ex.com" + url,
          extraCss,
          showTitle: false,
        };
      }
    );
  }
);

// 打开虎扑新闻详情
export const openHupuUrl = vscode.commands.registerCommand(
  "hupu.openUrl",
  async (title: string, url: string) => {
    await openDetailView(
      title,
      () => getHupuDetail(url),
      (res) => {
        const extraCss = `
      p{
        font-size: 16px;
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
  font-size: 16px;
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

.index_bbs-thread-comp-container {
  position: relative;
  padding: 10px 14px;
  background: var(--vscode-button-secondaryBackground)
}
     
.todo-list{
  margin:0 10px;
}   
        div {
          color: var(--vscode-editor-foreground) !important;
        }
        .index_bbs-thread-comp img,.index_bbs-thread-comp video {
          max-width: 50%;
        }
    `;
        return {
          content: res || "内容加载失败",
          originalUrl: "https://bbs.hupu.com" + url,
          extraCss,
          showTitle: false,
        };
      }
    );
  }
);

// 打开nga新闻详情
export const openNgaUrl = vscode.commands.registerCommand(
  "nga.openUrl",
  async (title: string, url: string) => {
    await openDetailView(
      title,
      () => getNgaNewsDetail(url),
      (res) => {
        const extraCss = `
        p,span{
          font-size: 16px;
        }
        .c1{
          display:none;
        }
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
          padding: 12px 0;
          width:100%;
          border-bottom: 1px solid var(--vscode-button-secondaryBackground);
        }
        .postInfo{
          margin-right: 20px;
          width: 180px;
          flex-shrink: 0;
        }
        .c2{
          display:flex;
        }
        .posterinfo,.postrow span br,h3,.postbodysubtitle,.comment_c .postInfo,.small_colored_text_btn{
          display:none
        }
        #hightlight_for_0,#comment_for_0{
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
    `;
        return {
          content: res || "内容加载失败",
          originalUrl: "https://bbs.nga.cn" + url,
          extraCss,
        };
      }
    );
  }
);
