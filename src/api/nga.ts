/*
 * @Author: YangLiwei
 * @Date: 2022-05-26 15:05:38
 * @LastEditTime: 2025-09-26 11:11:37
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\src\api\nga.ts
 * @Description: NGA API - 使用 XML 格式请求
 */
import axios from "axios";
import { NewsItem } from "../type/type";
import { TextDecoder } from "util";
import * as vscode from "vscode";
import { showInfo, showError } from "../utils/errorMessage";
import { uniqueNews } from "../utils/util";

export const getNgaCookie = () => {
  const config = vscode.workspace.getConfiguration("touchfish");
  const cookie = config.get("ngaCookie") as string | undefined;
  return cookie;
};

const BASE_URL = "https://bbs.nga.cn";

// NGA 表情映射表
const NGA_SMILEY_MAP: Record<string, Record<string, string>> = {
  ac: {
    "blink": "ac0.png",
    "goodjob": "ac1.png",
    "上": "ac2.png",
    "中枪": "ac3.png",
    "偷笑": "ac4.png",
    "冷": "ac5.png",
    "凌乱": "ac6.png",
    "反对": "ac7.png",
    "吓": "ac8.png",
    "吻": "ac9.png",
    "呆": "ac10.png",
    "咦": "ac11.png",
    "哦": "ac12.png",
    "哭": "ac13.png",
    "哭1": "ac14.png",
    "哭笑": "ac15.png",
    "哼": "ac16.png",
    "喘": "ac17.png",
    "喷": "ac18.png",
    "嘲笑": "ac19.png",
    "嘲笑1": "ac20.png",
    "囧": "ac21.png",
    "委屈": "ac22.png",
    "心": "ac23.png",
    "忧伤": "ac24.png",
    "怒": "ac25.png",
    "怕": "ac26.png",
    "惊": "ac27.png",
    "愁": "ac28.png",
    "抓狂": "ac29.png",
    "抠鼻": "ac30.png",
    "擦汗": "ac31.png",
    "无语": "ac32.png",
    "晕": "ac33.png",
    "汗": "ac34.png",
    "瞎": "ac35.png",
    "羞": "ac36.png",
    "羡慕": "ac37.png",
    "花痴": "ac38.png",
    "茶": "ac39.png",
    "衰": "ac40.png",
    "计划通": "ac41.png",
    "赞同": "ac42.png",
    "闪光": "ac43.png",
    "黑枪": "ac44.png",
  },
  a2: {
    "goodjob": "a2_02.png",
    "偷笑": "a2_03.png",
    "怒": "a2_04.png",
    "诶嘿": "a2_05.png",
    "笑": "a2_07.png",
    "那个…": "a2_08.png",
    "哦嗬嗬嗬": "a2_09.png",
    "舔": "a2_10.png",
    "有何贵干": "a2_11.png",
    "病娇": "a2_12.png",
    "lucky": "a2_13.png",
    "鬼脸": "a2_14.png",
    "大哭": "a2_15.png",
    "冷": "a2_16.png",
    "哭": "a2_17.png",
    "妮可妮可妮": "a2_18.png",
    "惊": "a2_19.png",
    "poi": "a2_20.png",
    "囧": "a2_22.png",
    "中枪": "a2_23.png",
    "你看看你": "a2_25.png",
    "yes": "a2_26.png",
    "doge": "a2_27.png",
    "自戳双目": "a2_28.png",
    "偷吃": "a2_30.png",
    "冷笑": "a2_31.png",
    "壁咚": "a2_32.png",
    "不活了": "a2_33.png",
    "不明觉厉": "a2_36.png",
    "jojo立": "a2_37.png",
    "jojo立2": "a2_38.png",
    "jojo立3": "a2_39.png",
    "jojo立5": "a2_40.png",
    "jojo立4": "a2_41.png",
    "威吓": "a2_42.png",
    "异议": "a2_47.png",
    "认真": "a2_48.png",
    "你这种人…": "a2_49.png",
    "是在下输了": "a2_51.png",
    "你为猴这么": "a2_53.png",
    "干杯": "a2_54.png",
    "干杯2": "a2_55.png",
    "抢镜头": "a2_57.png",
    "你已经死了": "a2_45.png",
  },
  ng: {
    "呲牙笑": "ng_1.png",
    "奸笑": "ng_2.png",
    "问号": "ng_3.png",
    "茶": "ng_4.png",
    "笑指": "ng_5.png",
    "燃尽": "ng_6.png",
    "晕": "ng_7.png",
    "扇笑": "ng_8.png",
    "寄": "ng_9.png",
    "别急": "ng_10.png",
    "doge": "ng_11.png",
    "丧": "ng_12.png",
    "汗": "ng_13.png",
    "叹气": "ng_15.png",
    "吃饼": "ng_16.png",
    "吃瓜": "ng_17.png",
    "吐舌": "ng_18.png",
    "哭": "ng_19.png",
    "喘": "ng_20.png",
    "心": "ng_21.png",
    "喷": "ng_22.png",
    "困": "ng_24.png",
    "大哭": "ng_25.png",
    "大惊": "ng_26.png",
    "害怕": "ng_27.png",
    "惊": "ng_28.png",
    "暴怒": "ng_30.png",
    "气愤": "ng_31.png",
    "热": "ng_32.png",
    "瓜不熟": "ng_33.png",
    "瞎": "ng_34.png",
    "色": "ng_35.png",
    "斜眼": "ng_37.png",
    "问号大": "ng_38.png",
  },
  pst: {
    "举手": "pt00.png",
    "亲": "pt01.png",
    "偷笑": "pt02.png",
    "偷笑2": "pt03.png",
    "偷笑3": "pt04.png",
    "傻眼": "pt05.png",
    "傻眼2": "pt06.png",
    "兔子": "pt07.png",
    "发光": "pt08.png",
    "呆": "pt09.png",
    "呆2": "pt10.png",
    "呆3": "pt11.png",
    "呕": "pt12.png",
    "呵欠": "pt13.png",
    "哭": "pt14.png",
    "哭2": "pt15.png",
    "哭3": "pt16.png",
    "嘲笑": "pt17.png",
    "基": "pt18.png",
    "宅": "pt19.png",
    "安慰": "pt20.png",
    "幸福": "pt21.png",
    "开心": "pt22.png",
    "开心2": "pt23.png",
    "开心3": "pt24.png",
    "怀疑": "pt25.png",
    "怒": "pt26.png",
    "怒2": "pt27.png",
    "怨": "pt28.png",
    "惊吓": "pt29.png",
    "惊吓2": "pt30.png",
    "惊呆": "pt31.png",
    "惊呆2": "pt32.png",
    "惊呆3": "pt33.png",
    "惨": "pt34.png",
    "斜眼": "pt35.png",
    "晕": "pt36.png",
    "汗": "pt37.png",
    "泪": "pt38.png",
    "泪2": "pt39.png",
    "泪3": "pt40.png",
    "泪4": "pt41.png",
    "满足": "pt42.png",
    "满足2": "pt43.png",
    "火星": "pt44.png",
    "牙疼": "pt45.png",
    "电击": "pt46.png",
    "看戏": "pt47.png",
    "眼袋": "pt48.png",
    "眼镜": "pt49.png",
    "笑而不语": "pt50.png",
    "紧张": "pt51.png",
    "美味": "pt52.png",
    "背": "pt53.png",
    "脸红": "pt54.png",
    "脸红2": "pt55.png",
    "腐": "pt56.png",
    "星星眼": "pt57.png",
    "谢": "pt58.png",
    "醉": "pt59.png",
    "闷": "pt60.png",
    "闷2": "pt61.png",
    "音乐": "pt62.png",
    "黑脸": "pt63.png",
    "鼻血": "pt64.png",
  },
  dt: {
    "ROLL": "dt01.png",
    "上": "dt02.png",
    "傲娇": "dt03.png",
    "叉出去": "dt04.png",
    "发光": "dt05.png",
    "呵欠": "dt06.png",
    "哭": "dt07.png",
    "啃古头": "dt08.png",
    "嘲笑": "dt09.png",
    "心": "dt10.png",
    "怒": "dt11.png",
    "怒2": "dt12.png",
    "怨": "dt13.png",
    "惊": "dt14.png",
    "惊2": "dt15.png",
    "无语": "dt16.png",
    "星星眼": "dt17.png",
    "星星眼2": "dt18.png",
    "晕": "dt19.png",
    "注意": "dt20.png",
    "注意2": "dt21.png",
    "泪": "dt22.png",
    "泪2": "dt23.png",
    "烧": "dt24.png",
    "笑": "dt25.png",
    "笑2": "dt26.png",
    "笑3": "dt27.png",
    "脸红": "dt28.png",
    "药": "dt29.png",
    "衰": "dt30.png",
    "鄙视": "dt31.png",
    "闲": "dt32.png",
    "黑脸": "dt33.png",
  },
  pg: {
    "战力": "pg01.png",
    "哈啤": "pg02.png",
    "满分": "pg03.png",
    "衰": "pg04.png",
    "拒绝": "pg05.png",
    "心": "pg06.png",
    "严肃": "pg07.png",
    "吃瓜": "pg08.png",
    "嘣": "pg09.png",
    "嘣2": "pg10.png",
    "冻": "pg11.png",
    "谢": "pg12.png",
    "哭": "pg13.png",
    "响指": "pg14.png",
    "转身": "pg15.png",
  },
};

const NGA_HEADERS = {
  "User-Agent": "Nga_Official/80024(Android12)",
  Referer: BASE_URL,
};

// 解析 XML 响应（NGA 使用 GB18030 编码）
const parseXmlResponse = (data: Buffer): any => {
  try {
    // 尝试 GBK 解码
    const text = new TextDecoder("gbk").decode(data);
    // 手动解析 XML
    return parseXmlManually(text);
  } catch (err) {
    console.error("[NGA] parseXmlResponse error:", err);
    return null;
  }
};

// 快速提取 XML 段落 - 使用字符串方法而非正则
const extractXmlSection = (xml: string, tag: string): string | null => {
  const startTag = `<${tag}>`;
  const endTag = `</${tag}>`;
  const startIdx = xml.indexOf(startTag);
  if (startIdx === -1) return null;
  const endIdx = xml.indexOf(endTag, startIdx);
  if (endIdx === -1) {
    // 如果没有找到结束标签，返回从开始标签到字符串末尾的内容
    // 这可以处理不完整的 XML 数据
    return xml.substring(startIdx + startTag.length);
  }
  return xml.substring(startIdx + startTag.length, endIdx);
};

// 手动解析 NGA XML 格式 - 使用简单快速的字符串方法
const parseXmlManually = (xml: string): any => {
  const result: any = { root: {} };
  
  // 提取 __T 帖子列表 - 需要区分列表页和详情页格式
  const tSection = extractXmlSection(xml, '__T');
  console.log("[NGA] __T section found:", tSection ? "yes" : "no", "length:", tSection?.length || 0);
  if (tSection) {
    // 检查是否以 <item> 开头（列表页格式：多个帖子）
    // 注意：详情页的 __T 可能内部包含 <item>（如 attachs），但不会以 <item> 开头
    const trimmedSection = tSection.trim();
    if (trimmedSection.startsWith('<item>')) {
      console.log("[NGA] __T starts with <item> - list format");
      result.root.__T = { item: parseXmlItemsFast(tSection) };
    } else {
      // 详情页格式：__T 直接包含帖子字段，解析为单个对象
      console.log("[NGA] __T does not start with <item> - detail format, parsing directly");
      const parsedItem = parseXmlItemFast(tSection);
      console.log("[NGA] parsed __T item:", parsedItem);
      result.root.__T = { item: [parsedItem] };
    }
  }
  
  // 提取 __R 回复列表
  const rSection = extractXmlSection(xml, '__R');
  if (rSection) {
    result.root.__R = { item: parseXmlItemsFast(rSection) };
  }
  
  // 提取 __U 用户列表
  const uSection = extractXmlSection(xml, '__U');
  if (uSection) {
    result.root.__U = { item: parseXmlItemsFast(uSection) };
  }
  
  // 提取 __ROWS 总数
  const rowsMatch = xml.match(/<__ROWS>(\d+)<\/__ROWS>/);
  if (rowsMatch) {
    result.root.__ROWS = parseInt(rowsMatch[1], 10);
  }
  
  // 提取 __R__ROWS_PAGE 每页数
  const rowsPageMatch = xml.match(/<__R__ROWS_PAGE>(\d+)<\/__R__ROWS_PAGE>/);
  if (rowsPageMatch) {
    result.root.__R__ROWS_PAGE = parseInt(rowsPageMatch[1], 10);
  }
  
  // 提取 __PAGE 当前页
  const pageMatch = xml.match(/<__PAGE>(\d+)<\/__PAGE>/);
  if (pageMatch) {
    result.root.__PAGE = parseInt(pageMatch[1], 10);
  }
  
  return result;
};

// 快速解析 XML item 列表 - 正确处理嵌套
const parseXmlItemsFast = (xml: string): any[] => {
  const items: any[] = [];
  
  // 使用深度计数来正确处理嵌套的 item
  let pos = 0;
  while (true) {
    const startIdx = xml.indexOf('<item>', pos);
    if (startIdx === -1) break;
    
    // 找到对应的 </item>，考虑嵌套
    let endIdx = startIdx + 6; // 6 = '<item>'.length
    let depth = 1;
    
    while (endIdx < xml.length && depth > 0) {
      const nextStart = xml.indexOf('<item>', endIdx);
      const nextEnd = xml.indexOf('</item>', endIdx);
      
      if (nextEnd === -1) break; // 没有找到结束标签
      
      if (nextStart !== -1 && nextStart < nextEnd) {
        // 找到了嵌套的开始标签
        depth++;
        endIdx = nextStart + 6;
      } else {
        // 找到了结束标签
        depth--;
        if (depth === 0) {
          endIdx = nextEnd;
        } else {
          endIdx = nextEnd + 7; // 7 = '</item>'.length
        }
      }
    }
    
    if (depth === 0 && endIdx > startIdx + 6) {
      const itemXml = xml.substring(startIdx + 6, endIdx);
      const item = parseXmlItemFast(itemXml);
      if (Object.keys(item).length > 0) {
        items.push(item);
      }
    }
    
    // 移动到下一个位置
    pos = endIdx + 7;
  }
  
  return items;
};

// 快速解析单个 XML item
const parseXmlItemFast = (xml: string): any => {
  const item: any = {};
  
  // 使用简单的字符串查找，避免正则
  const tags = ['tid', 'fid', 'authorid', 'author', 'subject', 'postdate', 'postdatestr', 'lastpost', 
                'replies', 'floor', 'lou', 'pid', 'content', 'uid', 'username', 'avatar', 
                'rvrc', 'credit', 'medal', 'groupid', 'memberid', 'regdate', 'postnum',
                'money', 'signature', 'nickname', 'tpcurl', 'quote_from', 'type',
                'topic_misc', 'icon', 'lastposter', 'lastmodify', 'recommend', 'jdata'];
  
  for (const tag of tags) {
    const startTag = `<${tag}>`;
    const endTag = `</${tag}>`;
    const startIdx = xml.indexOf(startTag);
    if (startIdx !== -1) {
      // 找到对应的结束标签 - 需要处理嵌套标签的情况
      let endIdx = startIdx + startTag.length;
      let depth = 1;
      while (endIdx < xml.length && depth > 0) {
        const nextStart = xml.indexOf(`<${tag}>`, endIdx);
        const nextEnd = xml.indexOf(`</${tag}>`, endIdx);
        
        if (nextEnd === -1) break; // 没有找到结束标签
        
        if (nextStart !== -1 && nextStart < nextEnd) {
          // 找到了嵌套的开始标签
          depth++;
          endIdx = nextStart + startTag.length;
        } else {
          // 找到了结束标签
          depth--;
          if (depth === 0) {
            endIdx = nextEnd;
          } else {
            endIdx = nextEnd + endTag.length;
          }
        }
      }
      
      if (endIdx > startIdx + startTag.length) {
        let value = xml.substring(startIdx + startTag.length, endIdx);
        // 处理 CDATA - 更灵活的方式
        if (value.includes('<![CDATA[') && value.includes(']]>')) {
          const cdataStart = value.indexOf('<![CDATA[');
          const cdataEnd = value.indexOf(']]>', cdataStart);
          if (cdataStart !== -1 && cdataEnd !== -1) {
            value = value.substring(cdataStart + 9, cdataEnd);
          }
        }
        // 解码 HTML 实体
        item[tag] = decodeHtmlEntities(value);
      }
    }
  }
  
  return item;
};

// 解码 HTML 实体
const decodeHtmlEntities = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x2F;/g, '/')
    .replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec));
};

// 获取新闻列表 - 使用 XML API
export const getNgaList = async (tab?: string) => {
  const resArr: NewsItem[] = [];
  try {
    const cookie = getNgaCookie();
    if (!cookie) {
      return [
        {
          title: "NGA Cookie 未配置 (点击配置)",
          url: "configure_nga_cookie",
        },
      ];
    }

    // 使用 thread.php + lite=xml 获取帖子列表
    const fid = tab || "-7"; // 默认版块
    const url = `${BASE_URL}/thread.php?fid=${fid}&page=1&lite=xml`;

    const res = await axios.get(url, {
      headers: {
        Cookie: cookie,
        ...NGA_HEADERS,
      },
      responseType: "arraybuffer",
    });

    const xmlData = parseXmlResponse(res.data);
    const root = xmlData?.root;

    if (!root || !root.__T) {
      showInfo("NGA 数据解析失败，请刷新列表重试！");
      return resArr;
    }

    // __T 是帖子列表
    const topics = root.__T?.item || [];

    for (const topic of topics) {
      const tid = topic.tid?.toString() || "";
      const subject = topic.subject || "";
      const replies = topic.replies?.toString() || "0";
      const tpcurl = topic.tpcurl || `/read.php?tid=${tid}`;

      if (tid && subject) {
        // 构建显示标题：标题 + 回复数
        const displayTitle = `[${replies}] ${subject}`;
        resArr.push({
          title: displayTitle,
          url: tpcurl,
        });
      }
    }

    return resArr;
  } catch (err: any) {
    console.error("[NGA] getNgaList error:", err);
    showInfo("NGA 加载失败，请刷新列表重试！");
  }
  return uniqueNews(resArr);
};

// 获取 NGA 文章详情 - 使用 XML API
export const getNgaNewsDetail = async (
  url: string,
  page?: number,
  filterQuery?: string,
): Promise<{
  html: string | null;
  totalPages: number;
  currentPage: number;
  authorUid: number;
}> => {
  try {
    const cookie = getNgaCookie();
    if (!cookie) {
      return { html: null, totalPages: 1, currentPage: 1, authorUid: 0 };
    }

    // 解析 URL 获取 tid
    let tid = "";
    const tidMatch = url.match(/tid=(\d+)/);
    if (tidMatch) {
      tid = tidMatch[1];
    } else if (url.match(/read\.php/)) {
      // 如果是 read.php 格式，尝试从 URL 中提取
      const parts = url.split("/");
      const lastPart = parts[parts.length - 1];
      if (lastPart.match(/^\d+/)) {
        tid = lastPart;
      }
    }

    if (!tid) {
      showError("无法解析帖子 ID");
      return { html: null, totalPages: 1, currentPage: 1, authorUid: 0 };
    }

    // 构建 API URL
    let apiUrl = `${BASE_URL}/read.php?tid=${tid}&lite=xml`;
    if (page && page > 1) {
      apiUrl += `&page=${page}`;
    }
    if (filterQuery) {
      apiUrl += filterQuery;
    }

    console.log("[NGA] Fetching detail:", apiUrl);

    const res = await axios.get(apiUrl, {
      headers: {
        Cookie: cookie,
        ...NGA_HEADERS,
      },
      responseType: "arraybuffer",
      timeout: 30000, // 30秒超时
      maxContentLength: 50 * 1024 * 1024, // 50MB 最大响应大小
    });

    const xmlData = parseXmlResponse(res.data);
    const root = xmlData?.root;

    if (!root) {
      showError("NGA 详情数据解析失败");
      return { html: null, totalPages: 1, currentPage: 1, authorUid: 0 };
    }

    // 解析用户信息 __U
    const users: Map<string, any> = new Map();
    const userList = root.__U?.item || [];
    for (const user of userList) {
      const uid = user.uid?.toString();
      if (uid) {
        users.set(uid, {
          username: user.username || "",
          avatar: user.avatar || "",
          rvrc: user.rvrc || 0,
        });
      }
    }

    // 解析帖子元信息 __T - __T.item 是数组，取第一个元素
    const topicInfoArray = root.__T?.item || [];
    const topicInfo = Array.isArray(topicInfoArray) ? topicInfoArray[0] || {} : topicInfoArray;
    const authorUid = parseInt(topicInfo.authorid?.toString() || "0", 10);
    console.log("[NGA] topicInfoArray:", topicInfoArray, "isArray:", Array.isArray(topicInfoArray));
    console.log("[NGA] topicInfo:", topicInfo, "authorUid:", authorUid);

    // 解析回复列表 __R
    const replies = root.__R?.item || [];

    // 解析分页信息
    // __ROWS 是总回复数，__R__ROWS_PAGE 是每页显示数
    const totalRows = parseInt(root.__ROWS?.toString() || root.__R__ROWS?.toString() || "0", 10);
    const rowsPerPage = parseInt(root.__R__ROWS_PAGE?.toString() || "20", 10);
    const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
    const currentPage = page || 1;

    console.log("[NGA] totalPages:", totalPages, "currentPage:", currentPage, "replies:", replies.length);

    // 构建 HTML 内容
    // 添加 CSS 样式 - 根据主题自动调整表情颜色
    let htmlContent = `
<style>
  .nga-smiley {
    width: 40px;
    height: 40px;
    vertical-align: middle;
    display: inline-block;
    margin: 0 5px;
  }
  /* 深色主题下反转颜色 */
  body[data-vscode-theme-kind="vscode-dark"] .nga-smiley,
  body[data-vscode-theme-kind="vscode-high-contrast"] .nga-smiley {
    filter: brightness(0) invert(1);
  }
</style>
`;

    // 添加回复
    for (const reply of replies) {
      // NGA 使用 lou 字段表示楼层，从 0 开始
      const lou = parseInt(reply.lou?.toString() || "0", 10);
      const floor = lou + 1; // 转换为 1-based 楼层号
      const pid = reply.pid?.toString() || "";
      const content = reply.content?.toString() || "";
      const postUid = reply.authorid?.toString() || "0";
      
      // 处理匿名用户 - authorid 为 -1 或负数表示匿名
      let user;
      if (postUid === "-1" || postUid.startsWith("-")) {
        // 匿名用户，使用回复中的 author 字段或显示为匿名
        user = { username: reply.author?.toString() || "匿名", avatar: "" };
      } else {
        user = users.get(postUid) || { username: reply.author?.toString() || "匿名", avatar: "" };
      }

      // 处理 NGA 特殊格式
      const processedContent = processNgaContent(content);

      // 构建楼层标签 - 使用 #楼层号
      const floorLabel = `#${floor}`;
      
      // 处理时间 - postdate 已经是格式化好的字符串如 "2026-05-09 12:45"
      const timeStr = reply.postdate?.toString() || "";

      htmlContent += `
        <div class="postbox" id="post_${pid}" style="margin: 16px 0; padding: 16px; background: var(--vscode-editor-background); border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <div class="postHeader" style="display: flex; align-items: center; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px solid var(--vscode-panel-border);">
            <span class="floor" style="background: var(--vscode-badge-background); color: var(--vscode-badge-foreground); padding: 2px 8px; border-radius: 4px; font-size: 11px; margin-right: 12px;">${floorLabel}</span>
            <span class="author" style="font-weight: 600; color: var(--vscode-textLink-foreground); margin-right: 12px; font-size: 15px;">${user.username}</span>
            <span class="time" style="color: var(--vscode-descriptionForeground); font-size: 12px;">${timeStr}</span>
          </div>
          <div class="postContent" style="line-height: 1.8; color: var(--vscode-editor-foreground); font-size: 15px;">
            ${processedContent}
          </div>
        </div>
      `;
    }

    return { html: htmlContent, totalPages, currentPage, authorUid };
  } catch (err: any) {
    console.error("[NGA] getNgaNewsDetail error:", err);
    showError("获取 NGA 新闻详情失败");
    return { html: null, totalPages: 1, currentPage: 1, authorUid: 0 };
  }
};

// 处理 NGA 内容格式
const processNgaContent = (content: string): string => {
  if (!content) return "";

  let processed = content;

  // 处理 [img] 标签 - 支持多种格式
  // 格式1: [img]./mon_2023/01/01/xxx.jpg[/img] - 附件图片
  // 格式2: [img].u/xxx.png[/img] - 用户上传图片
  // 格式3: [img]https://...[/img] - 完整URL
  // 格式4: [img]http://...[/img] - HTTP URL
  // 格式5: [img]//...[/img] - 协议相对URL
  // 使用更宽松的正则来匹配图片路径
  processed = processed.replace(
    /\[img\]\.\/(.+?)\[\/img\]/gi,
    '<img src="https://img.nga.178.com/attachments/$1" style="max-width:100%;height:auto;display:block;margin:10px 0;" referrerpolicy="no-referrer" />'
  );
  processed = processed.replace(
    /\[img\]\.u\/(.+?)\[\/img\]/gi,
    '<img src="https://img.nga.178.com/attachments/u/$1" style="max-width:100%;height:auto;display:block;margin:10px 0;" referrerpolicy="no-referrer" />'
  );
  processed = processed.replace(
    /\[img\](https?:\/\/.+?)\[\/img\]/gi,
    '<img src="$1" style="max-width:100%;height:auto;display:block;margin:10px 0;" referrerpolicy="no-referrer" />'
  );
  processed = processed.replace(
    /\[img\]\/\/(.+?)\[\/img\]/gi,
    '<img src="https://$1" style="max-width:100%;height:auto;display:block;margin:10px 0;" referrerpolicy="no-referrer" />'
  );

  // 处理 [url] 标签
  processed = processed.replace(
    /\[url=(.*?)\](.*?)\[\/url\]/gi,
    '<a href="$1" target="_blank" style="color:var(--vscode-textLink-foreground);text-decoration:none;">$2</a>'
  );
  processed = processed.replace(
    /\[url\](.*?)\[\/url\]/gi,
    '<a href="$1" target="_blank" style="color:var(--vscode-textLink-foreground);text-decoration:none;">$1</a>'
  );

  // 处理 [uid] 用户链接 - 格式: [uid=123]用户名[/uid]
  processed = processed.replace(
    /\[uid=(\d+)\](.*?)\[\/uid\]/gi,
    '<a href="https://bbs.nga.cn/nuke.php?func=ucp&uid=$1" target="_blank" style="color:var(--vscode-textLink-foreground);font-weight:600;">$2</a>'
  );

  // 处理 [quote] 引用
  processed = processed.replace(/\[quote\]/gi, '<div class="comment_c" style="background:var(--vscode-textBlockQuote-background);padding:10px;margin:10px 0;border-left:3px solid var(--vscode-textBlockQuote-border);">');
  processed = processed.replace(/\[\/quote\]/gi, "</div>");

  // 处理 [b] 粗体
  processed = processed.replace(/\[b\](.*?)\[\/b\]/gi, "<strong>$1</strong>");

  // 处理 [color] 颜色
  processed = processed.replace(
    /\[color=(.*?)\](.*?)\[\/color\]/gi,
    '<span style="color:$1">$2</span>'
  );

  // 处理 [size] 字号
  processed = processed.replace(
    /\[size=(.*?)\](.*?)\[\/size\]/gi,
    '<span style="font-size:$1px">$2</span>'
  );

  // 处理表情 [s:xxx] - NGA 表情
  // 格式: [s:ac:怒] -> https://img4.nga.178.com/ngabbs/post/smile/ac25.png
  processed = processed.replace(
    /\[s:([a-zA-Z0-9]+):([^\]]+)\]/gi,
    (match, type, name) => {
      const smileyMap = NGA_SMILEY_MAP[type.toLowerCase()];
      if (smileyMap && smileyMap[name]) {
        return `<img src="https://img4.nga.178.com/ngabbs/post/smile/${smileyMap[name]}" class="nga-smiley" referrerpolicy="no-referrer" />`;
      }
      // 如果找不到映射，返回原始文本
      return match;
    }
  );
  
  // 处理数字表情 [s:数字]
  processed = processed.replace(
    /\[s:(\d+)\]/gi,
    '<img src="https://img4.nga.178.com/ngabbs/post/smile/$1.gif" class="nga-smiley" referrerpolicy="no-referrer" />'
  );

  // 处理 [pid] 引用
  processed = processed.replace(/\[pid=(.*?)\](.*?)\[\/pid\]/gi, "");
  processed = processed.replace(/\[tid=(.*?)\](.*?)\[\/tid\]/gi, "");

  // 处理换行
  processed = processed.replace(/\n/g, "<br />");

  // 处理 [align] 对齐
  processed = processed.replace(
    /\[align=(.*?)\](.*?)\[\/align\]/gi,
    '<div style="text-align:$1">$2</div>'
  );

  // 处理 [collapse] 折叠
  processed = processed.replace(
    /\[collapse=(.*?)\](.*?)\[\/collapse\]/gi,
    '<details style="margin:10px 0;"><summary style="cursor:pointer;color:var(--vscode-textLink-foreground);">$1</summary><div style="padding:10px;background:var(--vscode-textBlockQuote-background);">$2</div></details>'
  );
  processed = processed.replace(/\[collapse\](.*?)\[\/collapse\]/gi, '<details style="margin:10px 0;"><summary style="cursor:pointer;color:var(--vscode-textLink-foreground);">展开</summary><div style="padding:10px;background:var(--vscode-textBlockQuote-background);">$1</div></details>');

  return processed;
};

// 获取版块列表（用于配置）
export const getNgaForumList = async (): Promise<{ fid: string; name: string }[]> => {
  try {
    const cookie = getNgaCookie();
    if (!cookie) {
      return [];
    }

    const url = `${BASE_URL}/app_api.php?__lib=home&__act=category&_v=2`;
    const res = await axios.get(url, {
      headers: {
        Cookie: cookie,
        ...NGA_HEADERS,
      },
    });

    const data = res.data;
    const forums: { fid: string; name: string }[] = [];

    // 解析 forum_recommend
    const forumRecommend = data?.forum_recommend?.groups || [];
    for (const group of forumRecommend) {
      const groupForums = group?.forums || [];
      for (const forum of groupForums) {
        if (forum.fid && forum.name) {
          forums.push({
            fid: forum.fid.toString(),
            name: forum.name,
          });
        }
      }
    }

    return forums;
  } catch (err) {
    console.error("[NGA] getNgaForumList error:", err);
    return [];
  }
};
