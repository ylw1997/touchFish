/*
 * @Author: YangLiwei
 * @Date: 2022-05-20 11:27:15
 * @LastEditTime: 2025-08-21 14:22:34
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\src\api\v2ex.ts
 * @Description: 
 */
import axios from "axios";
import {load} from 'cheerio';
import { NewsItem } from "../type/type";
import { showError } from '../utils/errorMessage';
import { uniqueNews } from "../utils/util";

// 获取新闻列表
export const getV2exList = async (tab="all")=>{
  try {
    const res =  await axios.get("https://www.v2ex.com/?tab="+tab);
    const resArr:NewsItem[] = []; 
    const $ = load(res.data);
    const newsListli = $("#Main").find(".box").first().find(".cell.item");
    newsListli.map((index)=>{
      const item = newsListli[index];
      const linkEl = $(item).find('.topic-link');
      const rawHref = linkEl.attr('href')?.trim() || '';
      const hrefWithoutHash = rawHref.split('#')[0];
      const cleanHref = hrefWithoutHash.split('?')[0];
      resArr.push({
        title: linkEl.text(),
        url: cleanHref,
      });
    });
    return uniqueNews(resArr);
  } catch (error) {
    showError("获取V2EX新闻列表失败");
    return [];
  }
  
};

// 获取新闻详情
export const getV2exDetail = async (url: string, page?: number) => {
  try {
    let fullUrl = "https://www.v2ex.com" + url;
    if (page && page > 1) {
      fullUrl += (url.includes('?') ? '&' : '?') + 'p=' + page;
    }
    const res = await axios.get(fullUrl);
    const $ = load(res.data);
    const content = $("#Main").html();
    return content ? content.replace(/&nbsp;/g, '') : content;
  } catch (error) {
    return "获取V2EX新闻内容失败!";
  }
};
