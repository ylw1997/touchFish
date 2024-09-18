/*
 * @Author: YangLiwei
 * @Date: 2022-05-20 14:17:06
 * @LastEditTime: 2024-09-18 13:38:51
 * @LastEditors: yangliwei 1280426581@qq.com
 * @FilePath: \touchfish\src\api\kjj.ts
 * @Description: 
 */
import axios from "axios";
import { NewsItem } from '../type/type';
import {load} from 'cheerio';

/**
 * 获取快科技新闻列表
 * @returns Promise<NewsItem[]>
 */
export const getKKJNewsList = async ()=>{
  const res =  await axios.get("https://www.mydrivers.com");
  const newsList:NewsItem[] = [];
  const $ = load(res.data);
  const newsListli = $('.news_info1').find('ul.newslist').find('li');
  $(newsListli).each((index,item)=>{
    newsList.push({
      title:$(item).find('span.titl>a').text(),
      url:$(item).find('span.titl>a').attr('href')!,
      isTop:$(item).find('em.zhiding').length>0
    });
  });
  return newsList;
};

/**
 *  获取快科技新闻详情
 * @param url  新闻url
 * @returns  Promise<string>
 */
export const getKKJNewsDetail = async (url:string)=>{
  const res = await axios.get(url);
  const $ = load(res.data);
  const newsDetail = $('.news_info').html()?.trim();
  return newsDetail?newsDetail.replace(/\/\//g,"https://"):`<a href="${url}">文章请求出错,请直接访问查看!</a>`;  
};