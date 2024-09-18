/*
 * @Author: YangLiwei
 * @Date: 2022-05-23 09:15:58
 * @LastEditTime: 2024-09-18 14:29:07
 * @LastEditors: yangliwei 1280426581@qq.com
 * @FilePath: \touchfish\src\api\cls.ts
 * @Description: 
 */
import axios from "axios";
import {load} from 'cheerio';
import { NewsItem } from "../type/type";

export const getCLSNewsList = async () => {
  const newsList: NewsItem[] = [];
  const res = await axios.get("https://www.cls.cn/telegraph",{
    headers:{
      'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36'
    }
  });
  const $ = load(res.data);
  $('.telegraph-list').each((_,item)=>{
    const element = $(item).find('span.telegraph-time-box');
    const time = element.text().slice(0,-3);
    let title = element.next().find('strong').text();
    const content = element.next().find('div').text();
    title = title ? title.replace('【',"").replace('】',"") : content.split(',').shift()!.toString();
    if(title) {
      newsList.push({
        title:time+' '+title,
        url:content
      });
    }
  });
  return newsList;
};

