/*
 * @Author: YangLiwei
 * @Date: 2022-05-26 15:05:38
 * @LastEditTime: 2025-08-05 11:58:22
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\src\api\zhihu.ts
 * @Description:
 */
import axios from "axios";
import { NewsItem } from "../type/type";
import * as vscode from "vscode";
import { setConfigByKey } from "../config";
import { getZhihuSignature } from "../utils/signature";

const xzse93 = "101_3_3.0";
export const getOrSetZhihuCookie = async () => {
  const config = vscode.workspace.getConfiguration("touchfish");
  let cookie = config.get("zhihuCookie") as string | undefined;
  // 如果没有就请输入cookie
  if (!cookie) {
    cookie = await vscode.window.showInputBox({
      placeHolder: "请输入知乎的cookie",
      prompt: "请输入知乎的cookie",
    });
    if (cookie) {
      await setConfigByKey("zhihuCookie", cookie);
    }
  }
  return cookie;
};

// 获取cookie中的d_c0
export const getZhihuCookieByField = async (field: string) => {
  const cookie = (await getOrSetZhihuCookie()) as string;
  if (cookie) {
    const cookieParts = cookie.split(';');
    for (const part of cookieParts) {
      const [key, ...value] = part.split('=');
      if (key.trim() === field) {
        return value.join('=');
      }
    }
  }
};

export const getZhihu96 = async (url: string) => {
  const b = await getZhihuCookieByField("d_c0");
  const burl = `${xzse93}+${url}+${b}`;
  const signatureResult = await getZhihuSignature(burl);
  // console.log("知乎加密url:", burl);
  // console.log("知乎签名:", signatureResult);
  return signatureResult;
};

const getZhihuData = async (cookie: string) => {
  const xzse96 = await getZhihu96(
    "/api/v3/feed/topstory/recommend?limit=10&desktop=true"
  );
  return await axios.get(
    "https://www.zhihu.com/api/v3/feed/topstory/recommend?limit=10&desktop=true",
    {
      headers: {
        Cookie: cookie,
        "x-zse-96": xzse96,
        "x-zse-93": xzse93,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
      },
    }
  );
};

// 获取新闻列表

interface zhihuItem {
  target: { question: { title?: string; id: string } };
}
export const getZhihuList = async () => {
  console.log("获取知乎列表");
  const resArr: NewsItem[] = [];
  try {
    const cookie = (await getOrSetZhihuCookie()) as string;
    // 判断resList长度是否大于 showNewsNumber,如果大于则截取,小于则继续请求
    const res = await getZhihuData(cookie);
    res.data.data
      .filter((item: zhihuItem) => !!item.target.question)
      .forEach(
        (element: { target: { question: { title?: string; id: string } } }) => {
          resArr.push({
            title: element.target.question?.title ?? "",
            url: element.target.question?.id,
          });
        }
      );
    return resArr;
  } catch (error) {
    console.log("知乎--->出错", error);
    vscode.window.showInformationMessage("数据请求失败,请刷新列表重试！");
  }
  return resArr;
};

// 获取Zhihu文章详情
export type ZhihuAnswers = {
  target_type: string;
  target: {
    author: {
      name: string;
      avatar_url: string;
      headline: string;
    };
    answer_type: string;
    comment_count: number;
    voteup_count: number;
    content: string;
    excerpt: string;
  };
};
export const getZhihuNewsDetail = async (
  id: string
): Promise<ZhihuAnswers[]> => {
  try {
    const xzse96 = await getZhihu96(
      `/api/v4/questions/${id}/feeds?include=data[*].content&limit=30&offset=0&order=default&platform=desktop`
    );
    const cookie = (await getOrSetZhihuCookie()) as string;
    const answerUrl = `https://www.zhihu.com/api/v4/questions/${id}/feeds?include=data[*].content&limit=30&offset=0&order=default&platform=desktop`;
    const res = await axios.get(answerUrl, {
      headers: {
        Cookie: cookie,
        "x-zse-96": xzse96,
        "x-zse-93": xzse93,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36",
      },
    });
    return res.data.data;
  } catch (error) {
    console.log("知乎--->出错", error);
    return [];
  }
};

export const getZhihuItemDetail = async (id: string) => {
  const cookie = (await getOrSetZhihuCookie()) as string;
  const { data } = await axios.get(`https://www.zhihu.com/question/${id}`, {
    headers: {
      Cookie: cookie,
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36",
    },
  });
  return data;
};
