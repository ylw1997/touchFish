/*
 * @Author: YangLiwei
 * @Date: 2022-05-20 11:27:15
 * @LastEditTime: 2024-02-01 15:52:30
 * @LastEditors: yangliwei 1280426581@qq.com
 * @FilePath: \touchfish\src\api\hupu.ts
 * @Description: 
 */
import axios from "axios";
import cheerio = require('cheerio');
import { chiphellNewsItem } from "../type/type";

// 获取新闻列表
export const getHupuList = async (tab="all-gambia")=>{
  const res =  await axios.get("https://bbs.hupu.com/"+tab,{
    headers:{
      'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36'
    }
  });
  const resArr:chiphellNewsItem[] = []; 
  const $ = cheerio.load(res.data);
  if(tab === "all-gambia"){
    const newsList = $('.text-list-model').find(".list-item");
    newsList.each((_,element)=>{
      const title = $(element).find("a").find(".t-title").text();
      const url = $(element).find("a").attr("href");
      resArr.push({
        title,
        url:url as string,
      });
    });
  }else{
    const newsList = $('.bbs-sl-web-post').find(".post-title");
    newsList.each((_,element)=>{
      const title = $(element).find(".p-title").text();
      const url = $(element).find(".p-title").attr("href");
      resArr.push({
        title,
        url:url as string,
      });
    });
  }
  
  return resArr;
};

// 获取新闻详情
export const getHupuDetail = async (url:string)=>{
  const res =  await axios.get("https://bbs.hupu.com"+url,{
    headers:{
      'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36'
    }
  });
  //去掉css动态字符串
  const reg = /__.\w*\"/g;
  const reg2 = /__.\w*\s/g;
  const resData = res.data.replace(reg,'"').replace(reg2," ");
  const $ = cheerio.load(resData);
  const content = $('.index_bbs-post-web-body-left-wrapper').html();
  return content;
};