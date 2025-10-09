/*
 * @Author: YangLiwei
 * @Date: 2022-05-26 15:05:38
 * @LastEditTime: 2025-09-25 14:58:01
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\src\api\zhihu.ts
 * @Description:
 */
import axios from "axios";
import * as vscode from "vscode";
import { setConfigByKey } from "../core/config";
import { getZhihuSignature } from "../utils/signature";
import {
  ZhihuCommentItem,
  ZhihuHotItem,
  ZhihuHotQuestion,
  ZhihuItemData,
  ZhihuSearchItem,
} from "../../type";
import {
  convertZhihuHotItemToZhihuItemData,
  convertZhihuHotQuestionToZhihuItemData,
  zhihuContentImage,
} from "../utils/util";

const xzse93 = "101_3_3.0";
const xapi = "3.0.91";
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
  // console.log("知乎请求url:", burl);
  // console.log("知乎签名:", signatureResult);
  return signatureResult;
};

const getZhihuData = async (nextUrl?: string) => {
  const cookie = (await getOrSetZhihuCookie()) as string;
  const defaultPath = "/api/v3/feed/topstory/recommend?limit=10&desktop=true";
  const requestUrl = nextUrl || `https://www.zhihu.com${defaultPath}`;
  // 签名需要 path + cookie d_c0
  const signPath = nextUrl ? new URL(nextUrl).pathname + new URL(nextUrl).search : defaultPath;
  const xzse96 = await getZhihu96(signPath);
  const res = await axios.get(requestUrl, {
    headers: {
      Cookie: cookie,
      "x-zse-96": xzse96,
      "x-zse-93": xzse93,
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
    },
  });
  return { data: res.data.data, paging: res.data.paging };
};

const getZhihuFollowData = async (nextUrl?: string) => {
  const cookie = (await getOrSetZhihuCookie()) as string;
  const defaultPath = "/api/v3/moments?limit=10&desktop=true";
  const requestUrl = nextUrl || `https://www.zhihu.com${defaultPath}`;
  const signPath = nextUrl ? new URL(nextUrl).pathname + new URL(nextUrl).search : defaultPath;
  const xzse96 = await getZhihu96(signPath);
  const res = await axios.get(requestUrl, {
    headers: {
      Cookie: cookie,
      "x-zse-96": xzse96,
      "x-zse-93": xzse93,
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
    },
  });
  return { data: res.data.data, paging: res.data.paging };
};

// 获取评论 https://www.zhihu.com/api/v4/comment_v5/answers/96218155860/root_comment?order_by=score&limit=20&offset=

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

// 获取子评论：https://www.zhihu.com/api/v4/comment_v5/comment/{commentId}/child_comment?order_by=ts&limit=20&offset=
export const getZhihuChildComment = async (
  commentIdOrNextUrl: string
): Promise<{ data: ZhihuCommentItem[]; paging?: any }> => {
  // 如果传入的值是完整的 nextUrl（以 http 开头），则直接使用；否则构造 child_comment 路径
  let requestUrl: string;
  let signPath: string;
  if (commentIdOrNextUrl.startsWith("http")) {
    requestUrl = commentIdOrNextUrl;
    const u = new URL(commentIdOrNextUrl);
    signPath = u.pathname + u.search;
  } else {
    const commentId = commentIdOrNextUrl;
    signPath = `/api/v4/comment_v5/comment/${commentId}/child_comment?order_by=ts&limit=20&offset=`;
    requestUrl = `https://www.zhihu.com${signPath}`;
  }

  const xzse96 = await getZhihu96(signPath);
  const cookie = (await getOrSetZhihuCookie()) as string;
  const res = await axios.get(requestUrl, {
    headers: {
      Cookie: cookie,
      "x-zse-96": xzse96,
      "x-zse-93": xzse93,
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
    },
  });

  return { data: res.data.data, paging: res.data.paging };
};

// 知乎热榜  https://www.zhihu.com/api/v3/feed/topstory/hot-lists/total?limit=50&desktop=true

export const getZhihuHot = async (nextUrl?: string) => {
  const cookie = (await getOrSetZhihuCookie()) as string;
  const defaultPath = "/api/v3/feed/topstory/hot-lists/total?limit=50&desktop=true";
  const requestUrl = nextUrl || `https://www.zhihu.com${defaultPath}`;
  const res = await axios.get(requestUrl, {
    headers: {
      Cookie: cookie,
      "x-api-version": xapi,
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
    },
  });
  // 热榜接口返回结构可能和 feed 不完全相同，保持向后兼容：
  return { data: res.data.data, paging: res.data.paging };
};

// web知乎处理数据
export const getZhihuWebData = async (
  tab: "follow" | "recommend" | "hot" | "hot_question",
  nextUrl?: string
) => {
  const resArr: ZhihuItemData[] = [];
  // apiRes: { data: any[], paging?: any }
  let apiRes: { data: any[]; paging?: any } = { data: [] };

  switch (tab) {
    case "follow":
      apiRes = await getZhihuFollowData(nextUrl);
      break;
    case "recommend":
      apiRes = await getZhihuData(nextUrl);
      break;
    case "hot": {
      const hotres = await getZhihuHot(nextUrl);
      // hotres is { data, paging }
      (hotres.data || []).forEach((item: { target: ZhihuHotItem }, index: number) => {
        resArr.push(convertZhihuHotItemToZhihuItemData(item.target, index + 1));
      });
      return { data: resArr, paging: hotres.paging };
    }
    case "hot_question": {
      const hotQuestions = await getZhihuHotQuestions(nextUrl);
      (hotQuestions.data || []).forEach((item: ZhihuHotQuestion) => {
        resArr.push(convertZhihuHotQuestionToZhihuItemData(item));
      });
      return { data: resArr, paging: hotQuestions.paging };
    }
  }

  (apiRes.data || []).forEach((element: { target?: ZhihuItemData }) => {
    if (element.target && element.target.question && element.target.content)
      resArr.push({
        ...element.target,
        content: zhihuContentImage(element.target.content),
        tab: tab,
      });
  });
  return { data: resArr, paging: apiRes.paging };
};

// web查看问题详情
export const getZhihuWebDetail = async (
  idOrNextUrl: string
): Promise<{ data: ZhihuItemData[]; paging?: any }> => {
  // If idOrNextUrl is a full URL (starts with http), treat as nextUrl; otherwise treat as question id
  let requestUrl: string;
  let signPath: string;
  if (idOrNextUrl.startsWith("http")) {
    requestUrl = idOrNextUrl;
    const u = new URL(idOrNextUrl);
    signPath = u.pathname + u.search;
  } else {
    const id = idOrNextUrl;
    signPath = `/api/v4/questions/${id}/feeds?include=data[*].content&limit=30&offset=0&order=default&platform=desktop`;
    requestUrl = `https://www.zhihu.com${signPath}`;
  }

  const xzse96 = await getZhihu96(signPath);
  const cookie = (await getOrSetZhihuCookie()) as string;
  const res = await axios.get(requestUrl, {
    headers: {
      Cookie: cookie,
      "x-zse-96": xzse96,
      "x-zse-93": xzse93,
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
    },
  });

  const resArr: ZhihuItemData[] = [];
  // 解决图片懒加载问题
  (res.data.data || []).forEach((element: { target?: ZhihuItemData }) => {
    if (element.target && element.target.question && element.target.content)
      resArr.push({
        ...element.target,
        content: zhihuContentImage(element.target.content),
      });
  });

  return { data: resArr, paging: res.data.paging };
};

// 点赞 /api/v4/answers/1918268396996363949/voters

export const voteZhihuAnswer = async (
  answerId: string,
  type: "up" | "down" | "neutral"
) => {
  const url = `/api/v4/answers/${answerId}/voters`;
  const xzse96 = await getZhihu96(url);
  const cookie = (await getOrSetZhihuCookie()) as string;
  const headers = {
    Cookie: cookie,
    "x-zse-96": xzse96,
    "x-zse-93": xzse93,
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
  };

  return await axios.post(`https://www.zhihu.com${url}`, { type }, { headers });
};

// 搜索接口 https://www.zhihu.com/api/v4/search_v3?gk_version=gz-gaokao&t=general&q=OpenAI%E5%8F%91%E5%B8%83GPT-5&correction=1&offset=0&limit=20&filter_fields=&lc_idx=0&show_all_topics=0&search_source=Normal
export const searchZhihu = async (query: string): Promise<ZhihuItemData[]> => {
  const encodedQuery = encodeURIComponent(query);
  const url = `/api/v4/search_v3?t=general&q=${encodedQuery}&gk_version=gz-gaokao&correction=1&offset=0&limit=20&filter_fields=&lc_idx=0&show_all_topics=0&search_source=Normal`;
  const xzse96 = await getZhihu96(url);
  const cookie = (await getOrSetZhihuCookie()) as string;
  const searchUrl = `https://www.zhihu.com${url}`;
  const res = await axios.get(searchUrl, {
    headers: {
      Cookie: cookie,
      "x-zse-96": xzse96,
      "x-zse-93": xzse93,
      "x-api-version": xapi,
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
    },
  });

  const searchResults = res.data.data;
  const filteredData = searchResults.filter(
    (item: any) => item.type === "search_result"
  );

  return filteredData
    .map((item: ZhihuSearchItem) => {
      return {
        ...item.object,
        question: {
          ...item.object.question,
          title: item.object.title,
        },
        content: zhihuContentImage(item.object.content ?? ""),
      };
    })
    .filter((item: ZhihuItemData) => item.type === "answer");
};

// 获取知乎问题详情 //https://www.zhihu.com/question/1932357580283437907

export const getZhihuQuestionDetailFunc = async (
  questionId: string
): Promise<any> => {
  const url = `https://www.zhihu.com/question/${questionId}`;
  const cookie = (await getOrSetZhihuCookie()) as string;
  const headers = {
    Cookie: cookie,
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
  };

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: headers,
    });

    if (!response.ok) {
      console.error(`Request failed with status code ${response.status}`);
      return "";
    }

    const html = await response.text();
    const match = html.match(
      /<script id="js-initialData" type="text\/json">(.*?)<\/script>/
    );
    if (match && match[1]) {
      const json = JSON.parse(match[1]);
      return {
        detail: json.initialState.entities.questions[questionId].detail,
        isFollowing:
          json.initialState.entities.questions[questionId].relationship
            .isFollowing,
      };
    }
    return "";
  } catch (error) {
    console.error("An error occurred during fetch:", error);
    return "";
  }
};

// 关注问题 https://www.zhihu.com/api/v4/questions/538449801/followers post
export const followQuestion = async (questionId: string) => {
  const cookie = (await getOrSetZhihuCookie()) as string;
  const path = `https://www.zhihu.com/api/v4/questions/${questionId}/followers`;
  return await axios.post(
    path,
    {},
    {
      headers: {
        cookie: cookie,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
      },
    }
  );
};

// 取关问题 https://www.zhihu.com/api/v4/questions/538449801/followers delete
export const unfollowQuestion = async (questionId: string) => {
  const url = `/api/v4/questions/${questionId}/followers`;
  const cookie = (await getOrSetZhihuCookie()) as string;
  const path = `https://www.zhihu.com${url}`;
  return await axios.delete(path, {
    headers: {
      Cookie: cookie,
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
    },
  });
};

// 人气问题 https://www.zhihu.com/api/v4/creators/question_route/pc_member_related/hot?page_source=pc_panel&limit=20&offset=0&recom_domain_score_ab=1
export const getZhihuHotQuestions = async (nextUrl?: string) => {
  const defaultPath = "/api/v4/creators/question_route/pc_member_related/hot?page_source=pc_panel&limit=20&offset=0&recom_domain_score_ab=1";
  const requestUrl = nextUrl || `https://www.zhihu.com${defaultPath}`;
  const signPath = nextUrl ? new URL(nextUrl).pathname + new URL(nextUrl).search : defaultPath;
  const xzse96 = await getZhihu96(signPath);
  const cookie = (await getOrSetZhihuCookie()) as string;
  const res = await axios.get(requestUrl, {
    headers: {
      "x-zse-96": xzse96,
      "x-zse-93": xzse93,
      Cookie: cookie,
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
    },
  });
  return { data: res.data.data, paging: res.data.paging };
};
