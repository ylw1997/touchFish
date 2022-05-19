/*
 * @Author: YangLiwei
 * @Date: 2022-05-18 15:26:15
 * @LastEditTime: 2022-05-18 16:23:03
 * @LastEditors: YangLiwei
 * @FilePath: \hello-world\src\api.ts
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