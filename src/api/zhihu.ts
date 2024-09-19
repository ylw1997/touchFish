/*
 * @Author: YangLiwei
 * @Date: 2022-05-26 15:05:38
 * @LastEditTime: 2024-09-19 11:01:28
 * @LastEditors: yangliwei 1280426581@qq.com
 * @FilePath: \touchfish\src\api\zhihu.ts
 * @Description: 
 */
import axios from "axios";
import { NewsItem } from '../type/type';
import * as vscode from 'vscode';
import { setConfigByKey, showNewsNumber } from "../config";

export const getOrSetZhihuCookie = async () => {
  const config = vscode.workspace.getConfiguration('touchfish');
  let cookie = config.get('zhihuCookie') as string | undefined;
  // 如果没有就请输入cookie
  if (!cookie) {
    cookie = await vscode.window.showInputBox({
      placeHolder: "请输入知乎的cookie",
      prompt: "请输入知乎的cookie",
    });
    if (cookie) {
      await setConfigByKey('zhihuCookie', cookie);
    }
  }
  return cookie;
};

const getZhihuData = async (cookie: string) => {
  return await axios.get("https://www.zhihu.com/api/v3/feed/topstory/recommend?limit=10&desktop=true", {
    headers: {
      "Cookie": cookie,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36'
    },
  })
}

// 获取新闻列表
export const getZhihuList = async () => {
  const resArr: NewsItem[] = [];
  try {
    const cookie = await getOrSetZhihuCookie() as string;
    let resList: { target: { question: { title: string; id: string; } } }[] = [];
    // 判断resList长度是否大于 showNewsNumber,如果大于则截取,小于则继续请求
    if (showNewsNumber) {
      while (resList.length < showNewsNumber) {
        const res = await getZhihuData(cookie)
        resList = resList.concat(res.data.data);
      }
    }
    resList.forEach((element: { target: { question: { title: string; id: string; } } }) => {
      resArr.push({
        title: element.target.question.title,
        url: element.target.question.id,
      });
    });
    return resArr;
  } catch (error) {
    console.log("知乎--->出错", error);
    // 弹出错误确认框，请求失败，是否清除cookie，重新输入
    const res = await vscode.window.showErrorMessage("获取知乎新闻列表失败,是否清除cookie,重新输入", "是", "否");
    if (res === "是") {
      await setConfigByKey('zhihuCookie', "");
      await getOrSetZhihuCookie();
      vscode.window.showInformationMessage("请刷新列表重试！");
    }
  }
  return resArr;
};


// 获取Zhihu文章详情
export type ZhihuAnswers = {
  target_type: string;
  target:{
    author:{
      name:string;
      avatar_url:string;
      headline:string;
    }
    answer_type:string;
    comment_count:number;
    voteup_count:number;
    content:string
    excerpt:string;
  }
}
export const getZhihuNewsDetail = async (url: string):Promise<ZhihuAnswers[]> => {
  try {
    const cookie = await getOrSetZhihuCookie() as string;
    const answerUrl =`https://www.zhihu.com/api/v4/questions/${url}/feeds?include=data[*].content&limit=30&offset=0&order=default&platform=desktop`
    const res = await axios.get(answerUrl, {
      headers: {
        "Cookie": cookie,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36",
      },
    });
    return res.data.data;
  } catch (error) {
    console.log("知乎--->出错", error);
    return []
  }
};