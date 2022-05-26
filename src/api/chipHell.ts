/*
 * @Author: YangLiwei
 * @Date: 2022-05-26 15:05:38
 * @LastEditTime: 2022-05-26 16:23:16
 * @LastEditors: YangLiwei
 * @FilePath: \hello-world\src\api\chipHell.ts
 * @Description: 
 */
import axios from "axios";
import { chiphellNewsItem } from '../type/type';
import cheerio = require('cheerio');

export const getChipHellNews = async () => {
  const {data} =  await axios.get(
    "https://www.chiphell.com/"
  );
  const $ = cheerio.load(data);
  const newsList: chiphellNewsItem[] = [];
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
  const $ = cheerio.load(data);
  let content = $('.t_fsz').html()?.toString();
  const removeImg= content?.replace(/src="static\/image\/common\/none.gif/g,"");
  const removeIcon = removeImg?.replace(/src=\"static/g,'src="https://www.chiphell.com/static');
  return removeIcon?.replace(/zoomfile/g,"src");
};