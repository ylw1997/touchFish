/*
 * @Author: YangLiwei
 * @Date: 2022-05-20 11:27:15
 * @LastEditTime: 2022-05-20 11:27:22
 * @LastEditors: YangLiwei
 * @FilePath: \hello-world\src\api\ithome.ts
 * @Description: 
 */
import axios from "axios";

// 获取新闻列表
export const getNewsList = ()=>{
  return axios.get("https://api.ithome.com/json/newslist/news?r=0");
};

// 获取新闻详情
export const getNewsDetail = (id:number)=>{
  return axios.get(`https://api.ithome.com/json/newscontent/${id}`);
};