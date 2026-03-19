/*
 * @Author: YangLiwei
 * @Date: 2022-05-26 15:05:38
 * @LastEditTime: 2025-12-08 16:07:30
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\src\api\chipHell.ts
 * @Description: 
 */
import axios from "axios";
import { NewsItem } from '../type/type';
import { load } from 'cheerio';
import { uniqueNews } from "../utils/util";
import { showError } from "../utils/errorMessage";
import { TextDecoder } from "util";

export const getChipHellNews = async () => {
  try {
    const res = await axios.get(
      "https://www.chiphell.com/forum.php?mod=forumdisplay&fid=319&filter=author&orderby=dateline",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
          "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
          "Referer": "https://www.chiphell.com/forum.php",
        },
        responseType: "arraybuffer",
      }
    );
    
    const datastr = new TextDecoder("utf-8").decode(res.data);
    const $ = load(datastr);
    const list: NewsItem[] = [];

    // 尝试解析普通列表模式
    $("#threadlisttableid a.s.xst").each((_, a) => {
      const title = $(a).text().trim();
      const href = $(a).attr("href") || "";
      if (!title || !href) return;
      if (!href.startsWith("thread-")) return;
      
      const cleanHref = href.split("#")[0].trim();
      list.push({
        title,
        url: `https://www.chiphell.com/${cleanHref.replace(/^\/+/, "")}`,
      });
    });

    // 尝试解析瀑布流模式 (waterfall)
    if (list.length === 0) {
      $("#waterfall h3.xw0 a").each((_, a) => {
        const title = $(a).text().trim();
        const href = $(a).attr("href") || "";
        if (!title || !href) return;
        
        const cleanHref = href.split("#")[0].trim();
        list.push({
          title,
          url: `https://www.chiphell.com/${cleanHref.replace(/^\/+/, "")}`,
        });
      });
    }

    console.log("Chiphell新闻列表获取成功:", list.map(i => i.title));
    return uniqueNews(list);
  } catch (error) {
    console.error("获取Chiphell新闻列表失败:", error);
    showError("获取Chiphell新闻列表失败");
    return [];
  }
};



// 获取chiphell文章详情
export const getChipHellNewsDetail = async (url: string) => {
  const { data } = await axios.get(
    url
  );
  const $ = load(data);
  const content = $('.t_fsz').html()?.toString();
  const removeImg = content?.replace(/src="static\/image\/common\/none.gif/g, "");
  const removeIcon = removeImg?.replace(/src="static/g, 'src="https://www.chiphell.com/static');
  return removeIcon?.replace(/zoomfile/g, "src");
};