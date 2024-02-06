/*
 * @Author: YangLiwei
 * @Date: 2022-05-26 15:05:38
 * @LastEditTime: 2024-02-06 18:05:51
 * @LastEditors: yangliwei 1280426581@qq.com
 * @FilePath: \touchfish\src\api\nga.ts
 * @Description: 
 */
import axios from "axios";
import { chiphellNewsItem } from '../type/type';
import cheerio = require('cheerio');
import { TextDecoder } from "util";
import * as vscode from 'vscode';

// 获取新闻列表
export const getNgaList = async (tab = "-7955747") => {
  const resArr: chiphellNewsItem[] = [];
  try {
    const res = await axios.get("https://bbs.nga.cn/thread.php?fid=" + tab, {
      headers:{
        "Cookie":"ngacn0comUserInfo=guagua1997%09guagua1997%0939%0939%09%0910%090%094%090%090%09;ngaPassportUid=65236143;ngaPassportUrlencodedUname=guagua1997;ngaPassportCid=X9hs6gam2dcv82epc9om8bsntln3tgo2dot7026u;Hm_lvt_01c4614f24e14020e036f4c3597aa059=1705285068,1706261644,1706681490,1707016612;ngacn0comUserInfoCheck=0300e96a44b3a8c9174c9e7b446d1ce6;ngacn0comInfoCheckTime=1707204630;lastpath=/read.php?tid=39227777; lastvisit=1707204862;bbsmisccookies=%7B%22uisetting%22%3A%7B0%3A%22b%22%2C1%3A1707205162%7D%2C%22pv_count_for_insad%22%3A%7B0%3A-38%2C1%3A1707238803%7D%2C%22insad_views%22%3A%7B0%3A1%2C1%3A1707238803%7D%7D;Hm_lpvt_01c4614f24e14020e036f4c3597aa059=1707204863"
      },
      responseType: "arraybuffer", // 关键步骤
      responseEncoding: "utf8",
    });
    const datastr = new TextDecoder("gbk").decode(res.data);
    const $ = cheerio.load(datastr);
    const newsList = $('#topicrows').find(".topic");
    newsList.each((_, element) => {
      const title = $(element).text();
      const url = $(element).attr("href");
      resArr.push({
        title,
        url: url as string,
      });
    });
    return resArr;
  } catch (error) {
    // 弹出错误提示
    vscode.window.showErrorMessage("获取nga新闻列表失败");
  }
  return resArr;
};


// 获取nga文章详情
export const getNgaNewsDetail = async (url: string) => {
  console.log(url);
  try {
    const { data } = await axios.get(
      "https://bbs.nga.cn"+url,{
        headers:{
          "Cookie":"ngacn0comUserInfo=guagua1997%09guagua1997%0939%0939%09%0910%090%094%090%090%09;ngaPassportUid=65236143;ngaPassportUrlencodedUname=guagua1997;ngaPassportCid=X9hs6gam2dcv82epc9om8bsntln3tgo2dot7026u;Hm_lvt_01c4614f24e14020e036f4c3597aa059=1705285068,1706261644,1706681490,1707016612;ngacn0comUserInfoCheck=0300e96a44b3a8c9174c9e7b446d1ce6;ngacn0comInfoCheckTime=1707204630;lastpath=/read.php?tid=39227777; lastvisit=1707204862;bbsmisccookies=%7B%22uisetting%22%3A%7B0%3A%22b%22%2C1%3A1707205162%7D%2C%22pv_count_for_insad%22%3A%7B0%3A-38%2C1%3A1707238803%7D%2C%22insad_views%22%3A%7B0%3A1%2C1%3A1707238803%7D%7D;Hm_lpvt_01c4614f24e14020e036f4c3597aa059=1707204863"
        },
        responseType: "arraybuffer", // 关键步骤
        responseEncoding: "utf8",
      }
    );
    const datastr = new TextDecoder("gbk").decode(data);
    const $ = cheerio.load(datastr);
    let content = $('#m_posts').html();
    return content;
  } catch (error) {
    // 弹出错误提示
    vscode.window.showErrorMessage("获取nga新闻详情失败");
  }
  
};