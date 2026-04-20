import { WebviewView, ExtensionContext, workspace } from "vscode";
import { showInfo } from "../utils/errorMessage";
import {
  getHomeTimeline,
  getHomeTimelineRefresh,
  getXUserTweets,
  getOrSetXCredential,
  getHomeTimelineNext,
  getHomeLatestTimeline,
  getHomeLatestTimelineNext,
  getTweetDetail,
  getXUserInfo,
  getXSearchTimeline,
  refreshQueryIds,
  followXUser,
  unfollowXUser,
  translateXPost,
  createXTweet,
  repostXTweet,
  uploadXMedia,
  favoriteXTweet,
  unfavoriteXTweet,
  getXFollowing,
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
    // 优先使用 avatar.image_url (高质量)，其次 legacy.profile_image_url_https
    const avatarUrl =
      userResult.avatar?.image_url ||
      userLegacy?.profile_image_url_https ||
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
        // GIF动图(animated_gif)也当作视频处理，因为有video_info.variants
        type: m.type === "video" || m.type === "animated_gif" ? "video" : "pic",
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
  // 处理嵌套的转推或引用推文
  const retweetedTweetRaw =
    t.retweeted_status_result?.result || legacy.retweeted_status_result?.result;
  const quotedTweetRaw =
    t.quoted_status_result?.result || legacy.quoted_status_result?.result;

  const is_retweet = !!retweetedTweetRaw;
  const is_quote = !!quotedTweetRaw && !is_retweet;

  const retweetedTweet = retweetedTweetRaw || quotedTweetRaw;
  const retweeted_status = retweetedTweet
    ? mapXTweetToXItem(retweetedTweet)
    : undefined;

  // 处理文章 (X Article)
  const articleResult = t.article?.article_results?.result;
  let article: xItem["article"];
  if (articleResult) {
    article = {
      id: articleResult.rest_id,
      title: articleResult.title,
      preview_text: articleResult.preview_text,
      cover_url: articleResult.cover_media?.media_info?.original_img_url,
    };
  }

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
    retweeted_status: retweeted_status || undefined,
    article,
    is_retweet,
    is_quote,
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

  const handleEntry = (entry: any) => {
    if (!entry) return;
    const entryId = entry.entryId || "";
    const content = entry.content || {};

    // 1. 处理推文项
    if (
      entryId.startsWith("tweet-") ||
      entryId.startsWith("conversation-") ||
      content.itemContent?.itemType === "TimelineTweet"
    ) {
      processItem(content.itemContent);
    }
    // 2. 处理嵌套模块
    else if (content.entryType === "TimelineTimelineModule") {
      const items = content.items || [];
      for (const mItem of items) {
        processItem(mItem.item?.itemContent);
      }
    }
    // 3. 处理游标 (分页使用)
    else if (
      entryId.startsWith("cursor-bottom") ||
      content.cursorType === "Bottom"
    ) {
      if (content.value) {
        cursor = content.value;
      }
    }
  };

  for (const instruction of instructions) {
    if (instruction.type === "TimelineAddEntries") {
      for (const entry of instruction.entries || []) {
        handleEntry(entry);
      }
    } else if (instruction.type === "TimelineReplaceEntry") {
      handleEntry(instruction.entry);
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
    // 从 cookie 中自动提取 ct0 作为 csrfToken
    const csrfToken = cookie?.match(/(?:^|;\s*)ct0=([^;]+)/)?.[1];

    let credential = null;
    if (cookie && csrfToken) {
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
        let isRefresh = false;
        let seenTweetIds: string[] = [];
        if (typeof payload === "object") {
          isNextPage = !!payload.max_id;
          isRefresh = !!payload.refresh;
          seenTweetIds = Array.isArray(payload.seenTweetIds)
            ? payload.seenTweetIds
                .map((id: unknown) => String(id))
                .filter(Boolean)
            : [];
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
              { cursor: this.currentCursor, seenTweetIds },
              credential,
            );
          } else if (isRefresh) {
            res = await getHomeLatestTimelineNext(
              { count: 20, seenTweetIds },
              credential,
            );
          } else {
            res = await getHomeLatestTimeline(credential, 20);
          }
        } else {
          if (isNextPage && this.currentCursor) {
            res = await getHomeTimelineNext(
              { cursor: this.currentCursor, seenTweetIds },
              credential,
            );
          } else if (isRefresh) {
            res = await getHomeTimelineRefresh(credential, 20, seenTweetIds);
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

      case "GET_MY_USER_INFO": {
        // 直接从 cookie 中提取用户 ID (twid 字段)
        const twidMatch = cookie?.match(/(?:^|;\s*)twid=u%3D(\d+)/);
        const userId = twidMatch?.[1];

        if (!userId) {
          webviewView.webview.postMessage({
            command: "SENDUSERBYNAME",
            payload: {
              ok: 0,
              msg: "未在 Cookie 中找到有效的 UserID，请重新登录",
            },
            uuid,
          });
          break;
        }

        const { getXUserTweets } = await import("../api/x");
        const res = await getXUserTweets({ userId }, credential);

        let mappedData: any = { ok: 0, msg: "获取个人资料失败" };

        if (res.code === 0 && res.data) {
          const userResult = res.data.user?.result;
          
          let finalUser = userResult;
          // 严格按照 JSON 路径：data.user.result.timeline.timeline.instructions
          if (!finalUser?.legacy) {
            const instructions = res.data.user?.result?.timeline?.timeline?.instructions || [];
            // 1. 定位 TimelineAddEntries
            const addEntriesInst = instructions.find((i: any) => i.type === 'TimelineAddEntries');
            if (addEntriesInst?.entries) {
              // 2. 找到第一个包含推文的 entry (entryId 包含 tweet-)
              const tweetEntry = addEntriesInst.entries.find((e: any) => e.entryId?.startsWith('tweet-'));
              if (tweetEntry) {
                // 3. 提取核心路径：content.itemContent.tweet_results.result.core.user_results.result
                const u = tweetEntry.content?.itemContent?.tweet_results?.result?.core?.user_results?.result;
                if (u?.legacy) {
                  finalUser = u;
                }
              }
            }
          }

          const legacy = finalUser?.legacy;

          if (finalUser && legacy) {

            // 根据 JSON 示例和实际表现进行最高优先级的字段捕获
            const avatarUrl = finalUser.avatar?.image_url
              || (finalUser as any).avatar_url_https
              || legacy.profile_image_url_https
              || "";

            mappedData = {
              ok: 1,
              data: {
                id: finalUser.rest_id || userId,
                name: legacy.name || (finalUser as any).core?.name || "",
                screen_name_raw: legacy.screen_name || (finalUser as any).core?.screen_name || "",
                screen_name: (legacy.name || (finalUser as any).core?.name) 
                    ? `${legacy.name || (finalUser as any).core?.name} (@${legacy.screen_name || (finalUser as any).core?.screen_name})` 
                    : (legacy.screen_name || (finalUser as any).core?.screen_name),
                avatar_hd: avatarUrl?.replace(/_normal/, "_400x400"),
                followers_count_str: String(legacy.followers_count || 0),
                friends_count_str: String(legacy.friends_count || 0),
                descText: legacy.description || (finalUser as any).profile_bio?.description || "",
                location: legacy.location?.location || legacy.location || "",
                isOwner: true,
              },
            };
          } else {
             mappedData = { ok: 1, data: { id: userId, name: "我的个人页面", isOwner: true } };
          }
        }

        webviewView.webview.postMessage({
          command: "SENDUSERBYNAME",
          payload: mappedData,
          uuid,
        });
        break;
      }

      case "GET_TRANSLATION": {
        const { id } = payload;
        const res = await translateXPost(id.toString(), credential);
        webviewView.webview.postMessage({
          command: "SEND_TRANSLATION",
          payload:
            res.code === 0
              ? { ok: 1, data: res.data }
              : { ok: 0, msg: res.message },
          uuid,
        });
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
        let cursor = "";
        if (typeof payload === "object") {
          uid = payload.uid || payload.userId;
          cursor = payload.cursor || "";
        } else if (typeof payload === "string") {
          try {
            const parsed = JSON.parse(payload);
            uid = parsed.uid || parsed.userId;
            cursor = parsed.cursor || "";
          } catch {
            uid = payload;
          }
        }

        if (!uid) {
          webviewView.webview.postMessage({
            command: `SENDUSERBLOG`,
            payload: { ok: 0, msg: "未提供用户 ID" },
            uuid,
          });
          break;
        }

        const res = await getXUserTweets(
          { userId: uid.toString(), cursor: cursor || undefined },
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
          const following =
            userLegacy?.following ??
            userResult.relationship_perspectives?.following ??
            userCore?.relationship_perspectives?.following ??
            false;
          const followersCount = userLegacy?.followers_count;
          const friendsCount = userLegacy?.friends_count;

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
              followers_count: followersCount || 0,
              followers_count_str:
                typeof followersCount === "number"
                  ? String(followersCount)
                  : undefined,
              friends_count_str:
                typeof friendsCount === "number"
                  ? String(friendsCount)
                  : undefined,
              descText: userLegacy?.description,
              location: userLegacy?.location,
              following,
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
        let params: any;
        if (typeof payload === "string") {
          // 兼容旧版单一字符串或可能的 JSON 字符串
          try {
            const parsed = JSON.parse(payload);
            if (typeof parsed === "object" && parsed !== null) {
              params = {
                query: parsed.query,
                cursor: parsed.cursor,
                count: 20,
                product: parsed.product || "Top", // 恢复为 Top
              };
            } else {
              params = { query: payload, count: 20, product: "Top" };
            }
          } catch {
            params = { query: payload, count: 20, product: "Top" };
          }
        } else if (payload && typeof payload === "object") {
          params = {
            query: payload.query,
            cursor: payload.cursor,
            count: 20,
            product: payload.product || "Top",
          };
        }

        if (!params || !params.query) {
          console.error("X Search: Invalid payload", payload);
          break;
        }

        console.log("X Search Request:", JSON.stringify(params));
        const res = await getXSearchTimeline(params, credential);
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

      case "GETFOLLOW": {
        const userId = payload.toString();
        const res = await followXUser(userId, credential);
        webviewView.webview.postMessage({
          command: "SENDFOLLOW",
          payload: res.code === 0 ? { ok: 1 } : { ok: 0, msg: res.message },
          uuid,
        });
        break;
      }

      case "GETCANCELFOLLOW": {
        const userId = payload.toString();
        const res = await unfollowXUser(userId, credential);
        webviewView.webview.postMessage({
          command: "SENDCANCELFOLLOW",
          payload: res.code === 0 ? { ok: 1 } : { ok: 0, msg: res.message },
          uuid,
        });
        break;
      }

      case "GETSETLIKE": {
        const tweetId = payload.toString();
        const res = await favoriteXTweet(tweetId, credential);
        webviewView.webview.postMessage({
          command: "SENDSETLIKE",
          payload: res.code === 0 ? { ok: 1 } : { ok: 0, msg: res.message },
          uuid,
        });
        break;
      }

      case "GETCANCELLIKE": {
        const tweetId = payload.toString();
        const res = await unfavoriteXTweet(tweetId, credential);
        webviewView.webview.postMessage({
          command: "SENDCANCELLIKE",
          payload: res.code === 0 ? { ok: 1 } : { ok: 0, msg: res.message },
          uuid,
        });
        break;
      }

      case "GETCREATECOMMENTS": {
        const { id, comment } = payload;
        const res = await createXTweet(
          comment,
          { replyToId: id.toString() },
          credential,
        );
        webviewView.webview.postMessage({
          command: "SENDCREATECOMMENTS",
          payload:
            res.code === 0
              ? { ok: 1, data: res.data }
              : { ok: 0, msg: res.message },
          uuid,
        });
        break;
      }

      case "GETCREATEREPOST": {
        const { id, comment, screen_name } = payload;
        const res = await repostXTweet(
          comment,
          id.toString(),
          screen_name,
          credential,
        );
        webviewView.webview.postMessage({
          command: "SENDCREATEREPOST",
          payload: res.code === 0 ? { ok: 1 } : { ok: 0, msg: res.message },
          uuid,
        });
        break;
      }

      case "GETFOLLOWING": {
        let userId = "";
        let cursor = "";
        if (typeof payload === "object") {
          userId = payload.userId;
          cursor = payload.cursor || "";
        } else if (typeof payload === "string") {
          try {
            const parsed = JSON.parse(payload);
            userId = parsed.userId;
            cursor = parsed.cursor || "";
          } catch {
            userId = payload;
          }
        }

        if (!userId) {
          webviewView.webview.postMessage({
            command: "SENDFOLLOWING",
            payload: { ok: 0, msg: "未提供用户 ID" },
            uuid,
          });
          break;
        }

        const res = await getXFollowing(
          userId.toString(),
          20,
          cursor || undefined,
          credential,
        );
        webviewView.webview.postMessage({
          command: "SENDFOLLOWING",
          payload:
            res.code === 0
              ? { ok: 1, data: res.data }
              : { ok: 0, msg: res.message },
          uuid,
        });
        break;
      }

      case "GETUPLOADIMGURL": {
        const data = JSON.parse(payload);
        const base64Data = data.base64.replace(/^data:image\/\w+;base64,/, "");
        const res = await uploadXMedia(
          {
            buffer: Buffer.from(base64Data, "base64"),
            type: data.type,
            size: data.size,
          },
          credential,
        );
        webviewView.webview.postMessage({
          command: "SENDUPLOADIMGURL",
          payload:
            res.code === 0
              ? { ok: 1, data: { pic_id: res.data?.media_id_string } }
              : { ok: 0, msg: res.message },
          uuid,
        });
        break;
      }

      case "GETNEWBLOGRESULT": {
        const data = JSON.parse(payload);
        // 处理来自 SendXDrawer 的字段：content -> status, pic_id -> mediaIds
        let mediaIds: string[] = [];
        if (data.pic_id) {
          try {
            const pics = JSON.parse(data.pic_id);
            if (Array.isArray(pics)) {
              mediaIds = pics.map((p: any) => p.pid).filter(Boolean);
            }
          } catch (e) {
            console.error("Failed to parse pic_id in GETNEWBLOGRESULT", e);
          }
        }

        const res = await createXTweet(
          data.content || data.status,
          { mediaIds: mediaIds.length > 0 ? mediaIds : data.media_ids },
          credential,
        );
        webviewView.webview.postMessage({
          command: "SENDNEWBLOGRESULT",
          payload:
            res.code === 0
              ? { ok: 1, data: res.data }
              : { ok: 0, msg: res.message },
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
