/*
 * @Author: YangLiwei
 * @Date: 2022-05-26 15:05:38
 * @LastEditTime: 2024-09-18 13:48:12
 * @LastEditors: yangliwei 1280426581@qq.com
 * @FilePath: \touchfish\src\api\chipHell.ts
 * @Description: 
 */
import axios from "axios";
import { NewsItem } from '../type/type';
import {load} from 'cheerio';

export const getChipHellNews = async () => {
  const {data} =  await axios.get(
    "https://www.chiphell.com/"
  );
  const $ = load(data);
  const newsList: NewsItem[] = [];
  $('#threadulid').each((index,item)=>{
    const element = $(item).find('li');
    element.each((_,item)=>{
      const title = $(item).find('li>div.tmpad>a.tm03').text();
      const url = 'https://www.chiphell.com/'+ $(item).find('li>a.tm01').attr('href');
      newsList.push({
        title,
        url
      });
    });
  }
  );
  return newsList;
};



// 获取chiphell文章详情
export const getChipHellNewsDetail = async (url: string) => {
  const {data} =  await axios.get(
    url
  );
  const $ = load(data);
  const content = $('.t_fsz').html()?.toString();
  const removeImg= content?.replace(/src="static\/image\/common\/none.gif/g,"");
  const removeIcon = removeImg?.replace(/src="static/g,'src="https://www.chiphell.com/static');
  return removeIcon?.replace(/zoomfile/g,"src");
};