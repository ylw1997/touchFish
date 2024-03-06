/*
 * @Author: YangLiwei
 * @Date: 2022-05-26 15:05:38
 * @LastEditTime: 2024-03-06 14:34:40
 * @LastEditors: yangliwei 1280426581@qq.com
 * @FilePath: \touchfish\src\api\nga.ts
 * @Description: 
 */
import axios from "axios";
import { chiphellNewsItem } from '../type/type';
import cheerio = require('cheerio');
import { TextDecoder } from "util";
import * as vscode from 'vscode';
import { setConfigByKey } from "../config";

export const  getOrSetNgaCookie = async () => {
  const config = vscode.workspace.getConfiguration('touchfish');
  let cookie = config.get('ngaCookie') as string | undefined;
  // 如果没有就请输入cookie
  if(!cookie){
    cookie = await vscode.window.showInputBox({
      placeHolder: "请输入nga的cookie",
      prompt: "请输入nga的cookie",
    });
    if(cookie){
      await setConfigByKey('ngaCookie', cookie);
    }
  }
  return cookie;
};

// 获取新闻列表
export const getNgaList = async (tab?:string) => {
  const resArr: chiphellNewsItem[] = [];
  try {
    const cookie = await getOrSetNgaCookie() as string;
    const res = await axios.get("https://bbs.nga.cn/thread.php?fid=" + tab, {
      headers:{
        "Cookie":cookie
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
    // 弹出错误确认框，请求失败，是否清除cookie，重新输入
    const res = await vscode.window.showErrorMessage("获取nga新闻列表失败,是否清除cookie，重新输入", "是", "否");
    if(res === "是"){
      await setConfigByKey('ngaCookie', "");
      await getOrSetNgaCookie();
      vscode.window.showInformationMessage("请刷新列表重试！");
    }
  }
  return resArr;
};


// 获取nga文章详情
export const getNgaNewsDetail = async (url: string) => {
  console.log(url);
  try {
    const cookie = await getOrSetNgaCookie() as string;
    const { data } = await axios.get(
      "https://bbs.nga.cn"+url,{
        headers:{
          "Cookie":cookie
        },
        responseType: "arraybuffer", // 关键步骤
        responseEncoding: "utf8",
      }
    );
    const datastr = new TextDecoder("gbk").decode(data);
    let ngaContext = "";
    // 把所有[img]./替换为[img]
    datastr.replace(/\[img\].\//g, "[img]");
    // 找到[img]开头[/img]结尾的字符串,替换为img标签,并src添加http://img4.nga.178.com
    ngaContext = datastr.replace(/\[img\](.*?)\[\/img\]/g, '<img src="https://img.nga.178.com/attachments/$1" />');
    // 删除 [pid= 开头 [/b] 结尾的字符串
    ngaContext = ngaContext.replace(/\[pid=(.*?)\](.*?)\[\/b\]/g,"");
    // 删除 [s:开头] 结尾的字符串
    ngaContext = ngaContext.replace(/\[s:(.*?)\]/g,"");
    // 替换[quote] 为 <div class="comment_c">
    ngaContext = ngaContext.replace(/\[quote\]/g, '<div class="comment_c">');
    // 替换 [/quote] 为 </div>
    ngaContext = ngaContext.replace(/\[\/quote\]/g, '</div>');
    // 删除 [tid开头 [/tid] 结尾的字符串
    ngaContext = ngaContext.replace(/\[tid(.*?)\](.*?)\[\/tid\]/g,"");
    // 删除 [b] 开头 [/b] 结尾的字符串
    ngaContext = ngaContext.replace(/\[b\](.*?)\[\/b\]/g,"");
    const $ = cheerio.load(ngaContext);
    let content = $('#m_posts').html();
    return content;
  } catch (error) {
    // 弹出错误提示
    vscode.window.showErrorMessage("获取nga新闻详情失败");
  }
  
};