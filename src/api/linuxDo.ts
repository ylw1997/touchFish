/*
 * @Description: Linux.do RSS 新闻源
 */
import axios from "axios";
import * as vscode from "vscode";

/**
 * 生成通用请求头
 */
function getCommonHeaders(cookie: string, referer: string = "https://linux.do/latest") {
  return {
    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
    "cache-control": "max-age=0",
    "priority": "u=0, i",
    "sec-ch-ua": '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
    "sec-ch-ua-arch": '"x86"',
    "sec-ch-ua-bitness": '"64"',
    "sec-ch-ua-full-version": '"142.0.7444.134"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-model": '""',
    "sec-ch-ua-platform": '"Windows"',
    "sec-ch-ua-platform-version": '"19.0.0"',
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "same-origin",
    "sec-fetch-user": "?1",
    "upgrade-insecure-requests": "1",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
    "Cookie": cookie,
    "Referer": referer,
  };
}

/**
 * 简单的 RSS XML 解析器
 */
function parseRSS(xmlString: string): any[] {
  const items: any[] = [];
  
  // 使用正则表达式提取 item 标签
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let itemMatch;
  
  while ((itemMatch = itemRegex.exec(xmlString)) !== null) {
    const itemContent = itemMatch[1];
    
    // 提取各个字段
    const extractField = (fieldName: string) => {
      const pattern = new RegExp(`<${fieldName}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${fieldName}>|<${fieldName}[^>]*>([\\s\\S]*?)<\\/${fieldName}>`, "i");
      const match = itemContent.match(pattern);
      return match ? (match[1] || match[2] || "").trim() : "";
    };
    
    items.push({
      title: extractField("title"),
      url: extractField("link"),
      time: extractField("pubDate"),
      author: extractField("dc:creator"),
      category: extractField("category"),
      description: extractField("description"),
      guid: extractField("guid"),
    });
  }
  
  return items;
}

/**
 * 获取 Linux.do RSS 新闻列表
 */
export const getNewsList = async () => {
  const config = vscode.workspace.getConfiguration("touchfish");
  const cookie = config.get<string>("linuxDoCookie") || "";

  if (!cookie) {
    throw new Error(
      "访问 Linux.do 需要有效的 Cookie，请在设置中配置 touchfish.linuxDoCookie"
    );
  }

  try {
    const response = await axios.get("https://linux.do/latest.rss", {
      headers: getCommonHeaders(cookie),
      timeout: 15000,
      decompress: true,
      validateStatus: (status) => status < 500,
    });
    console.log("linux Request:", response);
    // 检查响应
    if (response.status === 403 || response.status === 401) {
      throw new Error(
        "Cookie 无效或已过期，请重新设置 touchfish.linuxDoCookie。提示：需要包含完整的 Cookie，包括 _t 等字段"
      );
    }

    if (typeof response.data !== 'string' || !response.data.includes('<?xml')) {
      throw new Error(
        "返回数据格式错误，可能是 Cookie 无效。请确保 Cookie 包含 _t 字段"
      );
    }

    // 解析 RSS XML
    const newsList = parseRSS(response.data);

    if (newsList.length === 0) {
      throw new Error("未能解析到任何内容，请检查 Cookie 是否正确");
    }

    return { data: newsList };
  } catch (error: any) {
    if (error.message?.includes("Cookie")) {
      throw error;
    }
    throw new Error(
      `访问 Linux.do 失败: ${error.message}。请检查网络连接和 Cookie 配置`
    );
  }
};

/**
 * 获取帖子详情（请求帖子的 RSS）
 */
export const getNewsDetail = async (url: string) => {
  const config = vscode.workspace.getConfiguration("touchfish");
  const cookie = config.get<string>("linuxDoCookie") || "";

  if (!cookie) {
    throw new Error(
      "访问 Linux.do 需要有效的 Cookie，请在设置中配置 touchfish.linuxDoCookie"
    );
  }

  try {
    // 将话题链接转换为 RSS 链接
    const rssUrl = url.endsWith(".rss") ? url : `${url}.rss`;
    
    const response = await axios.get(rssUrl, {
      headers: getCommonHeaders(cookie),
      timeout: 15000,
      decompress: true,
      validateStatus: (status) => status < 500,
    });

    if (response.status === 403 || response.status === 401) {
      throw new Error(
        "Cookie 无效或已过期，请重新设置 touchfish.linuxDoCookie"
      );
    }

    if (typeof response.data !== 'string' || !response.data.includes('<?xml')) {
      throw new Error(
        "返回数据格式错误，可能是 Cookie 无效"
      );
    }

    // 解析帖子详情 RSS
    const xmlString = response.data;
    
    // 提取 channel 信息
    const titleMatch = xmlString.match(/<title>([^<]+)<\/title>/);
    const descMatch = xmlString.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/);
    const categoryMatch = xmlString.match(/<category>([^<]+)<\/category>/);
    
    const title = titleMatch ? titleMatch[1] : "";
    const description = descMatch ? descMatch[1] : "";
    const category = categoryMatch ? categoryMatch[1] : "";
    
    // 解析所有回复
    const items = parseRSS(xmlString);
    
    // 构建 HTML
    let html = `
      <div class="topic-header">
        <h1>${title}</h1>
        <div class="topic-meta">
          <span class="category">${category}</span>
          <span class="reply-count">${items.length} 条回复</span>
        </div>
        <div class="topic-description">${description}</div>
      </div>
      <div class="topic-posts">
    `;
    
    items.forEach((item, index) => {
      html += `
        <div class="post-item">
          <div class="post-header">
            <span class="post-author">${item.author}</span>
            <span class="post-time">${item.time}</span>
            <span class="post-floor">#${items.length - index}</span>
          </div>
          <div class="post-content">${item.description}</div>
        </div>
      `;
    });
    
    html += `</div>`;
    
    return html;
  } catch (error: any) {
    if (error.response?.status === 403 || error.response?.status === 401) {
      throw new Error(
        "访问 Linux.do 需要有效的 Cookie，请在设置中配置 touchfish.linuxDoCookie"
      );
    }
    throw error;
  }
};
