/*
 * @Author: YangLiwei
 * @Date: 2022-05-19 12:00:43
 * @LastEditTime: 2025-11-10 16:50:47
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\src\commands\openUrl.ts
 * @Description: +
 */
import * as vscode from "vscode";
import { ReadState } from '../core/readState';
import { BaseNewsProvider } from '../core/baseNewsProvider';
import ContextManager from '../utils/extensionContext';
import { getChipHellNewsDetail } from "../api/chipHell";
import { getNewsDetail } from "../api/ithome";
import { getV2exDetail } from "../api/v2ex";
import { getHupuDetail } from "../api/hupu";
import { getNgaNewsDetail } from "../api/nga";

// -----------------------------------------------------------------------------
// 优化点概述
// 1. 抽取重复逻辑：创建面板 / 生成 HTML / 打开详情 的重复代码合并为通用函数
// 2. 提供 registerArticleCommand 工具以统一命令注册方式，简化新增来源成本
// 3. 增加最小化 HTML 清洗（去除 <script>），降低潜在安全风险
// 4. 统一基础样式，复用 + 允许扩展 extraCss / extraHead
// 5. 保留原有导出 (openUrl/openCHUrl/openV2exUrl/openHupuUrl/openNgaUrl) 以保持兼容
// 6. 加入 Type 描述提高可读性
// -----------------------------------------------------------------------------

interface ProcessResult {
  content: string;
  originalUrl?: string;
  extraCss?: string;
  extraHead?: string;
  showTitle?: boolean;
}

// 简单的内容清洗（保留基本结构，去除脚本）
const sanitizeHtml = (raw: string | undefined): string => {
  if (!raw) return "";
  return raw.replace(/<script[\s\S]*?<\/script>/gi, "");
};

// 单例 webview 面板（同一时间一个详情）
let panel: vscode.WebviewPanel | null = null;
const acquirePanel = (): vscode.WebviewPanel => {
  if (panel) return panel;
  panel = vscode.window.createWebviewPanel(
    "touchfish.newsDetail",
    "新闻",
    vscode.ViewColumn.One,
    { retainContextWhenHidden: false, enableScripts: false }
  );
  panel.onDidDispose(() => (panel = null));
  return panel;
};

const BASE_CSS = `
  .news_detail { width: 75%; margin-left: 12.5%; }
  * { color: var(--vscode-editor-foreground); font-family: 'Microsoft YaHei'; line-height: 1.8; }
  a { color: var(--vscode-textLink-foreground); }
  img,video { max-width: 100%; }
  pre,code { font-family: var(--vscode-editor-font-family, monospace); }
  .open-article-btn { position: absolute; font-size: 14px; right: 20px; top: 20px; background-color: var(--vscode-button-background); max-width: 300px; box-sizing: border-box; display: flex; width: 160px; padding: 4px 8px; border-radius: 4px; text-align: center; cursor: pointer; justify-content: center; align-items: center; border: 1px solid var(--vscode-button-border,transparent); line-height: 16px; text-decoration: none; color: var(--vscode-button-foreground); }
  .open-article-btn:hover { background-color: var(--vscode-button-hoverBackground); }
`;

const createWebviewHtml = (
  title: string,
  content: string,
  originalUrl?: string,
  extraCss = "",
  extraHead = "",
  showTitle = true
) => {
  const buttonHtml = originalUrl
    ? `<a class="open-article-btn" href="${originalUrl}" >打开原文章</a>`
    : "";
  const titleHtml = showTitle
    ? `<h1 style="text-align:center" >${title}</h1>`
    : "";
  const safe = sanitizeHtml(content)
    .replace(/<img/g, '<img referrerpolicy="no-referrer"')
    .replace(/<video/g, '<video referrerpolicy="no-referrer"');
  return `<!DOCTYPE html><html lang="zh-cn"><head><meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${title}</title>
    ${extraHead || ""}
    <style>${BASE_CSS}${extraCss}</style></head><body>${titleHtml}${buttonHtml}<div class="news_detail">${safe}</div></body></html>`;
};

const openDetailView = async (
  title: string,
  fetchData: () => Promise<any>,
  processData: (data: any) => ProcessResult
) => {
  const webviewPanel = acquirePanel();
  webviewPanel.title = title;
  webviewPanel.webview.html = "加载中...";
  webviewPanel.reveal();
  try {
    const data = await fetchData();
    const { content, originalUrl, extraCss, extraHead, showTitle } =
      processData(data);
    webviewPanel.webview.html = createWebviewHtml(
      title,
      content,
      originalUrl,
      extraCss,
      extraHead,
      showTitle
    );
  } catch (error) {
    console.error("[touchfish] detail fetch error", error);
    webviewPanel.webview.html = createWebviewHtml(title, "内容加载失败");
  }
};

// 通用注册器（未来新增来源时更容易）
const registerArticleCommand = (
  commandId: string,
  handler: (title: string, idOrUrl: any, uniqueId?: string) => Promise<ProcessResult>
): vscode.Disposable => {
  return vscode.commands.registerCommand(
    commandId,
    async (title: string, idOrUrl: any, uniqueId?: string) => {
      await openDetailView(
        title,
        () => handler(title, idOrUrl, uniqueId),
        (r) => r
      );
      // 标记已读并局部更新（不再全量刷新）
      if (uniqueId) {
        ReadState.markRead(ContextManager.context, uniqueId);
        BaseNewsProvider.markReadGlobally(uniqueId);
      }
    }
  );
};

/**
 * 打开之家新闻详情
 */
export const openUrl = registerArticleCommand(
  "itHome.openUrl",
  async (_title, id: number) => {
    const res = await getNewsDetail(id);
    const extraCss = `p { font-size: 16px; line-height: 1.9; }`;
    const extraHead =
      '<link rel="stylesheet" href="https://www.ithome.com/css/detail.min.css">';
    const content = res?.data?.detail;
    return { content: content || "内容加载失败", extraCss, extraHead };
  }
);

// 打开chiphell新闻详情
export const openCHUrl = registerArticleCommand(
  "chiphell.openUrl",
  async (_title, url: string) => {
    const res = await getChipHellNewsDetail(url);
    return {
      content: res || "内容加载失败",
      originalUrl: url,
      extraCss: `img{ max-width:60%; } .news_detail { font-size: 16px; }`,
    };
  }
);

// 打开v2ex新闻详情
export const openV2exUrl = registerArticleCommand(
  "v2ex.openUrl",
  async (_title, url: string) => {
    const res = await getV2exDetail(url);
    const extraCss = `
    .open-article-btn{ top:90px; }
    .topic_content,.reply_content { font-size: 16px; }
    .cell { padding:10px 0; font-size:14px; line-height:150%; text-align:left; border-bottom:1px solid var(--vscode-textBlockQuote-border); }
    .tag,.votes { display:none; }
    .fr { float:right; text-align:right; }
  `;
    return {
      content: res || "内容加载失败",
      originalUrl: "https://www.v2ex.com" + url,
      extraCss,
      showTitle: false,
    };
  }
);

// 打开虎扑新闻详情
export const openHupuUrl = registerArticleCommand(
  "hupu.openUrl",
  async (_title, url: string) => {
    const res = await getHupuDetail(url);
    const extraCss = `
      p{font-size:16px;}
      .post-user_post-user-comp{min-height:54px;display:flex;align-items:flex-start;}
      .post-user_post-user-comp-avatar-wrapper{flex:0 0 48px;margin-right:10px;border-radius:50%;}
      .post-user_post-user-comp-info{flex:1 1 auto;display:flex;align-items:flex-start;justify-content:space-around;flex-direction:column;font-weight:400;font-size:14px;}
      .post-user_post-user-comp-info-top{display:flex;align-items:center;}
      .post-user_post-user-comp-info-top-name{color:#4b8dc3;margin-right:8px;line-height:1;}
      .post-user_post-user-comp-info-bottom{line-height:1.5;}
      .post-user_post-user-comp-info-bottom-title{font-size:14px;}
      .post-user_post-user-comp-info-bottom-from{font-size:12px;color:#96999f;margin-left:7px;}
      .post-user_post-user-comp-info-bottom-link{color:#96999f;margin-left:7px;}
      .seo-dom,.index_bbs-post-web-quote-title-container,.post-wrapper_toggle-tool,.index_pagination,.index_br,.post-operate_post-operate-comp-wrapper{display:none;}
      .post-reply-list-user-info-top-time{margin:0 10px;}
      .post-reply-list-wrapper{padding:14px 0;border-bottom:1px solid var(--vscode-textBlockQuote-border);}
      .post-user_post-user-comp-info-top-tip{margin:0 8px;background:#d8d8d8;border-radius:9px;color:#191c22;font-size:12px;padding:1px 6px;cursor:default;}
      .post-wrapper_bbs-post-wrapper.post-wrapper_light{padding:0 14px;border:1px solid var(--vscode-scrollbar-shadow);box-sizing:border-box;background:var(--vscode-input-background);}
      .post-reply-list_post-reply-list-wrapper .post-reply-list .post-reply-list-container{display:flex;align-items:flex-start;justify-content:flex-start;}
      .post-reply-list_post-reply-list-wrapper .post-reply-list .reply-list-avatar-wrapper .avatar,.post-reply-list_post-reply-list-wrapper .post-reply-list .reply-list-avatar-wrapper .avatar-placeholder img{width:36px;height:36px;border-radius:50%;}
      .post-reply-list_post-reply-list-wrapper .post-reply-list .reply-list-avatar{flex:0 0 36px;width:36px;margin-right:10px;}
      .post-wrapper_bbs-post-wrapper-title{height:46px;line-height:46px;padding-left:19px;font-family:PingFangSC-Semibold;font-weight:700;font-size:16px;color:#191c22;position:relative;letter-spacing:0;display:flex;align-items:center;justify-content:flex-start;}
      .post-reply-list_post-reply-list-wrapper .post-reply-list .reply-list-content .post-reply-list-operate{font-family:PingFangSC-Regular;font-size:14px;color:#7b7e86;display:flex;align-items:center;justify-content:flex-start;margin-top:16px;margin-left:-10px;}
      .index_bbs-thread-comp-container{position:relative;padding:10px 14px;background:var(--vscode-button-secondaryBackground);}
      .todo-list{margin:0 10px;}
      .index_bbs-thread-comp img,.index_bbs-thread-comp video{max-width:50%;}
      div{color:var(--vscode-editor-foreground)!important;}
    `;
    return {
      content: res || "内容加载失败",
      originalUrl: "https://bbs.hupu.com" + url,
      extraCss,
      showTitle: false,
    };
  }
);

// 打开nga新闻详情
export const openNgaUrl = registerArticleCommand(
  "nga.openUrl",
  async (_title, url: string) => {
    const res = await getNgaNewsDetail(url);
    const extraCss = `
    p,span { font-size:16px; }
    .c1, .posterinfo, .postrow span br, h3, .postbodysubtitle, .comment_c .postInfo, .small_colored_text_btn { display:none; }
    img { max-height:600px; display:block; }
    #postcontent0 br { display:block !important; }
    #post1strow0 .c2 { flex-wrap:wrap; }
    .postbox { padding:12px 0; width:100%; border-bottom:1px solid var(--vscode-button-secondaryBackground); }
    .postInfo { margin-right:20px; width:180px; flex-shrink:0; }
    .c2 { display:flex; }
    #hightlight_for_0, #comment_for_0 { display:flex; flex-wrap:wrap; width:100%; }
    .comment_c { background: var(--vscode-list-inactiveSelectionBackground); padding:10px; margin:0 5px 5px 0; word-break: break-word; }
    .comment_c img { max-height:200px; }
    .comment_c .comment_c_1 { display:none; }
  `;
    return {
      content: res || "内容加载失败",
      originalUrl: "https://bbs.nga.cn" + url,
      extraCss,
    };
  }
);

// 打开 Linux.do 话题详情
export const openLinuxDoUrl = registerArticleCommand(
  "linuxdo.openUrl",
  async (_title, url: string) => {
    const { getNewsDetail } = await import("../api/linuxDo");
    const html = await getNewsDetail(url);
    
    const extraCss = `
      .news_detail {
        font-size: 16px;
      }
      /* 主标题区域 */
      .topic-header { 
        margin-bottom: 32px; 
        padding-bottom: 20px; 
        border-bottom: 1px solid var(--vscode-textBlockQuote-border);
      }
      .topic-header h1 { 
        margin: 0 0 12px 0; 
        font-size: 32px; 
        font-weight: 600; 
        line-height: 1.3;
        color: var(--vscode-editor-foreground);
      }
      .topic-meta { 
        display: flex; 
        gap: 16px; 
        color: var(--vscode-descriptionForeground); 
      }
      .category { 
        color: var(--vscode-textLink-foreground);
        font-weight: 500;
      }
      .reply-count {
        color: var(--vscode-descriptionForeground);
      }
      
      /* 主楼内容 */
      .main-post {
        padding: 24px;
        background: var(--vscode-editor-inactiveSelectionBackground);
        border-left: 3px solid var(--vscode-textLink-foreground);
      }
      .main-post-header {
        display: flex;
        gap: 12px;
        align-items: center;
        color: var(--vscode-descriptionForeground);
      }
      .main-post-content {
        line-height: 1.8;
        color: var(--vscode-editor-foreground);
      }
      
      /* 回复区域 */
      .replies-section {
        margin-top: 12px;
      }
      .replies-header {
        font-weight: 600;
        color: var(--vscode-editor-foreground);
        padding-bottom: 12px;
        border-bottom: 1px solid var(--vscode-textBlockQuote-border);
      }
      .reply-item { 
        padding: 10px 0;
        border-bottom: 1px solid var(--vscode-textBlockQuote-border);
      }
      .reply-item:last-child {
        border-bottom: none;
      }
      .reply-header { 
        display: flex; 
        gap: 12px;
        align-items: center;
        color: var(--vscode-descriptionForeground); 
      }
      .post-author { 
        font-weight: 600; 
        color: var(--vscode-textLink-foreground); 
      }
      .post-time {
        opacity: 0.7;
      }
      .post-floor { 
        margin-left: auto;
        opacity: 0.6;
        font-size: 12px;
      }
      .reply-content { 
        line-height: 1.8;
        color: var(--vscode-editor-foreground);
      }
      
      /* 通用内容样式 */
      .main-post-content p,
      .reply-content p { 
        margin: 10px 0; 
      }
      .main-post-content code,
      .reply-content code { 
        background: var(--vscode-textCodeBlock-background); 
        padding: 2px 5px; 
        border-radius: 2px; 
        font-family: var(--vscode-editor-font-family); 
      }
      .main-post-content a,
      .reply-content a { 
        color: var(--vscode-textLink-foreground); 
        text-decoration: none; 
      }
      .main-post-content a:hover,
      .reply-content a:hover { 
        text-decoration: underline; 
      }
    `;
    
    return {
      content: html || "内容加载失败",
      originalUrl: url,
      extraCss,
      showTitle: false,
    };
  }
);
