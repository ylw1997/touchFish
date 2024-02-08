/*
 * @Author: YangLiwei
 * @Date: 2022-05-20 11:27:15
 * @LastEditTime: 2024-02-08 13:53:29
 * @LastEditors: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @FilePath: \touchfish\src\api\v2ex.ts
 * @Description: 
 */
import axios from "axios";
import cheerio = require('cheerio');
import { v2exNewsItem } from "../type/type";
import * as vscode from 'vscode';

// 获取新闻列表
export const getV2exList = async (tab="all")=>{
  try {
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
  } catch (error) {
    vscode.window.showErrorMessage("获取V2EX新闻列表失败");
    return [];
  }
  
};

// 获取新闻详情
export const getV2exDetail = async (url:string)=>{
  try {
    const res =  await axios.get("https://www.v2ex.com"+url);
    const $ = cheerio.load(res.data);
    const content = $('#Main').html();
    return content;
  } catch (error) {
    return "获取V2EX新闻内容失败！";
  }
  
};