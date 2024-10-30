/*
 * @Author: YangLiwei
 * @Date: 2022-05-26 15:05:38
 * @LastEditTime: 2024-10-30 11:59:04
 * @LastEditors: yangliwei 1280426581@qq.com
 * @FilePath: \touchfish\src\api\nga.ts
 * @Description: 
 */
import axios from "axios";
import { NewsItem } from '../type/type';
import { load } from 'cheerio';
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
  const resArr: NewsItem[] = [];
  try {
    const cookie = await getOrSetNgaCookie() as string;
    const res = await axios.get("https://bbs.nga.cn/thread.php?fid=" + tab, {
      maxRedirects:50,
      headers:{
        "Cookie":cookie
      },
      responseType: "arraybuffer", // 关键步骤
      responseEncoding: "utf8",
    });
    const datastr = new TextDecoder("gbk").decode(res.data);
    const $ = load(datastr);
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
    console.log("nga--->出错",error);
    vscode.window.showInformationMessage("nga加载失败,请刷新列表重试！");
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
        maxRedirects:50,
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
    const $ = load(ngaContext);
    const content = $('#m_posts').html();
    return content;
  } catch (error) {
    console.log("获取详情出错",error);
    // 弹出错误提示
    vscode.window.showErrorMessage("获取nga新闻详情失败");
  }
  
};