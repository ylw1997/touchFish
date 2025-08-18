/*
 * @Author: YangLiwei
 * @Date: 2022-05-20 11:27:15
 * @LastEditTime: 2024-09-18 13:51:05
 * @LastEditors: yangliwei 1280426581@qq.com
 * @FilePath: \touchfish\src\api\v2ex.ts
 * @Description: 
 */
import axios from "axios";
import {load} from 'cheerio';
import { NewsItem } from "../type/type";
import * as vscode from 'vscode';

// 获取新闻列表
export const getV2exList = async (tab="all")=>{
  try {
    const res =  await axios.get("https://www.v2ex.com/?tab="+tab);
    const resArr:NewsItem[] = []; 
    const $ = load(res.data);
    const newsListli = $("#Main").find(".box").first().find(".cell.item");
    newsListli.map((index)=>{
      const item = newsListli[index];
      resArr.push({
        title:$(item).find(".topic-link").text(),
        url: $(item).find(".topic-link").attr('href')?.trim() || '',
      });
    });
    return resArr;
  } catch (error) {
    console.log(error);
    vscode.window.showErrorMessage("获取V2EX新闻列表失败");
    return [];
  }
  
};

// 获取新闻详情
export const getV2exDetail = async (url:string)=>{
  try {
    const res =  await axios.get("https://www.v2ex.com"+url);
    const $ = load(res.data);
    const content = $("#Main").html();
    return content ? content.replace(/&nbsp;/g, '') : content;
  } catch (error) {
    console.log(error);
    return "获取V2EX新闻内容失败!";
  }
  
};
