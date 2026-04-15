import { WebviewView, ExtensionContext, workspace } from "vscode";
import { showInfo } from "../utils/errorMessage";
import {
  getHomeTimeline,
  getXUserTweets,
  getOrSetXCredential,
  getHomeTimelineNext,
  getHomeLatestTimeline,
  getHomeLatestTimelineNext,
  getTweetDetail,
  getXUserInfo,
  getXSearchTimeline,
  refreshQueryIds,
} from "../api/x";
import { CommandsType } from "../../types/commands";
import { xAJAX, xItem, xUser } from "../../types/x";
import { BaseWebviewProvider, IncomingMessage } from "./baseWebviewProvider";

// X 转换器
function mapXTweetToXItem(tweet: any): xItem | null {
  if (!tweet) return null;

  // 兼容不同的 Tweet 包装结构
  let t = tweet;
  if (t?.__typename === "TweetWithVisibilityResults" && t.tweet) {
    t = t.tweet;
  }
  if (t?.tweet_results?.result) {
    t = t.tweet_results.result;
  }
  if (t?.result) {
    t = t.result;
  }

  if (!t?.legacy) {
    return null;
  }
  const legacy = t.legacy;

  const truncateText = (value: string, maxLength: number) => {
    const normalized = value.replace(/\r\n/g, "\n").trim();
    if (normalized.length <= maxLength) {
      return normalized;
    }
    return normalized.slice(0, maxLength).trimEnd() + "...";
  };

  // 提取用户信息，处理可能的嵌套
  let userResult =
    t.core?.user_results?.result || t.author?.user_results?.result;
  // 有时 result 里面还嵌套一层 result
  if (userResult?.result) {
    userResult = userResult.result;
  }
  const userLegacy = userResult?.legacy;
  const userCore = userResult?.core;

  let user: xUser | undefined;
  if (userResult) {
    const name = userLegacy?.name || userCore?.name || userResult.name;
    const sName =
      userLegacy?.screen_name ||
      userCore?.screen_name ||
      userResult.screen_name;
    const avatarUrl =
      userLegacy?.profile_image_url_https ||
      userResult.avatar?.image_url ||
      userResult.profile_image_url_https;

    user = {
      id: userResult.rest_id || "0",
      name: name,
      screen_name_raw: sName,
      screen_name:
        name && sName && name !== sName
          ? `${name} (@${sName})`
          : name || sName || "Unknown",
      avatar_hd: avatarUrl?.replace("_normal", ""),
      avatar_large: avatarUrl?.replace("_normal", ""),
      followers_count: userLegacy?.followers_count || 0,
      following:
        userLegacy?.following ||
        userResult.relationship_perspectives?.following ||
        false,
    };
  } else {
    user = {
      id: legacy.user_id_str || "0",
      screen_name: "User_" + legacy.user_id_str,
    };
  }

  const pic_ids: string[] = [];
  const pic_infos: any = {};

  if (legacy.extended_entities?.media) {
    legacy.extended_entities.media.forEach((m: any) => {
      const picId = m.id_str;
      pic_ids.push(picId);
      pic_infos[picId] = {
        pic_id: picId,
        type: m.type === "video" ? "video" : "pic",
        large: {
          url: m.media_url_https,
          width: m.original_info?.width || 0,
          height: m.original_info?.height || 0,
        },
        bmiddle: {
          url: m.media_url_https,
          width: m.original_info?.width || 0,
          height: m.original_info?.height || 0,
        },
        thumbnail: {
          url: m.media_url_https,
          width: m.original_info?.width || 0,
          height: m.original_info?.height || 0,
        },
        largest: {
          url: m.media_url_https,
          width: m.original_info?.width || 0,
          height: m.original_info?.height || 0,
        },
      };

      // video support
      if (m.type === "video" || m.type === "animated_gif") {
        pic_infos[picId].video_url = m.video_info?.variants?.find(
          (v: any) => v.content_type === "video/mp4",
        )?.url;
      }
    });
  }

  // 处理长推文 (NoteTweet)
  const summaryText = (legacy.full_text || "").replace(
    /\s*https:\/\/t\.co\/\S+$/g,
    "",
  );
  const noteTweetText = t.note_tweet?.note_tweet_results?.result?.text;
  const longTextContent = noteTweetText || summaryText;
  const isLongText =
    !!t.note_tweet?.is_expandable ||
    (!!noteTweetText && noteTweetText !== summaryText);
  const previewText = isLongText
    ? truncateText(longTextContent, 140)
    : summaryText;

  return {
    id: legacy.id_str || legacy.conversation_id_str,
    text: previewText,
    text_raw: previewText,
    isLongText,
    longTextContent,
    source: legacy.source || "X",
    pic_ids,
    mblogid: legacy.id_str,
    mblogtype: 0,
    bid: legacy.id_str,
    pic_infos,
    created_at: legacy.created_at,
    user,
    comments_count: legacy.reply_count || 0,
    reposts_count: legacy.retweet_count || 0,
    attitudes_count: legacy.favorite_count || 0,
    attitudes_status: legacy.favorited ? 1 : 0,
    pic_num: pic_ids.length,
    comments: undefined,
  };
}

function parseXTimelineToXAJAX(data: any): xAJAX {
  const statuses: xItem[] = [];
  let cursor = "";

  // Helper to extract instructions
  const extractInstructions = (obj: any): any[] => {
    if (!obj) return [];
    if (obj.instructions) return obj.instructions;
    for (const key in obj) {
      if (typeof obj[key] === "object") {
        const res = extractInstructions(obj[key]);
        if (res.length > 0) return res;
      }
    }
    return [];
  };

  const instructions = extractInstructions(data);
  for (const instruction of instructions) {
    if (instruction.type === "TimelineAddEntries") {
      for (const entry of instruction.entries || []) {
        const entryId = entry.entryId || "";

        // 提取推文内容的辅助函数
        const processItem = (itemContent: any) => {
          if (
            itemContent?.itemType === "TimelineTweet" ||
            itemContent?.tweet_results?.result
          ) {
            const tweetContent = itemContent.tweet_results?.result;
            if (tweetContent) {
              const mapped = mapXTweetToXItem(tweetContent);
              if (mapped) statuses.push(mapped);
            }
          }
        };

        if (
          entryId.startsWith("tweet-") ||
          entryId.startsWith("conversation-")
        ) {
          processItem(entry.content?.itemContent);
        } else if (entry.content?.entryType === "TimelineTimelineModule") {
          // 处理嵌套模块（如评论列表、会话线索）
          const items = entry.content?.items || [];
          for (const mItem of items) {
            processItem(mItem.item?.itemContent);
          }
        } else if (entryId.startsWith("cursor-bottom")) {
          cursor = entry.content?.value;
        }
      }
    }
  }

  return {
    ok: 1,
    since_id: 0,
    max_id: 0,
    total_number: statuses.length,
    statuses: statuses,
    since_id_str: "",
    max_id_str: cursor,
    data: data,
    payload: data,
  };
}

export class XProvider extends BaseWebviewProvider {
  private currentCursor: string = "";

  constructor(context: ExtensionContext) {
    super(context, {
      distPath: "x/dist",
      devPort: 5179,
      title: "X",
      scrollKey: "xScrollPosition",
      restoreCommand: "RESTORE_SCROLL_POSITION",
      saveCommand: "SAVE_SCROLL_POSITION",
    });
    // 从配置加载自定义 Query ID（X 会定期轮换）
    refreshQueryIds();
  }

  protected async handleCustomMessage(
    message: IncomingMessage,
    webviewView: WebviewView,
  ) {
    const { command, payload, uuid } = message;
    const config = workspace.getConfiguration("touchfish");
    const cookie = config.get<string>("xCookie");
    const authorization = config.get<string>("xAuthorization");
    const csrfToken = config.get<string>("xCsrfToken");

    let credential = null;
    if (cookie && authorization && csrfToken) {
      credential = { cookie, authorization, csrfToken };
    }

    switch (command) {
      case "GETDATA": {
        // payload is tab id. If refresh vs next page.
        // If it's a number/string but we want pagination, we'll try to keep track of cursor.
        // Actually X's GETDATA passes payload as `{ group_id, max_id, ... }` or just tab.
        // Let's assume pagination happens with another command or parsing payload.
        let activeTab = "hot";
        let isNextPage = false;
        if (typeof payload === "object") {
          isNextPage = !!payload.max_id;
          if (isNextPage) {
            this.currentCursor =
              typeof payload.max_id === "string"
                ? payload.max_id
                : payload.max_id.toString();
          }
          if (payload.group_id) activeTab = payload.group_id; // For compat maybe
        } else if (typeof payload === "string") {
          if (payload.includes("max_id=")) {
            const match = payload.match(/max_id=([^&]*)/);
            if (match && match[1]) {
              isNextPage = true;
              this.currentCursor = match[1];
            }
            if (payload.startsWith("latest")) activeTab = "latest";
          } else {
            activeTab = payload;
          }
        }

        let res;
        if (activeTab === "latest") {
          if (isNextPage && this.currentCursor) {
            res = await getHomeLatestTimelineNext(
              { cursor: this.currentCursor },
              credential,
            );
          } else {
            res = await getHomeLatestTimeline(credential, 20);
          }
        } else {
          if (isNextPage && this.currentCursor) {
            res = await getHomeTimelineNext(
              { cursor: this.currentCursor },
              credential,
            );
          } else {
            res = await getHomeTimeline(credential, 20);
          }
        }

        if (res.code !== 0) {
          if (res.code === 401 || res.code === -1) {
            // Try getting explicitly
            credential = await getOrSetXCredential();
            if (credential) {
              if (activeTab === "latest") {
                res = await getHomeLatestTimeline(credential, 20);
              } else {
                res = await getHomeTimeline(credential, 20);
              }
            }
          } else {
            showInfo("获取 X 数据失败: " + res.message);
          }
        }

        const mappedData =
          res.code === 0
            ? parseXTimelineToXAJAX(res.data)
            : { ok: 0, msg: res.message };

        // "正在关注" tab 下所有帖子都来自已关注的用户
        if (activeTab === "latest" && "statuses" in mappedData) {
          mappedData.statuses.forEach((s: any) => {
            if (s.user) s.user.following = true;
          });
        }

        webviewView.webview.postMessage({
          command: "SENDDATA",
          payload: mappedData,
          uuid,
        } as CommandsType<xAJAX>);
        break;
      }

      case "GETCOMMENT": {
        // xComment mapping
        const tweetId = typeof payload === "object" ? payload.id : payload;
        const res = await getTweetDetail(tweetId.toString(), credential);
        if (res.code !== 0) {
          webviewView.webview.postMessage({
            command: "SENDCOMMENT",
            payload: { ok: 0, msg: res.message },
            uuid,
          });
          break;
        }

        const xData = parseXTimelineToXAJAX(res.data);
        // The first status is the tweet, subsequent are replies ?
        // Usually TweetDetail returns threaded conversation.
        const comments = xData.statuses.slice(1).map((s) => ({
          ...s,
          like_counts: s.attitudes_count,
          comments: [],
        }));

        webviewView.webview.postMessage({
          command: `SENDCOMMENT`,
          payload: { ok: 1, payload: payload, data: comments },
          uuid,
        } as CommandsType<xAJAX>);
        break;
      }

      case "GETUSERBLOG": {
        let uid = "";
        if (typeof payload === "object") {
          uid = payload.uid || payload.userId;
        } else if (typeof payload === "string") {
          try {
            const parsed = JSON.parse(payload);
            uid = parsed.uid || parsed.userId;
          } catch {
            uid = payload;
          }
        }

        const res = await getXUserTweets(
          { userId: uid.toString() },
          credential,
        );
        const mappedData =
          res.code === 0
            ? parseXTimelineToXAJAX(res.data)
            : { ok: 0, msg: res.message };
        webviewView.webview.postMessage({
          command: `SENDUSERBLOG`,
          payload: mappedData,
          uuid,
        } as CommandsType<xAJAX>);
        break;
      }

      case "GETLONGTEXT": {
        const tweetId = payload.toString();
        const res = await getTweetDetail(tweetId, credential);
        let mappedData: any = { ok: 0, msg: "加载详情失败" };
        if (res.code === 0) {
          const xAJAX = parseXTimelineToXAJAX(res.data);
          // 在详情页返回的结果中寻找目标推文
          const targetTweet = xAJAX.statuses.find(
            (s) => s.id === tweetId || s.mblogid === tweetId,
          );
          if (targetTweet) {
            mappedData = {
              ok: 1,
              data: {
                ...targetTweet,
                longTextContent:
                  targetTweet.longTextContent ||
                  targetTweet.text_raw ||
                  targetTweet.text,
              },
            };
          }
        }
        webviewView.webview.postMessage({
          command: `SENDLONGTEXT`,
          payload: mappedData,
          uuid,
        });
        break;
      }

      case "GETUSERBYNAME": {
        const screenName = payload.toString().replace("@", "");
        const res = await getXUserInfo(screenName, credential);
        let mappedData: any = { ok: 0, msg: "获取用户信息失败" };
        if (res.code === 0 && res.data?.user?.result) {
          const userResult = res.data.user.result;
          const userLegacy = userResult.legacy;
          const userCore = userResult.core;
          const name = userLegacy?.name || userCore?.name || userResult.name;
          const sName =
            userLegacy?.screen_name ||
            userCore?.screen_name ||
            userResult.screen_name;
          const avatarUrl =
            userLegacy?.profile_image_url_https || userResult.avatar?.image_url;

          mappedData = {
            ok: 1,
            data: {
              id: userResult.rest_id,
              name: name,
              screen_name_raw: sName,
              screen_name:
                name && sName && name !== sName
                  ? `${name} (@${sName})`
                  : name || sName || "Unknown",
              avatar_hd: avatarUrl?.replace("_normal", ""),
              followers_count: userLegacy?.followers_count || 0,
              description: userLegacy?.description,
              location: userLegacy?.location,
              following: userLegacy?.following || false,
            },
          };
        }
        webviewView.webview.postMessage({
          command: `SENDUSERBYNAME`,
          payload: mappedData,
          uuid,
        });
        break;
      }

      case "GETSEARCH": {
        // 前端传来的是微博格式: "100103type=60&q=关键词&t="，需要提取 q 参数
        const keyword = payload.toString();
        const res = await getXSearchTimeline(
          { query: keyword, count: 20 },
          credential,
        );
        const mappedData =
          res.code === 0
            ? parseXTimelineToXAJAX(res.data)
            : { ok: 0, msg: res.message };
        webviewView.webview.postMessage({
          command: `SENDSEARCH`,
          payload: mappedData,
          uuid,
        });
        break;
      }

      // Fallback handlers to avoid errors
      default: {
        webviewView.webview.postMessage({
          payload: { ok: 0, msg: `X 模块暂不支持 ${command} 操作` },
          uuid,
        });
        break;
      }
    }
  }
}
