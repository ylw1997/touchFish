/*
 * @Author: YangLiwei
 * @Date: 2022-05-20 11:27:15
 * @LastEditTime: 2025-08-21 14:21:58
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\src\api\hupu.ts
 * @Description: 
 */
import axios from "axios";
import {load} from 'cheerio';
import { NewsItem } from '../type/type';
import { uniqueNews } from "../utils/util";

// 获取新闻列表
export const getHupuList = async (tab="all-gambia")=>{
  const res =  await axios.get("https://bbs.hupu.com/"+tab,{
    headers:{
      'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36'
    }
  });
  const resArr:NewsItem[] = []; 
  const $ = load(res.data);
  if(tab === "all-gambia"){
    const newsList = $('.text-list-model').find(".list-item");
    newsList.each((_,element)=>{
      const title = $(element).find("a").find(".t-title").text();
      let url = $(element).find("a").attr("href") || "";
      // 确保 URL 是相对路径且以 / 开头
      if (url && !url.startsWith('http')) {
        if (!url.startsWith('/')) {
          url = '/' + url;
        }
      }
      resArr.push({
        title,
        url,
      });
    });
  }else{
    const newsList = $('.bbs-sl-web-post').find(".post-title");
    newsList.each((_,element)=>{
      const title = $(element).find(".p-title").text();
      let url = $(element).find(".p-title").attr("href") || "";
      // 确保 URL 是相对路径且以 / 开头
      if (url && !url.startsWith('http')) {
        if (!url.startsWith('/')) {
          url = '/' + url;
        }
      }
      resArr.push({
        title,
        url,
      });
    });
  }
  
  return uniqueNews(resArr);
};

// 获取新闻详情
export const getHupuDetail = async (url: string, page?: number) => {
  try {
    // 处理 URL，确保格式正确
    let fullUrl = url;
    
    // 如果是相对路径，添加域名
    if (!url.startsWith('http')) {
      fullUrl = "https://bbs.hupu.com" + (url.startsWith('/') ? url : '/' + url);
    }
    
    // 移除 URL 中可能存在的页码（如 -2.html），恢复为基础 URL
    fullUrl = fullUrl.replace(/-\d+\.html$/, '.html');
    
    // 添加分页参数
    if (page && page > 1) {
      if (fullUrl.endsWith('.html')) {
        fullUrl = fullUrl.replace(/\.html$/, '-' + page + '.html');
      }
    }
    
    console.log('[Hupu] Fetching URL:', fullUrl);
    
    const res = await axios.get(fullUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36'
      }
    });
    // 去掉css动态字符串
    const reg = /__.\w*"/g;
    const reg2 = /__.\w*\s/g;
    const resData = res.data.replace(reg, '"').replace(reg2, " ");
    const $ = load(resData);
    const content = $('.index_bbs-post-web-body-left-wrapper').html();
    return content;
  } catch (error) {
    console.error('[Hupu] Error fetching:', error);
    return "获取虎扑新闻内容失败!";
  }
};