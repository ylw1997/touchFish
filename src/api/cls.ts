/*
 * @Author: YangLiwei
 * @Date: 2022-05-23 09:15:58
 * @LastEditTime: 2022-05-23 11:09:20
 * @LastEditors: YangLiwei
 * @FilePath: \hello-world\src\api\cls.ts
 * @Description: 
 */
import axios from "axios";
import cheerio = require('cheerio');
import { clsNewsItem } from "../type/type";
import { showNewsWordNumber } from '../config/index';
import { subStringBySize } from "../utils/util";

export const getCLSNewsList = async () => {
  let newsList: clsNewsItem[] = [];
  const res = await axios.get("https://www.cls.cn/telegraph",{
    headers:{
      'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36'
    }
  });
  const $ = cheerio.load(res.data);
  $('.telegraph-list').each((index,item)=>{
    const element = $(item).find('span.telegraph-time-box');
    const time = element.text();
    let title = element.next().find('strong').text();
    const content = element.next().find('div').text();
    title = title ? title.replace('【',"").replace('】',"") : content.split(',').shift()!.toString();
    if(title) {
      newsList.push({
        title:time+' '+subStringBySize(title,showNewsWordNumber-5),
        time,
        content
      });
    }
  });
  return newsList;
};

getCLSNewsList();
