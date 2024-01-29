/*
 * @Author: YangLiwei
 * @Date: 2022-05-20 11:27:15
 * @LastEditTime: 2024-01-29 14:00:43
 * @LastEditors: yangliwei 1280426581@qq.com
 * @FilePath: \touchfish\src\api\v2ex.ts
 * @Description: 
 */
import axios from "axios";
import cheerio = require('cheerio');
import { v2exNewsItem } from "../type/type";

// 获取新闻列表
export const getV2exList = async (tab="all")=>{
  const res =  await axios.get("https://www.v2ex.com/?tab="+tab);
  const resArr:v2exNewsItem[] = []; 
  const $ = cheerio.load(res.data);
  const newsListli = $('#Main').find('.box').first().find('.cell.item');
  newsListli.map((index)=>{
    const item = newsListli[index];
    resArr.push({
      title:$(item).find(".topic-link").text(),
      node:$(item).find(".node").text(),
      url:$(item).find(".topic-link").attr('href')?.trim()!,
    });
  });
  return resArr;
};

// 获取新闻详情
export const getV2exDetail = async (url:string)=>{
  const res =  await axios.get("https://www.v2ex.com"+url);
  const $ = cheerio.load(res.data);
  const content = $('#Main').html();
  return content;
};