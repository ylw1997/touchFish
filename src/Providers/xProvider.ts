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
} from "../api/x";
import { CommandsType } from "../../types/commands";
import { xAJAX, xItem, xUser } from "../../types/x";
import { BaseWebviewProvider, IncomingMessage } from "./baseWebviewProvider";

// X 转换器
function mapXTweetToXItem(tweet: any): xItem | null {
  if (!tweet || !tweet.legacy) return null;
  const legacy = tweet.legacy;
  const core = tweet.core?.user_results?.result;
  const userLegacy = core?.legacy;

  let user: xUser | undefined;
  if (userLegacy) {
    user = {
      id: Number(core.rest_id) || 0,
      screen_name: userLegacy.screen_name || userLegacy.name,
      avatar_hd: userLegacy.profile_image_url_https?.replace("_normal", ""),
      avatar_large: userLegacy.profile_image_url_https?.replace("_normal", ""),
      followers_count: userLegacy.followers_count,
      following: userLegacy.following,
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

  // X 的 full_text 末尾通常带 https://t.co/xxx 短链接，指向媒体或推文本身，需要移除
  const cleanText = (legacy.full_text || "").replace(/\s*https:\/\/t\.co\/\S+$/g, "");

  return {
    id: legacy.id_str || legacy.conversation_id_str,
    text: cleanText,
    text_raw: cleanText,
    isLongText: false,
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
        if (entry.entryId.startsWith("tweet-")) {
          const tweetContent =
            entry.content?.itemContent?.tweet_results?.result;
          const mapped = mapXTweetToXItem(tweetContent);
          if (mapped) statuses.push(mapped);
        } else if (entry.entryId.startsWith("cursor-bottom")) {
          cursor = entry.content?.value;
        }
      }
    }
  }

  return {
    ok: 1,
    since_id: 0,
    max_id: 0,
    since_id_str: "",
    max_id_str: cursor,
    total_number: statuses.length,
    statuses,
    data: {},
    payload: null,
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
            this.currentCursor = typeof payload.max_id === "string" ? payload.max_id : payload.max_id.toString();
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

      case "GETHOTSEARCH": {
        webviewView.webview.postMessage({
          command: `SENDHOTSEARCH`,
          payload: { ok: 1, data: { realtime: [] } }, // mocking empty hot search for X
          uuid,
        } as CommandsType<xAJAX>);
        break;
      }

      case "GET_MY_USER_INFO": {
        webviewView.webview.postMessage({
          command: `SENDUSERBYNAME`,
          payload: { ok: 0, msg: "X 目前不需要使用自定义用户 ID 搜索" },
          uuid,
        });
        break;
      }

      // Fallback handlers to avoid errors
      default: {
        webviewView.webview.postMessage({
          payload: { ok: 0, msg: "Method not supported for X yet." },
          uuid,
        });
        break;
      }
    }
  }
}
