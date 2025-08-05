/*
 * @Author: YangLiwei
 * @Date: 2022-05-19 12:00:43
 * @LastEditTime: 2025-08-05 17:29:01
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\src\commands\openUrl.ts
 * @Description: +
 */
import * as vscode from 'vscode';
import { getChipHellNewsDetail } from '../api/chipHell';
import { getNewsDetail } from '../api/ithome';
import { getV2exDetail } from '../api/v2ex';
import { getHupuDetail } from '../api/hupu';
import { getNgaNewsDetail } from '../api/nga';
import { getZhihuComment, getZhihuNewsDetail } from '../api/zhihu';

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
    {     retainContextWhenHidden: true,
    enableScripts: true, }
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
          *{
        font-family:'Microsoft YaHei';}
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
          *{
        font-family:'Microsoft YaHei';}
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
        img{
          max-width: 60%;
        }
        .news_detail{
          width: 75%;
          margin-left: 12.5%;
        }
        * {
          color: var(--vscode-editor-foreground) !important;;
          font-size: 18px;
          line-height: 2;
          font-family:'Microsoft YaHei';
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
          font-family:'Microsoft YaHei';
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
*{
        font-family:'Microsoft YaHei';}
      </style>
    </head>
    <body>
      <a class="ngabtn" href="${"https://bbs.hupu.com" + url}" >打开原文章</a>
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
          font-family:'Microsoft YaHei';
        }
      </style>
    </head>
    <body>
      <h1 style="text-align:center" >${title}</h1>
      <a class="ngabtn" href="${"https://bbs.nga.cn" + url}" >打开原文章</a>
      <div class="news_detail">${res}</div>
    </body>
    </html>
  `;
  });
  panel!.title = title;
});

// // 打开zhihu新闻详情
export const openZhihuUrl = vscode.commands.registerCommand('zhihu.openUrl', async (title: string, url: string) => {
  // 如果没有创建过webview,则创建一个
  if (!isCreatePanel) {
    panel = createPanel();
  }
  panel!.webview.html = "加载中....";
  const res = await getZhihuNewsDetail(url);
  const resStr = res.map(item => {
    return `<article class="answer">
              <header class="author-info">
                <img class="avatar" src="${item.target.author.avatar_url}" alt="${item.target.author.name}'s avatar" loading="lazy">
                <div class="author-details">
                  <p class="author-name">${item.target.author.name}</p>
                  <p class="author-headline">${item.target.author.headline}</p>
                </div>
              </header>
              <div class="content">
                ${item.target.content}
              </div>
              <footer class="actions">
                <span class="vote-count">${item.target.voteup_count} 人赞同了该回答</span>
                <button class="comment-btn" data-answer-id="${item.target.id}">查看评论</button>
              </footer>
              <div class="comment-container" id="comment-container-${item.target.id}"></div>
            </article>
   `
  }).join("");

  const css = `
    :root {
      --vscode-editor-background: #1e1e1e;
      --vscode-editor-foreground: #d4d4d4;
      --vscode-button-background: #3a3d41;
      --vscode-button-hoverBackground: #4a4d51;
      --vscode-border-color: #2f323b;
    }
    .comment-btn {
      margin-left: 10px;
      padding: 5px 10px;
      border: 1px solid var(--vscode-button-background);
      background-color: var(--vscode-button-background);
      color: var(--vscode-editor-foreground);
      border-radius: 4px;
      cursor: pointer;
    }
    .comment-container {
      margin-top: 15px;
    }
    .comment-card {
      background: var(--vscode-input-background);
      border: 1px solid var(--vscode-border-color);
      border-radius: 6px;
      padding: 15px;
      margin-bottom: 10px;
      font-size: 16px;
    }
    .comment-header {
      display: flex;
      align-items: center;
      margin-bottom: 10px;
    }
    .comment-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      margin-right: 10px;
    }
    .comment-author-name {
      font-weight: bold;
    }
    .comment-content {
      line-height: 1.7;
    }
    .comment-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 10px;
      font-size: 16px;
      color: var(--vscode-editor-foreground);
      opacity: 0.6;
    }
    .comment-tags span {
      margin-right: 10px;
      background-color: var(--vscode-button-secondaryBackground);
      padding: 2px 6px;
      border-radius: 4px;
    }
    .child-comments {
      margin-top: 10px;
    }
    hr {
      border: 1px solid var(--vscode-border-color);
    }
    body.vscode-light {
      --vscode-editor-background: #fff;
      --vscode-editor-foreground: #000;
      --vscode-button-background: #f0f0f0;
      --vscode-button-hoverBackground: #e0e0e0;
      --vscode-border-color: #e1e1e1;
    }
    body {
      margin: 0;
      padding: 20px;
      background-color: var(--vscode-editor-background);
      color: var(--vscode-editor-foreground);
    }
    .container {
      padding: 0 200px;
      margin: 0 auto;
      max-width: 1000px;
    }
    .answer {
      margin-bottom: 30px;
      padding: 20px;
      background-color: var(--vscode-editor-background);
      border: 1px solid var(--vscode-border-color);
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .author-info {
      display: flex;
      align-items: center;
      margin-bottom: 15px;
    }
    .avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      margin-right: 15px;
    }
    .author-name {
      font-weight: bold;
      font-size: 16px;
      margin: 0;
    }
    .author-headline {
      font-size: 14px;
      color: var(--vscode-editor-foreground);
      opacity: 0.7;
      margin: 0;
    }
    .content {
      line-height: 1.8;
      font-size: 17px;
    }
    .content img {
      max-width: 80%;
      height: auto;
      border-radius: 4px;
      margin: 10px 0;
    }
    .actions {
      margin-top: 15px;
      font-size: 16px;
      color: var(--vscode-editor-foreground);
      opacity: 0.7;
    }
    .openBtn {
      display: inline-block;
      padding: 10px 15px;
      background-color: var(--vscode-button-background);
      color: var(--vscode-editor-foreground);
      text-decoration: none;
      border-radius: 4px;
      margin-bottom: 20px;
      transition: background-color 0.2s;
    }
    .openBtn:hover {
      background-color: var(--vscode-button-hoverBackground);
    }
  `;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>${css}</style>
    </head>
    <body>
      <div class="container">
        <h1>${title}</h1>
        <a class="openBtn" href="https://www.zhihu.com/question/${url}">打开原文章</a>
        ${resStr}
      </div>
      <script>
        const vscode = acquireVsCodeApi();
        document.querySelectorAll('.comment-btn').forEach(button => {
          button.addEventListener('click', event => {
            const answerId = event.target.dataset.answerId;
            vscode.postMessage({ command: 'getZhihuComment', answerId });
          });
        });

        window.addEventListener('message', event => {
          const message = event.data;
          if (message.command === 'showZhihuComments') {
            const container = document.getElementById('comment-container-' + message.answerId);
            if (!container) return;

            container.innerHTML = message.comments.map(function(comment) {
              const tags = comment.comment_tag.map(function(tag) {
                return '<span>' + tag.text + '</span>';
              }).join('');

              const childComments = comment.child_comments.map(function(child) {
                const tags = child.comment_tag.map(function(tag) {
                  return '<span>' + tag.text + '</span>';
                }).join('');
                return '<div class="comment-card">' + 
                         '<div class="comment-header">' + 
                           '<img class="comment-avatar" src="' + child.author.avatar_url + '" alt="' + child.author.name + '&apos;s avatar" loading="lazy">' + 
                           '<span class="comment-author-name">' + child.author.name + '</span>' + 
                         '</div>' + 
                         '<div class="comment-content">' + child.content + '</div>' + 
                         '<div class="comment-footer">' + 
                           '<div style="display: flex; align-items: center;">' + 
                            '<div class="comment-tags">' + tags + '</div>' + 
                            '<span>' + new Date(child.created_time * 1000).toLocaleString() + '</span>' + 
                           '</div>' + 
                           '<span>' + child.like_count + '赞同</span>' + 
                         '</div>' + 
                       '</div>';
              }).join('');

              return '<div class="comment-card">' + 
                       '<div class="comment-header">' + 
                         '<img class="comment-avatar" src="' + comment.author.avatar_url + '" alt="' + comment.author.name + '&apos;s avatar" loading="lazy">' + 
                         '<span class="comment-author-name">' + comment.author.name + '</span>' + 
                       '</div>' + 
                       '<div class="comment-content">' + comment.content + '</div>' + 
                       '<div class="comment-footer">' + 
                         '<div style="display: flex; align-items: center;" >' + 
                           '<div class="comment-tags">' + tags + '</div>' + 
                           '<span>' + new Date(comment.created_time * 1000).toLocaleString() + '</span>' + 
                         '</div>' + 
                         '<span>' + comment.like_count + '赞同</span>' + 
                       '</div>' + 
                       '<div class="child-comments">' + childComments + '</div>' + 
                     '</div>';
            }).join('');
          }
        });
      </script>
    </body>
    </html>
  `;

  panel!.webview.html = html;
  panel!.title = title;
  panel!.webview.onDidReceiveMessage(async message => {
    if (message.command === 'getZhihuComment') {
      const comments = await getZhihuComment(message.answerId);
      panel!.webview.postMessage({ command: 'showZhihuComments', comments, answerId: message.answerId });
    }
  });
});

