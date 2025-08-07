/*
 * @Author: YangLiwei
 * @Date: 2022-05-26 15:05:38
 * @LastEditTime: 2025-08-07 09:16:05
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\src\api\zhihu.ts
 * @Description:
 */
import axios from "axios";
import { NewsItem } from "../type/type";
import * as vscode from "vscode";
import { setConfigByKey, showNewsNumber } from "../config";
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
    const cookieParts = cookie.split(";");
    for (const part of cookieParts) {
      const [key, ...value] = part.split("=");
      if (key.trim() === field) {
        return value.join("=");
      }
    }
  }
};

export const getZhihu96 = async (url: string) => {
  const b = await getZhihuCookieByField("d_c0");
  const burl = `${xzse93}+${url}+${b}`;
  const signatureResult = await getZhihuSignature(burl);
  console.log("知乎请求url:", burl);
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
// 获取新闻列表
export const getZhihuList = async (tab: "recommend" | "hot" = "recommend") => {
  const resArr: NewsItem[] = [];
  try {
    if (tab === "recommend") {
      const cookie = (await getOrSetZhihuCookie()) as string;
      let resList: zhihuItem[] = [];
      // 判断resList长度是否大于 showNewsNumber,如果大于则截取,小于则继续请求
      if (showNewsNumber) {
        while (resList.length < showNewsNumber) {
          const res = await getZhihuData(cookie);
          resList = resList
            .concat(res.data.data)
            .filter((item) => !!item.target.question);
        }
      }
      resList.forEach((element: zhihuItem) => {
        resArr.push({
          title: element.target.question?.title ?? "",
          url: element.target.question?.id,
        });
      });
    } else {
      const res = await getZhihuHot();
      // console.log("知乎hot",res);
      res.forEach((element: any) => {
        // element.url 'https://api.zhihu.com/questions/1935989980494262824'
        const id =(element.target.url as string).split("/").pop();
        resArr.push({
          title: element.target.title,
          url: id as string,
        });
      });
    }
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
    id: string;
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
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
      },
    });
    const data: ZhihuAnswers[] = res.data.data;
    // 解决图片懒加载问题
    data.forEach((item) => {
      if (item.target?.content) {
        item.target.content = item.target.content.replace(
          /<img[^>]*>/g,
          (imgTag) => {
            const dataSrcMatch = imgTag.match(/data-src="([^"]+)"/);
            const dataOriginalMatch = imgTag.match(
              /data-original="([^"]+)"/
            );
            const imageUrl = dataSrcMatch?.[1] || dataOriginalMatch?.[1];
            if (imageUrl) {
              let newImgTag = imgTag;
              // 如果有 src 属性，替换它
              if (newImgTag.includes("src=")) {
                newImgTag = newImgTag.replace(/src="[^"]+"/, `src="${imageUrl}"`);
              } else {
                // 否则，添加 src 属性
                newImgTag = newImgTag.replace("<img", `<img src="${imageUrl}"`);
              }
              return newImgTag;
            }
            return imgTag;
          }
        );
      }
    });
    return data;
  } catch (error) {
    console.log("知乎--->出错", error);
    return [];
  }
};

// 获取评论 https://www.zhihu.com/api/v4/comment_v5/answers/96218155860/root_comment?order_by=score&limit=20&offset= 

export interface ZhihuCommentItem {
  content: string;
  created_time: number;
  id: number;
  is_author: boolean;
  likes_count: number;
  reply_to_id: number;
  type: number;
  author: {
    avatar_url: string;
    id: number;
    name: string;
    url_token: string;
  };
  comment_tag: {
    type: "ip_info" | "hot";
    text: string;
  }[];
  child_comments: ZhihuCommentItem[];
}
export const getZhihuComment = async (
  id: string
): Promise<ZhihuCommentItem[]> => {
  const xzse96 = await getZhihu96(
    `/api/v4/comment_v5/answers/${id}/root_comment?order_by=score&limit=100&offset=`
  );
  const cookie = (await getOrSetZhihuCookie()) as string;
  const answerUrl = `https://www.zhihu.com/api/v4/comment_v5/answers/${id}/root_comment?order_by=score&limit=100&offset=`;
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
};


// 知乎热榜  https://www.zhihu.com/api/v3/feed/topstory/hot-lists/total?limit=50&desktop=true

export const getZhihuHot = async () => {
  const cookie = (await getOrSetZhihuCookie()) as string;
  const res = await axios.get(
    "https://www.zhihu.com/api/v3/feed/topstory/hot-lists/total?limit=50&desktop=true",
    {
      headers: {
        "Cookie": cookie,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36'
      },
    }
  )
  return res.data.data
}
