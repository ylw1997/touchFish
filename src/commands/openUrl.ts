/*
 * @Author: YangLiwei
 * @Date: 2022-05-19 12:00:43
 * @LastEditTime: 2026-03-18 14:03:30
 * @LastEditors: yangliwei 1280426581@qq.com
 * @FilePath: \touchfish\src\commands\openUrl.ts
 * @Description: +
 */
import * as vscode from "vscode";
import { ReadState } from "../core/readState";
import { BaseNewsProvider } from "../core/baseNewsProvider";
import ContextManager from "../utils/extensionContext";
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
    { retainContextWhenHidden: false, enableScripts: true },
  );
  panel.onDidDispose(() => (panel = null));
  panel.webview.onDidReceiveMessage(handleCommonMessages);
  return panel;
};

const handleCommonMessages = (message: any) => {
  if (message.command === "toggleShowImg") {
    vscode.workspace
      .getConfiguration("touchfish")
      .update("showImg", message.value, true);
  }
};

const BASE_CSS = `
  .news_detail { width: 75%; margin-left: 12.5%; padding-bottom: 60px; }
  * { color: var(--vscode-editor-foreground); font-family: 'Microsoft YaHei'; line-height: 1.8; }
  a { color: var(--vscode-textLink-foreground); }
  img,video { max-width: 100%; }
  pre,code { font-family: var(--vscode-editor-font-family, monospace); }
  .bottom-toolbar { position: fixed; bottom: 15px; right: 15px; display: flex; gap: 8px; z-index: 9999; background: var(--vscode-editor-background); padding: 6px 10px; border-radius: 4px; box-shadow: 0 1px 5px rgba(0,0,0,0.3); align-items: center; border: 1px solid var(--vscode-panel-border); }
  .toolbar-btn { background-color: var(--vscode-button-background); color: var(--vscode-button-foreground); border: 1px solid var(--vscode-button-border,transparent); padding: 4px 10px; border-radius: 3px; cursor: pointer; font-size: 12px; text-decoration: none; display: inline-flex; align-items: center; line-height: 1.2; }
  .toolbar-btn:hover { background-color: var(--vscode-button-hoverBackground); }
  .toolbar-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .toolbar-label { color: var(--vscode-editor-foreground); font-size: 12px; display: flex; align-items: center; gap: 4px; cursor: pointer; user-select: none; }
  .hide-images img, .hide-images video { display: none !important; }
  .hide-images img.force-show, .hide-images video.force-show { display: block !important; }
  .img-load-btn { display: none; margin: 10px 0; padding: 4px 12px; background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); border: 1px solid var(--vscode-button-border); border-radius: 3px; cursor: pointer; font-size: 12px; }
  .img-load-btn:hover { background: var(--vscode-button-secondaryHoverBackground); }
  .hide-images .img-load-btn { display: block; width: fit-content; margin: 10px auto; }
  .hide-images img.force-show + .img-load-btn, .hide-images video.force-show + .img-load-btn { display: none !important; }
`;

const createWebviewHtml = (
  title: string,
  content: string,
  originalUrl?: string,
  extraCss = "",
  extraHead = "",
  showTitle = true,
) => {
  const showImg = vscode.workspace
    .getConfiguration("touchfish")
    .get<boolean>("showImg", true);

  const toolbarHtml = `
    <div class="bottom-toolbar">
      <label class="toolbar-label">
        <input type="checkbox" id="showImgCb" ${showImg ? "checked" : ""} />
        显示图片
      </label>
      ${originalUrl ? `<a class="toolbar-btn" href="${originalUrl}">打开原文章</a>` : ""}
    </div>
  `;

  const titleHtml = showTitle
    ? `<h1 style="text-align:center" >${title}</h1>`
    : "";
  const safe = sanitizeHtml(content)
    .replace(/<img/g, '<img referrerpolicy="no-referrer"')
    .replace(/<video/g, '<video referrerpolicy="no-referrer"');

  return `<!DOCTYPE html><html lang="zh-cn">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <title>${title}</title>
      ${extraHead || ""}
      <style>${BASE_CSS}${extraCss}</style>
    </head>
    <body class="${showImg ? "" : "hide-images"}">
      ${titleHtml}
      <div class="news_detail">${safe}</div>
      ${toolbarHtml}
      <script>
        const vscode = acquireVsCodeApi();
        const cb = document.getElementById('showImgCb');
        if (cb) {
          cb.addEventListener('change', (e) => {
            const checked = e.target.checked;
            if (checked) {
              document.body.classList.remove('hide-images');
            } else {
              document.body.classList.add('hide-images');
            }
            vscode.postMessage({ command: 'toggleShowImg', value: checked });
          });
        }
        function initImages() {
          const imgs = document.querySelectorAll('.news_detail img, .news_detail video');
          imgs.forEach(img => {
            if (img.nextElementSibling && img.nextElementSibling.classList.contains('img-load-btn')) return;
            const btn = document.createElement('button');
            btn.className = 'img-load-btn';
            btn.innerText = '加载图片';
            btn.onclick = () => {
              img.classList.add('force-show');
              btn.style.display = 'none';
            };
            img.parentNode.insertBefore(btn, img.nextSibling);
          });
        }
        initImages();
      </script>
    </body></html>`;
};

const openDetailView = async (
  title: string,
  fetchData: () => Promise<any>,
  processData: (data: any) => ProcessResult,
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
      showTitle,
    );
  } catch (error) {
    console.error("[touchfish] detail fetch error", error);
    webviewPanel.webview.html = createWebviewHtml(title, "内容加载失败");
  }
};

// 通用注册器（未来新增来源时更容易）
const registerArticleCommand = (
  commandId: string,
  handler: (
    title: string,
    idOrUrl: any,
    uniqueId?: string,
  ) => Promise<ProcessResult>,
): vscode.Disposable => {
  return vscode.commands.registerCommand(
    commandId,
    async (title: string, idOrUrl: any, uniqueId?: string) => {
      await openDetailView(
        title,
        () => handler(title, idOrUrl, uniqueId),
        (r) => r,
      );
      // 标记已读并局部更新（不再全量刷新）
      if (uniqueId) {
        ReadState.markRead(ContextManager.context, uniqueId);
        BaseNewsProvider.markReadGlobally(uniqueId);
      }
    },
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
  },
);

// 打开chiphell新闻详情
export const openCHUrl = registerArticleCommand(
  "chiphell.openUrl",
  async (_title, url: string) => {
    const res = await getChipHellNewsDetail(url);
    return {
      content: res || "内容加载失败",
      originalUrl: url,
      extraCss: `.news_detail { font-size: 16px; }`,
    };
  },
);

// 打开v2ex新闻详情 - 支持分页
let v2exPanel: vscode.WebviewPanel | null = null;
let v2exState = {
  url: "",
  page: 1,
  title: "",
  totalPages: 1,
};

const loadV2exPage = async () => {
  if (!v2exPanel) return;
  v2exPanel.webview.html = "加载中...";

  const res = await getV2exDetail(v2exState.url, v2exState.page);

  // V2EX 每页100条回复，通过内容判断总页数（估算）
  // 这里简化处理，假设最多10页，实际应该从页面解析
  const replyCountMatch = res?.match(/(\d+)\s*条回复/);
  if (replyCountMatch) {
    const replyCount = parseInt(replyCountMatch[1], 10);
    v2exState.totalPages = Math.ceil(replyCount / 100) || 1;
  } else {
    // 如果没有回复数，检查是否有分页控件
    v2exState.totalPages = 1;
  }

  const extraCss = `
    .topic_content,.reply_content { font-size: 16px; }
    .cell { padding:10px 0; font-size:14px; line-height:150%; text-align:left; border-bottom:1px solid var(--vscode-textBlockQuote-border); }
    .tag,.votes { display:none; }
    .fr { float:right; text-align:right; }
    .pagination { position:fixed; bottom:15px; right:15px; display:flex; gap:6px; z-index:9999; background: var(--vscode-editor-background); padding: 5px; border-radius: 4px; box-shadow: 0 1px 5px rgba(0,0,0,0.3); }
    .page-btn { background-color: var(--vscode-button-background); color: var(--vscode-button-foreground); border: 1px solid var(--vscode-button-border,transparent); padding: 4px 10px; border-radius: 3px; cursor: pointer; font-size: 12px; }
    .page-btn:hover { background-color: var(--vscode-button-hoverBackground); }
    .page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .page-info { color: var(--vscode-editor-foreground); padding: 4px 8px; font-size: 12px; display: flex; align-items: center; }
  `;
  const content = res || "内容加载失败";
  const safe = sanitizeHtml(content)
    .replace(/<img/g, '<img referrerpolicy="no-referrer"')
    .replace(/<video/g, '<video referrerpolicy="no-referrer"');
  const originalUrl =
    "https://www.v2ex.com" +
    v2exState.url +
    (v2exState.page > 1 ? "?p=" + v2exState.page : "");

  const isLastPage = v2exState.page >= v2exState.totalPages;

  const showImg = vscode.workspace
    .getConfiguration("touchfish")
    .get<boolean>("showImg", true);

  v2exPanel.webview.html = `<!DOCTYPE html><html lang="zh-cn"><head><meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${v2exState.title}</title>
    <style>${BASE_CSS}${extraCss}</style></head>
    <body class="${showImg ? "" : "hide-images"}">
    <h1 style="text-align:center">${v2exState.title}</h1>
    <div class="news_detail">${safe}</div>
    <div class="bottom-toolbar">
      <label class="toolbar-label">
        <input type="checkbox" id="showImgCb" ${showImg ? "checked" : ""} />
        显示图片
      </label>
      <button class="toolbar-btn" id="prevBtn" ${v2exState.page <= 1 ? "disabled" : ""}>上一页</button>
      <span class="page-info">第 ${v2exState.page}${v2exState.totalPages > 1 ? "/" + v2exState.totalPages : ""} 页</span>
      <button class="toolbar-btn" id="nextBtn" ${isLastPage ? "disabled" : ""}>下一页</button>
      <a class="toolbar-btn" href="${originalUrl}">打开原文章</a>
    </div>
    <script>
      const vscode = acquireVsCodeApi();
      document.getElementById('prevBtn').addEventListener('click', () => {
        vscode.postMessage({ command: 'prevPage' });
      });
      document.getElementById('nextBtn').addEventListener('click', () => {
        vscode.postMessage({ command: 'nextPage' });
      });
      const cb = document.getElementById('showImgCb');
      if (cb) {
        cb.addEventListener('change', (e) => {
          const checked = e.target.checked;
          if (checked) {
            document.body.classList.remove('hide-images');
          } else {
            document.body.classList.add('hide-images');
          }
          vscode.postMessage({ command: 'toggleShowImg', value: checked });
        });
      }
      function initImages() {
        const imgs = document.querySelectorAll('.news_detail img, .news_detail video');
        imgs.forEach(img => {
          if (img.nextElementSibling && img.nextElementSibling.classList.contains('img-load-btn')) return;
          const btn = document.createElement('button');
          btn.className = 'img-load-btn';
          btn.innerText = '加载图片';
          btn.onclick = () => {
            img.classList.add('force-show');
            btn.style.display = 'none';
          };
          img.parentNode.insertBefore(btn, img.nextSibling);
        });
      }
      initImages();
    </script>
    </body></html>`;
};

export const openV2exUrl = vscode.commands.registerCommand(
  "v2ex.openUrl",
  async (title: string, url: string, uniqueId?: string) => {
    // 尝试从 URL 中解析 page 参数
    let initialPage = 1;
    const pageMatch = url.match(/[?&]p=(\d+)/);
    if (pageMatch) {
      initialPage = parseInt(pageMatch[1], 10) || 1;
    }

    // 更新状态
    v2exState = {
      url,
      page: initialPage,
      title,
      totalPages: 1,
    };

    // 创建专用的 V2EX panel（启用脚本）
    if (!v2exPanel) {
      v2exPanel = vscode.window.createWebviewPanel(
        "touchfish.v2exDetail",
        title,
        vscode.ViewColumn.One,
        { retainContextWhenHidden: true, enableScripts: true },
      );
      v2exPanel.onDidDispose(() => (v2exPanel = null));

      // 只在创建时注册一次消息处理器
      v2exPanel.webview.onDidReceiveMessage(async (message) => {
        handleCommonMessages(message);
        if (
          message.command === "nextPage" &&
          v2exState.page < v2exState.totalPages
        ) {
          v2exState.page++;
          await loadV2exPage();
        } else if (message.command === "prevPage" && v2exState.page > 1) {
          v2exState.page--;
          await loadV2exPage();
        }
      });
    } else {
      v2exPanel.title = title;
    }

    v2exPanel.reveal();
    await loadV2exPage();

    // 标记已读
    if (uniqueId) {
      ReadState.markRead(ContextManager.context, uniqueId);
      BaseNewsProvider.markReadGlobally(uniqueId);
    }
  },
);

// 打开虎扑新闻详情 - 支持分页
let hupuPanel: vscode.WebviewPanel | null = null;
let hupuState = {
  url: "",
  page: 1,
  title: "",
  totalPages: 1,
};

const loadHupuPage = async () => {
  if (!hupuPanel) return;
  hupuPanel.webview.html = "加载中...";

  const res = await getHupuDetail(hupuState.url, hupuState.page);

  // 解析总页数 - 查找分页链接中的最大页码
  // 格式: href="637854698-18.html" 或 href="637854698-2.html"
  const pageLinks = res?.match(/href="\d+-([0-9]+)\.html"/g);
  if (pageLinks && pageLinks.length > 0) {
    const pages = pageLinks.map((link) => {
      const match = link.match(/-(\d+)\.html/);
      return match ? parseInt(match[1], 10) : 1;
    });
    hupuState.totalPages = Math.max(...pages, 1);
  } else {
    // 如果没有找到分页链接，只有1页
    hupuState.totalPages = 1;
  }

  console.log(
    "[Hupu] Current page:",
    hupuState.page,
    "Total pages:",
    hupuState.totalPages,
  );

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
    .pagination { position:fixed; bottom:15px; right:15px; display:flex; gap:6px; z-index:9999; background: var(--vscode-editor-background); padding: 5px; border-radius: 4px; box-shadow: 0 1px 5px rgba(0,0,0,0.3); }
    .page-btn { background-color: var(--vscode-button-background); color: var(--vscode-button-foreground); border: 1px solid var(--vscode-button-border,transparent); padding: 4px 10px; border-radius: 3px; cursor: pointer; font-size: 12px; }
    .page-btn:hover { background-color: var(--vscode-button-hoverBackground); }
    .page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .page-info { color: var(--vscode-editor-foreground); padding: 4px 8px; font-size: 12px; display: flex; align-items: center; }
  `;
  const content = res || "内容加载失败";
  const safe = sanitizeHtml(content)
    .replace(/<img/g, '<img referrerpolicy="no-referrer"')
    .replace(/<video/g, '<video referrerpolicy="no-referrer"');

  // 构建原始 URL
  let originalUrl = "https://bbs.hupu.com" + hupuState.url;
  if (hupuState.page > 1) {
    // 替换 .html 为 -page.html
    originalUrl = originalUrl.replace(/\.html$/, `-${hupuState.page}.html`);
  }

  const isLastPage = hupuState.page >= hupuState.totalPages;

  const showImg = vscode.workspace
    .getConfiguration("touchfish")
    .get<boolean>("showImg", true);

  hupuPanel.webview.html = `<!DOCTYPE html><html lang="zh-cn"><head><meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${hupuState.title}</title>
    <style>${BASE_CSS}${extraCss}</style></head>
    <body class="${showImg ? "" : "hide-images"}">
    <div class="news_detail">${safe}</div>
    <div class="bottom-toolbar">
      <label class="toolbar-label">
        <input type="checkbox" id="showImgCb" ${showImg ? "checked" : ""} />
        显示图片
      </label>
      <button class="toolbar-btn" id="prevBtn" ${hupuState.page <= 1 ? "disabled" : ""}>上一页</button>
      <span class="page-info">第 ${hupuState.page}${hupuState.totalPages > 1 ? "/" + hupuState.totalPages : ""} 页</span>
      <button class="toolbar-btn" id="nextBtn" ${isLastPage ? "disabled" : ""}>下一页</button>
      <a class="toolbar-btn" href="${originalUrl}">打开原文章</a>
    </div>
    <script>
      const vscode = acquireVsCodeApi();
      document.getElementById('prevBtn').addEventListener('click', () => {
        vscode.postMessage({ command: 'prevPage' });
      });
      document.getElementById('nextBtn').addEventListener('click', () => {
        vscode.postMessage({ command: 'nextPage' });
      });
      const cb = document.getElementById('showImgCb');
      if (cb) {
        cb.addEventListener('change', (e) => {
          const checked = e.target.checked;
          if (checked) {
            document.body.classList.remove('hide-images');
          } else {
            document.body.classList.add('hide-images');
          }
          vscode.postMessage({ command: 'toggleShowImg', value: checked });
        });
      }
      function initImages() {
        const imgs = document.querySelectorAll('.news_detail img, .news_detail video');
        imgs.forEach(img => {
          if (img.nextElementSibling && img.nextElementSibling.classList.contains('img-load-btn')) return;
          const btn = document.createElement('button');
          btn.className = 'img-load-btn';
          btn.innerText = '加载图片';
          btn.onclick = () => {
            img.classList.add('force-show');
            btn.style.display = 'none';
          };
          img.parentNode.insertBefore(btn, img.nextSibling);
        });
      }
      initImages();
    </script>
    </body></html>`;
};

export const openHupuUrl = vscode.commands.registerCommand(
  "hupu.openUrl",
  async (title: string, url: string, uniqueId?: string) => {
    // 确保 URL 是相对路径格式（以 / 开头）
    if (!url.startsWith("/") && !url.startsWith("http")) {
      url = "/" + url;
    }

    // 移除 URL 中可能存在的页码，获取基础 URL
    const baseUrl = url.replace(/-\d+\.html$/, ".html");

    // 尝试从 URL 中解析 page 参数
    let initialPage = 1;
    const pageMatch = url.match(/-(\d+)\.html$/);
    if (pageMatch) {
      initialPage = parseInt(pageMatch[1], 10) || 1;
    }

    // 更新状态
    hupuState = {
      url: baseUrl,
      page: initialPage,
      title,
      totalPages: 1,
    };

    // 创建专用的虎扑 panel（启用脚本）
    if (!hupuPanel) {
      hupuPanel = vscode.window.createWebviewPanel(
        "touchfish.hupuDetail",
        title,
        vscode.ViewColumn.One,
        { retainContextWhenHidden: true, enableScripts: true },
      );
      hupuPanel.onDidDispose(() => (hupuPanel = null));

      // 只在创建时注册一次消息处理器
      hupuPanel.webview.onDidReceiveMessage(async (message) => {
        handleCommonMessages(message);
        if (
          message.command === "nextPage" &&
          hupuState.page < hupuState.totalPages
        ) {
          hupuState.page++;
          await loadHupuPage();
        } else if (message.command === "prevPage" && hupuState.page > 1) {
          hupuState.page--;
          await loadHupuPage();
        }
      });
    } else {
      hupuPanel.title = title;
    }

    hupuPanel.reveal();
    await loadHupuPage();

    // 标记已读
    if (uniqueId) {
      ReadState.markRead(ContextManager.context, uniqueId);
      BaseNewsProvider.markReadGlobally(uniqueId);
    }
  },
);

// 打开nga新闻详情
// 打开nga新闻详情 - 支持分页
let ngaPanel: vscode.WebviewPanel | null = null;
let ngaState = {
  url: "",
  page: 1,
  title: "",
  totalPages: 1,
  filtering: false,
  opAuthorId: 0,
};

const loadNgaPage = async () => {
  if (!ngaPanel) return;
  ngaPanel.webview.html = "加载中...";
  // 构建筛选参数
  let filterQuery: string | undefined;
  if (ngaState.filtering && ngaState.opAuthorId !== 0) {
    if (ngaState.opAuthorId > 0) {
      filterQuery = "&authorid=" + ngaState.opAuthorId;
    } else {
      filterQuery = "&pid=0&opt=512";
    }
  }

  const { html, totalPages, currentPage, authorUid } = await getNgaNewsDetail(
    ngaState.url,
    ngaState.page,
    filterQuery,
  );

  // 记录楼主 UID（包括负数/匿名）
  if (authorUid !== 0) {
    ngaState.opAuthorId = authorUid;
  }

  // 同步状态：如果返回了当前页，说明可能发生了重定向或初始加载
  if (currentPage > 0) {
    ngaState.page = currentPage;
  }
  ngaState.totalPages = totalPages;

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
    .pagination { position:fixed; bottom:15px; right:15px; display:flex; gap:6px; z-index:9999; background: var(--vscode-editor-background); padding: 5px; border-radius: 4px; box-shadow: 0 1px 5px rgba(0,0,0,0.3); }
    .page-btn { background-color: var(--vscode-button-background); color: var(--vscode-button-foreground); border: 1px solid var(--vscode-button-border,transparent); padding: 4px 10px; border-radius: 3px; cursor: pointer; font-size: 12px; }
    .page-btn:hover { background-color: var(--vscode-button-hoverBackground); }
    .page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .page-info { color: var(--vscode-editor-foreground); padding: 4px 8px; font-size: 12px; display: flex; align-items: center; }
  `;
  const content = html || "内容加载失败";
  const safe = sanitizeHtml(content)
    .replace(/<img/g, '<img referrerpolicy="no-referrer"')
    .replace(/<video/g, '<video referrerpolicy="no-referrer"');
  let originalUrl =
    "https://bbs.nga.cn" +
    ngaState.url +
    (ngaState.page > 1 ? "&page=" + ngaState.page : "");
  if (ngaState.filtering && filterQuery) {
    originalUrl += filterQuery;
  }

  const isLastPage = ngaState.page >= totalPages;
  const isFiltering = ngaState.filtering;
  const filterBtnText = isFiltering ? "查看全部" : "只看楼主";
  const filterBtnId = isFiltering ? "clearFilterBtn" : "filterAuthorBtn";

  const showImg = vscode.workspace
    .getConfiguration("touchfish")
    .get<boolean>("showImg", true);

  ngaPanel.webview.html = `<!DOCTYPE html><html lang="zh-cn"><head><meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${ngaState.title}</title>
    <style>${BASE_CSS}${extraCss}</style></head>
    <body class="${showImg ? "" : "hide-images"}">
    <h1 style="text-align:center">${ngaState.title}</h1>
    <div class="news_detail">${safe}</div>
    <div class="bottom-toolbar">
      <label class="toolbar-label">
        <input type="checkbox" id="showImgCb" ${showImg ? "checked" : ""} />
        显示图片
      </label>
      <button class="toolbar-btn" id="${filterBtnId}">${filterBtnText}</button>
      <button class="toolbar-btn" id="prevBtn" ${ngaState.page <= 1 ? "disabled" : ""}>上一页</button>
      <span class="page-info">第 ${ngaState.page}/${totalPages} 页</span>
      <button class="toolbar-btn" id="nextBtn" ${isLastPage ? "disabled" : ""}>下一页</button>
      <a class="toolbar-btn" href="${originalUrl}">打开原文章</a>
    </div>
    <script>
      const vscode = acquireVsCodeApi();
      document.getElementById('prevBtn').addEventListener('click', () => {
        vscode.postMessage({ command: 'prevPage' });
      });
      document.getElementById('nextBtn').addEventListener('click', () => {
        vscode.postMessage({ command: 'nextPage' });
      });
      const filterBtn = document.getElementById('filterAuthorBtn');
      const clearBtn = document.getElementById('clearFilterBtn');
      if (filterBtn) {
        filterBtn.addEventListener('click', () => {
          vscode.postMessage({ command: 'filterAuthor' });
        });
      }
      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          vscode.postMessage({ command: 'clearFilter' });
        });
      }
      const cb = document.getElementById('showImgCb');
      if (cb) {
        cb.addEventListener('change', (e) => {
          const checked = e.target.checked;
          if (checked) {
            document.body.classList.remove('hide-images');
          } else {
            document.body.classList.add('hide-images');
          }
          vscode.postMessage({ command: 'toggleShowImg', value: checked });
        });
      }
      function initImages() {
        const imgs = document.querySelectorAll('.news_detail img, .news_detail video');
        imgs.forEach(img => {
          if (img.nextElementSibling && img.nextElementSibling.classList.contains('img-load-btn')) return;
          const btn = document.createElement('button');
          btn.className = 'img-load-btn';
          btn.innerText = '加载图片';
          btn.onclick = () => {
            img.classList.add('force-show');
            btn.style.display = 'none';
          };
          img.parentNode.insertBefore(btn, img.nextSibling);
        });
      }
      initImages();
    </script>
    </body></html>`;
};

export const openNgaUrl = vscode.commands.registerCommand(
  "nga.openUrl",
  async (title: string, url: string, uniqueId?: string) => {
    // 处理配置 cookie 的特殊 item
    if (url === "configure_nga_cookie") {
      vscode.commands.executeCommand("touchfish.setNgaToken");
      return;
    }

    // 尝试从 URL 中解析 page 参数
    let initialPage = 1;
    const pageMatch = url.match(/[?&]page=(\d+)/);
    if (pageMatch) {
      initialPage = parseInt(pageMatch[1], 10) || 1;
    }

    // 更新状态
    ngaState = {
      url,
      page: initialPage,
      title,
      totalPages: 1,
      filtering: false,
      opAuthorId: 0,
    };

    // 创建专用的 NGA panel（启用脚本），只在首次创建时注册消息处理器
    if (!ngaPanel) {
      ngaPanel = vscode.window.createWebviewPanel(
        "touchfish.ngaDetail",
        title,
        vscode.ViewColumn.One,
        { retainContextWhenHidden: true, enableScripts: true },
      );
      ngaPanel.onDidDispose(() => (ngaPanel = null));

      // 只在创建时注册一次消息处理器
      ngaPanel.webview.onDidReceiveMessage(async (message) => {
        handleCommonMessages(message);
        if (
          message.command === "nextPage" &&
          ngaState.page < ngaState.totalPages
        ) {
          ngaState.page++;
          await loadNgaPage();
        } else if (message.command === "prevPage" && ngaState.page > 1) {
          ngaState.page--;
          await loadNgaPage();
        } else if (
          message.command === "filterAuthor" &&
          ngaState.opAuthorId !== 0
        ) {
          ngaState.filtering = true;
          ngaState.page = 1;
          await loadNgaPage();
        } else if (message.command === "clearFilter") {
          ngaState.filtering = false;
          ngaState.page = 1;
          await loadNgaPage();
        }
      });
    } else {
      ngaPanel.title = title;
    }

    ngaPanel.reveal();
    await loadNgaPage();

    // 标记已读
    if (uniqueId) {
      ReadState.markRead(ContextManager.context, uniqueId);
      BaseNewsProvider.markReadGlobally(uniqueId);
    }
  },
);

// 打开 Linux.do 话题详情
export const openLinuxDoUrl = registerArticleCommand(
  "linuxdo.openUrl",
  async (_title, url: string) => {
    // 处理配置 cookie 的特殊 item
    if (url === "configure_linuxdo_cookie") {
      vscode.commands.executeCommand("touchfish.setLinuxDoToken");
      return {
        content: "正在配置 LinuxDo Cookie，请关注顶部输入框...",
        extraCss: "",
      };
    }

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
      .no-replies {
        padding: 40px 20px;
        text-align: center;
        color: var(--vscode-descriptionForeground);
        font-size: 14px;
        opacity: 0.7;
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
  },
);
