import axios, { AxiosError } from "axios";
import { ClientTransaction, handleXMigration } from "x-client-transaction-id";
import * as crypto from "crypto";

const X_BASE_URL = "https://x.com";

// 默认 Query ID，会被 X 定期轮换。如果 404，需要从浏览器 DevTools 抓取最新值。
// @operation: HomeTimeline
export let X_HOME_TIMELINE_QUERY_ID = "3tb-_5Lf7kdCZ1cFHmsEfg";
// @operation: TweetDetail
export let X_TWEET_DETAIL_QUERY_ID = "QrLp7AR-eMyamw8D1N9l6A";
// @operation: SearchTimeline
export let X_SEARCH_TIMELINE_QUERY_ID = "XN_HccZ9SU-miQVvwTAlFQ";
// @operation: UserByScreenName
export let X_USER_BY_SCREEN_NAME_QUERY_ID = "IGgvgiOx4QZndDHuD3x9TQ";
// @operation: UserTweets
export let X_USER_TWEETS_QUERY_ID = "naBcZ4al-iTCFBYGOAMzBQ";
// @operation: CreateTweet
export let X_CREATE_TWEET_QUERY_ID = "c50A_puUoQGK_4SXseYz3A";
// @operation: HomeLatestTimeline
export const X_HOME_LATEST_TIMELINE_QUERY_ID = "eObmT5Nuapp04u8bYWf49Q";
// @operation: FavoriteTweet
export const X_FAVORITE_TWEET_QUERY_ID = "lI07N6Otwv1PhnEgXILM7A";
// @operation: UnfavoriteTweet
export const X_UNFAVORITE_TWEET_QUERY_ID = "ZYKSe-w7KEslx3JhSIk5LA";
// @operation: Following
export let X_FOLLOWING_QUERY_ID = "lQxnNSmlJkQHod0yzbVYDg";

/**
 * 从 VS Code 配置中读取自定义 Query ID 以覆盖默认值。
 * 在浏览器 Network 面板搜索 "SearchTimeline" 可抓取最新 ID。
 */
export function refreshQueryIds() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const vscode = require("vscode");
    const config = vscode.workspace.getConfiguration("touchfish");
    const ids: Record<string, string> | undefined = config.get("xQueryIds");
    if (ids) {
      if (ids.homeTimeline) X_HOME_TIMELINE_QUERY_ID = ids.homeTimeline;
      if (ids.tweetDetail) X_TWEET_DETAIL_QUERY_ID = ids.tweetDetail;
      if (ids.searchTimeline) X_SEARCH_TIMELINE_QUERY_ID = ids.searchTimeline;
      if (ids.userByScreenName)
        X_USER_BY_SCREEN_NAME_QUERY_ID = ids.userByScreenName;
      if (ids.userTweets) X_USER_TWEETS_QUERY_ID = ids.userTweets;
      if (ids.createTweet) X_CREATE_TWEET_QUERY_ID = ids.createTweet;
      if (ids.following) X_FOLLOWING_QUERY_ID = ids.following;
    }
  } catch {
    // 前端环境无 vscode 模块，忽略
  }
}

export interface XCredential {
  cookie: string;
  authorization: string | undefined;
  csrfToken: string;
}

export interface XApiResult<T> {
  code: number;
  message?: string;
  data: T | null;
}

export interface XTimelineNextParams {
  cursor?: string;
  seenTweetIds?: string[];
  count?: number;
  withCommunity?: boolean;
  includePromotedContent?: boolean;
}

export interface XTweetDetailParams {
  focalTweetId: string;
  referrer?: string;
  rankingMode?: "Relevance" | "Recency";
  includePromotedContent?: boolean;
  withCommunity?: boolean;
  withQuickPromoteEligibilityTweetFields?: boolean;
  withBirdwatchNotes?: boolean;
  withVoice?: boolean;
  withRuxInjections?: boolean;
}

export interface XSearchTimelineParams {
  query: string;
  cursor?: string;
  product?: "Top" | "Latest";
  count?: number;
}

export interface XUserTweetsParams {
  userId: string;
  cursor?: string;
  count?: number;
}

type XFeatureFlags = Record<string, boolean>;

type ConfigModule = typeof import("../core/config");
type VscodeModule = typeof import("vscode");

export const xHttp = axios.create({
  timeout: 30000,
  paramsSerializer: (params) => {
    const parts: string[] = [];
    for (const key of Object.keys(params)) {
      const val = params[key];
      if (val === undefined || val === null) continue;
      const encoded =
        typeof val === "object"
          ? encodeURIComponent(JSON.stringify(val))
          : encodeURIComponent(String(val));
      parts.push(`${encodeURIComponent(key)}=${encoded}`);
    }
    return parts.join("&");
  },
});

const HOME_TIMELINE_FEATURES: XFeatureFlags = {
  rweb_video_screen_enabled: false,
  profile_label_improvements_pcf_label_in_post_enabled: true,
  responsive_web_profile_redirect_enabled: false,
  rweb_tipjar_consumption_enabled: false,
  verified_phone_label_enabled: false,
  creator_subscriptions_tweet_preview_api_enabled: true,
  responsive_web_graphql_timeline_navigation_enabled: true,
  responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
  premium_content_api_read_enabled: false,
  communities_web_enable_tweet_community_results_fetch: true,
  c9s_tweet_anatomy_moderator_badge_enabled: true,
  responsive_web_grok_analyze_button_fetch_trends_enabled: false,
  responsive_web_grok_analyze_post_followups_enabled: true,
  responsive_web_jetfuel_frame: true,
  responsive_web_grok_share_attachment_enabled: true,
  responsive_web_grok_annotations_enabled: true,
  articles_preview_enabled: true,
  responsive_web_edit_tweet_api_enabled: true,
  graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
  view_counts_everywhere_api_enabled: true,
  longform_notetweets_consumption_enabled: true,
  responsive_web_twitter_article_tweet_consumption_enabled: true,
  content_disclosure_indicator_enabled: true,
  content_disclosure_ai_generated_indicator_enabled: true,
  responsive_web_grok_show_grok_translated_post: true,
  responsive_web_grok_analysis_button_from_backend: true,
  post_ctas_fetch_enabled: false,
  freedom_of_speech_not_reach_fetch_enabled: true,
  standardized_nudges_misinfo: true,
  tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
  longform_notetweets_rich_text_read_enabled: true,
  longform_notetweets_inline_media_enabled: false,
  responsive_web_grok_image_annotation_enabled: true,
  responsive_web_grok_imagine_annotation_enabled: true,
  responsive_web_grok_community_note_auto_translation_is_enabled: true,
  responsive_web_enhance_cards_enabled: false,
};

const TWEET_DETAIL_FIELD_TOGGLES = {
  withArticleRichContentState: true,
  withArticlePlainText: false,
  withArticleSummaryText: true,
  withArticleVoiceOver: true,
  withGrokAnalyze: false,
  withDisallowedReplyControls: false,
};

const SEARCH_TIMELINE_FIELD_TOGGLES = {
  withArticleRichContentState: true,
  withArticlePlainText: false,
  withGrokAnalyze: false,
  withDisallowedReplyControls: false,
};

const SEARCH_TIMELINE_FEATURES: XFeatureFlags = {
  rweb_video_screen_enabled: false,
  rweb_cashtags_enabled: false,
  profile_label_improvements_pcf_label_in_post_enabled: true,
  responsive_web_profile_redirect_enabled: false,
  rweb_tipjar_consumption_enabled: false,
  verified_phone_label_enabled: false,
  creator_subscriptions_tweet_preview_api_enabled: true,
  responsive_web_graphql_timeline_navigation_enabled: true,
  responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
  premium_content_api_read_enabled: false,
  communities_web_enable_tweet_community_results_fetch: true,
  c9s_tweet_anatomy_moderator_badge_enabled: true,
  responsive_web_grok_analyze_button_fetch_trends_enabled: false,
  responsive_web_grok_analyze_post_followups_enabled: true,
  responsive_web_jetfuel_frame: true,
  responsive_web_grok_share_attachment_enabled: true,
  responsive_web_grok_annotations_enabled: true,
  articles_preview_enabled: true,
  responsive_web_edit_tweet_api_enabled: true,
  graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
  view_counts_everywhere_api_enabled: true,
  longform_notetweets_consumption_enabled: true,
  responsive_web_twitter_article_tweet_consumption_enabled: true,
  content_disclosure_indicator_enabled: true,
  content_disclosure_ai_generated_indicator_enabled: true,
  responsive_web_grok_show_grok_translated_post: true,
  responsive_web_grok_analysis_button_from_backend: true,
  post_ctas_fetch_enabled: false,
  freedom_of_speech_not_reach_fetch_enabled: true,
  standardized_nudges_misinfo: true,
  tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
  longform_notetweets_rich_text_read_enabled: true,
  longform_notetweets_inline_media_enabled: false,
  responsive_web_grok_image_annotation_enabled: true,
  responsive_web_grok_imagine_annotation_enabled: true,
  responsive_web_grok_community_note_auto_translation_is_enabled: true,
  responsive_web_enhance_cards_enabled: false,
};

const CREATE_TWEET_FEATURES: XFeatureFlags = {
  premium_content_api_read_enabled: false,
  communities_web_enable_tweet_community_results_fetch: true,
  c9s_tweet_anatomy_moderator_badge_enabled: true,
  responsive_web_grok_analyze_button_fetch_trends_enabled: false,
  responsive_web_grok_analyze_post_followups_enabled: true,
  responsive_web_jetfuel_frame: true,
  responsive_web_grok_share_attachment_enabled: true,
  responsive_web_grok_annotations_enabled: true,
  responsive_web_edit_tweet_api_enabled: true,
  graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
  view_counts_everywhere_api_enabled: true,
  longform_notetweets_consumption_enabled: true,
  responsive_web_twitter_article_tweet_consumption_enabled: true,
  content_disclosure_indicator_enabled: true,
  content_disclosure_ai_generated_indicator_enabled: true,
  responsive_web_grok_show_grok_translated_post: true,
  responsive_web_grok_analysis_button_from_backend: true,
  post_ctas_fetch_enabled: false,
  longform_notetweets_rich_text_read_enabled: true,
  longform_notetweets_inline_media_enabled: false,
  profile_label_improvements_pcf_label_in_post_enabled: true,
  responsive_web_profile_redirect_enabled: false,
  rweb_tipjar_consumption_enabled: false,
  verified_phone_label_enabled: false,
  articles_preview_enabled: true,
  rweb_cashtags_enabled: false,
  responsive_web_grok_community_note_auto_translation_is_enabled: true,
  responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
  freedom_of_speech_not_reach_fetch_enabled: true,
  standardized_nudges_misinfo: true,
  tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
  responsive_web_grok_image_annotation_enabled: true,
  responsive_web_grok_imagine_annotation_enabled: true,
  responsive_web_graphql_timeline_navigation_enabled: true,
  responsive_web_enhance_cards_enabled: false,
};

const USER_PROFILE_FEATURES: XFeatureFlags = {
  hidden_profile_likes_enabled: true,
  hidden_profile_subscriptions_enabled: true,
  rweb_tipjar_consumption_enabled: true,
  responsive_web_graphql_exclude_directive_enabled: true,
  verified_phone_label_enabled: false,
  subscriptions_verification_info_is_identity_verified_enabled: true,
  subscriptions_verification_info_verified_since_enabled: true,
  highlights_tweets_tab_ui_enabled: true,
  responsive_web_twitter_article_notes_tab_enabled: true,
  creator_subscriptions_tweet_preview_api_enabled: true,
  responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
  responsive_web_graphql_timeline_navigation_enabled: true,
};

const USER_PROFILE_FIELD_TOGGLES = {
  withAuxiliaryUserLabels: false,
};

const USER_TWEETS_FEATURES = SEARCH_TIMELINE_FEATURES;

const USER_TWEETS_FIELD_TOGGLES = {
  withArticlePlainText: false,
};

let globalCredential: XCredential | null = null;

export function setGlobalXCredential(credential: XCredential | null) {
  globalCredential = credential;
}

export function getGlobalXCredential(): XCredential | null {
  return globalCredential;
}

function getCredential(credential?: XCredential | null) {
  return credential ?? globalCredential;
}

class XClientTransaction {
  private static instance: ClientTransaction;

  static async getTransactionId(path: string, method: string): Promise<string> {
    if (!this.instance) {
      try {
        const document = await handleXMigration();
        this.instance = await ClientTransaction.create(document as any);
      } catch (err) {
        throw new Error("初始化 XClientTransaction 失败: " + err);
      }
    }
    return this.instance.generateTransactionId(method, path);
  }
}

export function buildXHeaders(
  credential: XCredential,
  extraHeaders: Record<string, string> = {},
): Record<string, string> {
  return {
    accept: "*/*",
    "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
    authorization: credential.authorization || "",
    Cookie: credential.cookie,
    "content-type": "application/json",
    Referer: "https://x.com/home",
    "x-csrf-token": credential.csrfToken,
    "x-twitter-active-user": "yes",
    "x-twitter-auth-type": "OAuth2Session",
    "x-twitter-client-language": "zh-cn",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36",
    ...extraHeaders,
  };
}

function normalizeError(error: unknown): { code: number; message: string } {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<any>;
    const message =
      axiosError.response?.data?.errors?.[0]?.message ||
      axiosError.response?.data?.message ||
      axiosError.message;

    return {
      code: axiosError.response?.status ?? -1,
      message,
    };
  }

  return {
    code: -1,
    message: error instanceof Error ? error.message : "Unknown error",
  };
}

function ensureCredential(credential?: XCredential | null): XCredential {
  const auth = getCredential(credential);
  if (!auth?.cookie || !auth?.authorization || !auth?.csrfToken) {
    throw new Error("请先配置 X 的 cookie、authorization 和 x-csrf-token");
  }
  return auth;
}

function buildLaunchTimelineVariables(count: number) {
  return {
    count,
    includePromotedContent: true,
    requestContext: "launch",
    withCommunity: true,
  };
}

function buildNextTimelinePayload(params: XTimelineNextParams) {
  return {
    variables: {
      count: params.count ?? 20,
      ...(params.cursor ? { cursor: params.cursor } : {}),
      requestContext: "launch",
      includePromotedContent: params.includePromotedContent ?? true,
      withCommunity: params.withCommunity ?? true,
      seenTweetIds: params.seenTweetIds ?? [],
    },
    features: HOME_TIMELINE_FEATURES,
    queryId: X_HOME_TIMELINE_QUERY_ID,
  };
}

export async function getHomeLatestTimeline(
  credential?: XCredential | null,
  count = 20,
): Promise<XApiResult<any>> {
  try {
    const auth = ensureCredential(credential);
    const url = `${X_BASE_URL}/i/api/graphql/${X_HOME_LATEST_TIMELINE_QUERY_ID}/HomeLatestTimeline`;
    const response = await xHttp.get(url, {
      headers: buildXHeaders(auth),
      params: {
        variables: {
          count,
          seenTweetIds: [],
          enableRanking: false,
          includePromotedContent: true,
        },
        features: {
          ...HOME_TIMELINE_FEATURES,
          responsive_web_edit_tweet_api_enabled: true,
        },
      },
    });

    return {
      code: 0,
      data: response.data?.data ?? response.data,
    };
  } catch (error) {
    return { ...normalizeError(error), data: null };
  }
}

export async function getHomeLatestTimelineNext(
  params: XTimelineNextParams,
  credential?: XCredential | undefined | null,
): Promise<XApiResult<any>> {
  try {
    const auth = ensureCredential(credential);
    const url = `${X_BASE_URL}/i/api/graphql/${X_HOME_LATEST_TIMELINE_QUERY_ID}/HomeLatestTimeline`;
    const payload = {
      variables: {
        count: params.count ?? 20,
        ...(params.cursor ? { cursor: params.cursor } : {}),
        seenTweetIds: params.seenTweetIds ?? [],
        enableRanking: false,
        includePromotedContent: true,
      },
      features: {
        ...HOME_TIMELINE_FEATURES,
        responsive_web_edit_tweet_api_enabled: true,
      },
      queryId: X_HOME_LATEST_TIMELINE_QUERY_ID,
    };

    const res = await xHttp.post(url, payload, {
      headers: buildXHeaders(auth),
    });

    return {
      code: 0,
      data: res.data?.data ?? res.data,
    };
  } catch (error) {
    return { ...normalizeError(error), data: null };
  }
}

function buildTweetDetailVariables(params: XTweetDetailParams) {
  return {
    focalTweetId: params.focalTweetId,
    referrer: params.referrer ?? "home",
    with_rux_injections: params.withRuxInjections ?? false,
    rankingMode: params.rankingMode ?? "Relevance",
    includePromotedContent: params.includePromotedContent ?? true,
    withCommunity: params.withCommunity ?? true,
    withQuickPromoteEligibilityTweetFields:
      params.withQuickPromoteEligibilityTweetFields ?? true,
    withBirdwatchNotes: params.withBirdwatchNotes ?? true,
    withVoice: params.withVoice ?? true,
  };
}

function buildSearchTimelineVariables(params: XSearchTimelineParams) {
  return {
    rawQuery: params.query,
    count: params.count ?? 20,
    ...(params.cursor ? { cursor: params.cursor } : {}),
    querySource: "typed_query",
    product: params.product ?? "Top",
    withGrokTranslatedBio: true,
  };
}

function buildUserProfileVariables(screenName: string) {
  return {
    screen_name: screenName.toLowerCase(),
    withSafetyModeUserFields: true,
  };
}

function buildUserTweetsVariables(params: XUserTweetsParams) {
  return {
    userId: params.userId,
    count: params.count ?? 20,
    ...(params.cursor ? { cursor: params.cursor } : {}),
    includePromotedContent: true,
    withQuickPromoteEligibilityTweetFields: true,
    withVoice: true,
    withV2Timeline: true,
  };
}

/**
 * 从 cookie 字符串中提取 ct0 值作为 csrfToken
 */
function extractCt0FromCookie(cookie: string): string | undefined {
  const match = cookie.match(/(?:^|;\s*)ct0=([^;]+)/);
  return match?.[1];
}

/** 固定的公开 Bearer Token，所有 X Web 客户端都用这个 */
const X_DEFAULT_BEARER_TOKEN =
  "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA";

export async function getStoredXCredential(): Promise<XCredential | null> {
  const { getConfigByKey } = (await import("../core/config")) as ConfigModule;
  const cookie = getConfigByKey("xCookie");
  if (!cookie) return null;

  // csrfToken 从 cookie 中的 ct0 自动提取
  const csrfToken = extractCt0FromCookie(cookie);
  if (!csrfToken) return null;

  // authorization 优先读取配置，否则使用默认公开 token
  const authorization =
    getConfigByKey("xAuthorization") || X_DEFAULT_BEARER_TOKEN;

  return { cookie, authorization, csrfToken };
}

async function askForCredentialField(
  key: "xCookie" | "xAuthorization",
  prompt: string,
): Promise<string | undefined> {
  const { getConfigByKey, setConfigByKey } =
    (await import("../core/config")) as ConfigModule;
  const vscode = (await import("vscode")) as VscodeModule;
  const existing = getConfigByKey(key);
  if (existing) {
    return existing;
  }

  const value = await vscode.window.showInputBox({
    prompt,
    placeHolder: prompt,
    ignoreFocusOut: true,
  });

  if (value) {
    await setConfigByKey(key, value);
  }

  return value;
}

export async function getOrSetXCredential(): Promise<XCredential | null> {
  const cookie = await askForCredentialField("xCookie", "请输入 X 的 Cookie");
  if (!cookie) return null;

  const csrfToken = extractCt0FromCookie(cookie);
  if (!csrfToken) return null;

  // authorization 使用默认值，不再要求用户输入
  const authorization = X_DEFAULT_BEARER_TOKEN;

  return { cookie, authorization, csrfToken };
}

export async function getHomeTimeline(
  credential?: XCredential | null,
  count: number = 20,
): Promise<XApiResult<any>> {
  try {
    const auth = ensureCredential(credential);
    const response = await xHttp.get(
      `${X_BASE_URL}/i/api/graphql/${X_HOME_TIMELINE_QUERY_ID}/HomeTimeline`,
      {
        headers: buildXHeaders(auth),
        params: {
          variables: buildLaunchTimelineVariables(count),
          features: HOME_TIMELINE_FEATURES,
        },
      },
    );

    return {
      code: 0,
      data: response.data?.data ?? response.data,
    };
  } catch (error) {
    const normalized = normalizeError(error);
    return {
      code: normalized.code,
      message: normalized.message,
      data: null,
    };
  }
}

export async function getHomeTimelineNext(
  params: XTimelineNextParams,
  credential?: XCredential | null,
): Promise<XApiResult<any>> {
  try {
    const auth = ensureCredential(credential);
    const response = await xHttp.post(
      `${X_BASE_URL}/i/api/graphql/${X_HOME_TIMELINE_QUERY_ID}/HomeTimeline`,
      buildNextTimelinePayload(params),
      {
        headers: buildXHeaders(auth),
      },
    );

    return {
      code: 0,
      data: response.data?.data ?? response.data,
    };
  } catch (error) {
    const normalized = normalizeError(error);
    return {
      code: normalized.code,
      message: normalized.message,
      data: null,
    };
  }
}

export async function getHomeTimelineRefresh(
  credential?: XCredential | null,
  count: number = 20,
  seenTweetIds: string[] = [],
): Promise<XApiResult<any>> {
  return getHomeTimelineNext(
    {
      count,
      seenTweetIds,
    },
    credential,
  );
}

export async function getTweetDetail(
  focalTweetId: string,
  credential?: XCredential | null,
  params: Omit<XTweetDetailParams, "focalTweetId"> = {},
): Promise<XApiResult<any>> {
  try {
    const auth = ensureCredential(credential);
    const response = await xHttp.get(
      `${X_BASE_URL}/i/api/graphql/${X_TWEET_DETAIL_QUERY_ID}/TweetDetail`,
      {
        headers: buildXHeaders(auth, {
          Referer: `https://x.com/i/status/${focalTweetId}`,
        }),
        params: {
          variables: buildTweetDetailVariables({
            focalTweetId,
            ...params,
          }),
          features: HOME_TIMELINE_FEATURES,
          fieldToggles: TWEET_DETAIL_FIELD_TOGGLES,
        },
      },
    );

    return {
      code: 0,
      data: response.data?.data ?? response.data,
    };
  } catch (error) {
    const normalized = normalizeError(error);
    return {
      code: normalized.code,
      message: normalized.message,
      data: null,
    };
  }
}

export async function getXSearchTimeline(
  params: XSearchTimelineParams,
  credential?: XCredential | null,
): Promise<XApiResult<any>> {
  try {
    const auth = ensureCredential(credential);
    const variables = buildSearchTimelineVariables(params);
    const variablesStr = encodeURIComponent(JSON.stringify(variables));
    const featuresStr = encodeURIComponent(
      JSON.stringify(SEARCH_TIMELINE_FEATURES),
    );
    const fieldTogglesStr = encodeURIComponent(
      JSON.stringify(SEARCH_TIMELINE_FIELD_TOGGLES),
    );
    // 手动拼接 URL，绕过 axios paramsSerializer，和浏览器行为完全一致
    const path = `/i/api/graphql/${X_SEARCH_TIMELINE_QUERY_ID}/SearchTimeline`;
    const fullUrl = `${X_BASE_URL}${path}?variables=${variablesStr}&features=${featuresStr}&fieldToggles=${fieldTogglesStr}`;
    const transactionId = await XClientTransaction.getTransactionId(
      path,
      "GET",
    );

    const response = await xHttp.get(fullUrl, {
      headers: buildXHeaders(auth, {
        Referer: `https://x.com/search?q=${encodeURIComponent(
          params.query,
        )}&src=typed_query${params.product === "Latest" ? "&f=live" : ""}`,
        "x-client-transaction-id": transactionId,
      }),
    });

    return {
      code: 0,
      data: response.data?.data ?? response.data,
    };
  } catch (error: any) {
    const normalized = normalizeError(error);
    return {
      code: normalized.code,
      message: normalized.message,
      data: null,
    };
  }
}

export async function getXUserInfo(
  screenName: string,
  credential?: XCredential | null,
): Promise<XApiResult<any>> {
  try {
    const auth = ensureCredential(credential);
    const response = await xHttp.get(
      `${X_BASE_URL}/i/api/graphql/${X_USER_BY_SCREEN_NAME_QUERY_ID}/UserByScreenName`,
      {
        headers: buildXHeaders(auth, {
          Referer: `https://x.com/${screenName}`,
        }),
        params: {
          variables: buildUserProfileVariables(screenName),
          features: USER_PROFILE_FEATURES,
          fieldToggles: USER_PROFILE_FIELD_TOGGLES,
        },
      },
    );

    return {
      code: 0,
      data: response.data?.data ?? response.data,
    };
  } catch (error) {
    const normalized = normalizeError(error);
    return {
      code: normalized.code,
      message: normalized.message,
      data: null,
    };
  }
}

export async function getXUserTweets(
  params: XUserTweetsParams,
  credential?: XCredential | null,
): Promise<XApiResult<any>> {
  try {
    const auth = ensureCredential(credential);
    const response = await xHttp.get(
      `${X_BASE_URL}/i/api/graphql/${X_USER_TWEETS_QUERY_ID}/UserTweets`,
      {
        headers: buildXHeaders(auth),
        params: {
          variables: buildUserTweetsVariables(params),
          features: USER_TWEETS_FEATURES,
          fieldToggles: USER_TWEETS_FIELD_TOGGLES,
        },
      },
    );

    return {
      code: 0,
      data: response.data?.data ?? response.data,
    };
  } catch (error) {
    const normalized = normalizeError(error);
    return {
      code: normalized.code,
      message: normalized.message,
      data: null,
    };
  }
}

// 构建关注和取关的表单数据
function buildFriendshipFormData(userId: string): string {
  const params = new URLSearchParams();
  params.append("include_profile_interstitial_type", "1");
  params.append("include_blocking", "1");
  params.append("include_blocked_by", "1");
  params.append("include_followed_by", "1");
  params.append("include_want_retweets", "1");
  params.append("include_mute_edge", "1");
  params.append("include_can_dm", "1");
  params.append("include_can_media_tag", "1");
  params.append("include_ext_is_blue_verified", "1");
  params.append("include_ext_verified_type", "1");
  params.append("include_ext_profile_image_shape", "1");
  params.append("skip_status", "1");
  params.append("user_id", userId);
  return params.toString();
}

export async function followXUser(
  userId: string,
  credential?: XCredential | null,
): Promise<XApiResult<any>> {
  try {
    const auth = ensureCredential(credential);
    const formData = buildFriendshipFormData(userId);
    const response = await xHttp.post(
      `${X_BASE_URL}/i/api/1.1/friendships/create.json`,
      formData,
      {
        headers: buildXHeaders(auth, {
          "content-type": "application/x-www-form-urlencoded",
        }),
      },
    );

    return {
      code: 0,
      data: response.data,
    };
  } catch (error) {
    const normalized = normalizeError(error);
    return {
      code: normalized.code,
      message: normalized.message,
      data: null,
    };
  }
}

export async function unfollowXUser(
  userId: string,
  credential?: XCredential | null,
): Promise<XApiResult<any>> {
  try {
    const auth = ensureCredential(credential);
    const formData = buildFriendshipFormData(userId);
    const response = await xHttp.post(
      `${X_BASE_URL}/i/api/1.1/friendships/destroy.json`,
      formData,
      {
        headers: buildXHeaders(auth, {
          "content-type": "application/x-www-form-urlencoded",
        }),
      },
    );

    return {
      code: 0,
      data: response.data,
    };
  } catch (error) {
    const normalized = normalizeError(error);
    return {
      code: normalized.code,
      message: normalized.message,
      data: null,
    };
  }
}

/**
 * 翻译推文内容
 * 使用 api.x.com 的 grok 翻译接口
 */
export async function translateXPost(
  tweetId: string,
  credential?: XCredential | null,
): Promise<XApiResult<string>> {
  try {
    const auth = ensureCredential(credential);
    const apiPath = "/2/grok/translation.json";
    const transactionId = await XClientTransaction.getTransactionId(
      apiPath,
      "POST",
    );

    const response = await axios.post(
      `https://api.x.com${apiPath}`,
      {
        content_type: "POST",
        id: tweetId,
        dst_lang: "zh",
      },
      {
        headers: {
          authorization: auth.authorization,
          "content-type": "text/plain;charset=UTF-8",
          Cookie: auth.cookie,
          "x-csrf-token": auth.csrfToken,
          "x-client-transaction-id": transactionId,
          "x-twitter-active-user": "yes",
          "x-twitter-auth-type": "OAuth2Session",
          "x-twitter-client-language": "zh-cn",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36",
        },
      },
    );

    // X 的翻译接口返回的是 base64 字符串
    if (typeof response.data === "string") {
      try {
        const decoded = Buffer.from(response.data, "base64").toString("utf8");
        const parsed = JSON.parse(decoded);
        return {
          code: 0,
          data: parsed.result?.text || "",
        };
      } catch (decodeError) {
        console.error("翻译内容解析失败", decodeError);
        return {
          code: -1,
          message: "翻译内容解析失败，请重试",
          data: null,
        };
      }
    }

    return {
      code: 0,
      data: response.data?.result?.text || "",
    };
  } catch (error) {
    const normalized = normalizeError(error);
    return {
      code: normalized.code,
      message: normalized.message,
      data: null,
    };
  }
}

/**
 * 发送推文或回复 (GraphQL CreateTweet)
 */
export async function createXTweet(
  text: string,
  options: {
    replyToId?: string;
    attachmentUrl?: string;
    mediaIds?: string[];
  } = {},
  credential?: XCredential | null,
): Promise<XApiResult<any>> {
  try {
    const auth = ensureCredential(credential);
    const path = `/i/api/graphql/${X_CREATE_TWEET_QUERY_ID}/CreateTweet`;
    const url = `${X_BASE_URL}${path}`;

    const transactionId = await XClientTransaction.getTransactionId(
      path,
      "POST",
    );

    const payload = {
      variables: {
        tweet_text: text,
        reply: options.replyToId
          ? {
              in_reply_to_tweet_id: options.replyToId,
              exclude_reply_user_ids: [],
            }
          : undefined,
        attachment_url: options.attachmentUrl,
        media: {
          media_entities: (options.mediaIds || []).map((id: string) => ({
            media_id: id,
            tagged_users: [],
          })),
          possibly_sensitive: false,
        },
        semantic_annotation_ids: [],
        disallowed_reply_options: null,
        semantic_annotation_options: {
          source: "Unknown",
        },
      },
      features: CREATE_TWEET_FEATURES,
      queryId: X_CREATE_TWEET_QUERY_ID,
    };

    const response = await xHttp.post(url, payload, {
      headers: buildXHeaders(auth, {
        "x-client-transaction-id": transactionId,
        Referer: options.replyToId
          ? `https://x.com/i/status/${options.replyToId}`
          : options.attachmentUrl || "https://x.com/home",
      }),
    });

    return {
      code: 0,
      data:
        response.data?.data?.create_tweet?.tweet_results?.result ??
        response.data,
    };
  } catch (error) {
    const normalized = normalizeError(error);
    return {
      code: normalized.code,
      message: normalized.message,
      data: null,
    };
  }
}

/**
 * 转发推文 (支持引用转发/Quote Tweet)
 */
export async function repostXTweet(
  comment: string,
  tweetId: string,
  screenName?: string,
  credential?: XCredential | null,
): Promise<XApiResult<any>> {
  // 构建引用转发 URL: https://x.com/username/status/id
  // 如果没有 username，X 有时也能识别 https://x.com/i/status/id，但最好带上
  const username = screenName || "i";
  const attachmentUrl = `https://x.com/${username}/status/${tweetId}`;

  return createXTweet(comment, { attachmentUrl }, credential);
}

/**
 * 上传媒体文件到 X (3 阶段: INIT, APPEND, FINALIZE)
 */
export async function uploadXMedia(
  file: { buffer: Buffer; type: string; size: number },
  credential?: XCredential | null,
): Promise<XApiResult<{ media_id_string: string }>> {
  try {
    const auth = ensureCredential(credential);
    const uploadUrl = "https://upload.x.com/i/media/upload.json";

    // 1. INIT
    const initRes = await xHttp.post(
      `${uploadUrl}?command=INIT&total_bytes=${file.size}&media_type=${encodeURIComponent(
        file.type,
      )}&media_category=tweet_image`,
      null,
      {
        headers: buildXHeaders(auth, {
          "content-type": "application/x-www-form-urlencoded",
        }),
      },
    );

    const mediaId = initRes.data.media_id_string;

    // 2. APPEND
    // 构建 multipart/form-data
    const boundary = `----WebKitFormBoundary${Math.random().toString(36).substring(2)}`;
    const header = `--${boundary}\r\nContent-Disposition: form-data; name="media"; filename="blob"\r\nContent-Type: application/octet-stream\r\n\r\n`;
    const footer = `\r\n--${boundary}--\r\n`;
    const body = Buffer.concat([
      Buffer.from(header),
      file.buffer,
      Buffer.from(footer),
    ]);

    await xHttp.post(
      `${uploadUrl}?command=APPEND&media_id=${mediaId}&segment_index=0`,
      body,
      {
        headers: buildXHeaders(auth, {
          "content-type": `multipart/form-data; boundary=${boundary}`,
        }),
      },
    );

    // 3. FINALIZE
    const md5 = crypto.createHash("md5").update(file.buffer).digest("hex");
    const finalizeRes = await xHttp.post(
      `${uploadUrl}?command=FINALIZE&media_id=${mediaId}&original_md5=${md5}`,
      null,
      {
        headers: buildXHeaders(auth, {
          "content-type": "application/x-www-form-urlencoded",
        }),
      },
    );

    return {
      code: 0,
      data: { media_id_string: finalizeRes.data.media_id_string },
    };
  } catch (error) {
    const normalized = normalizeError(error);
    return {
      code: normalized.code,
      message: `媒体上传失败: ${normalized.message}`,
      data: null,
    };
  }
}

/**
 * 获取当前登录用户的基本信息
 */
export async function getAccountVerifyCredentials(
  credential?: XCredential | null,
): Promise<XApiResult<any>> {
  try {
    const auth = ensureCredential(credential);
    const url = `${X_BASE_URL}/i/api/1.1/account/verify_credentials.json`;
    const response = await xHttp.get(url, {
      headers: buildXHeaders(auth),
      params: {
        include_entities: true,
        skip_status: true,
        include_email: false,
      },
    });

    return {
      code: 0,
      data: response.data,
    };
  } catch (error) {
    const normalized = normalizeError(error);
    console.error("XPLAN_GET_MY_USER_INFO_ERROR", normalized);
    return {
      code: normalized.code,
      message: `获取个人信息失败: ${normalized.message}`,
      data: null,
    };
  }
}

/**
 * 点赞推文 (FavoriteTweet)
 */
export async function favoriteXTweet(
  tweetId: string,
  credential?: XCredential | null,
): Promise<XApiResult<any>> {
  try {
    const auth = ensureCredential(credential);
    const path = `/i/api/graphql/${X_FAVORITE_TWEET_QUERY_ID}/FavoriteTweet`;
    const url = `${X_BASE_URL}${path}`;

    const transactionId = await XClientTransaction.getTransactionId(
      path,
      "POST",
    );

    const response = await xHttp.post(
      url,
      {
        variables: { tweet_id: tweetId },
        queryId: X_FAVORITE_TWEET_QUERY_ID,
      },
      {
        headers: buildXHeaders(auth, {
          "x-client-transaction-id": transactionId,
          Referer: `https://x.com/i/status/${tweetId}`,
        }),
      },
    );

    return {
      code: 0,
      data: response.data?.data ?? response.data,
    };
  } catch (error) {
    const normalized = normalizeError(error);
    return {
      code: normalized.code,
      message: normalized.message,
      data: null,
    };
  }
}

/**
 * 取消点赞推文 (UnfavoriteTweet)
 */
export async function unfavoriteXTweet(
  tweetId: string,
  credential?: XCredential | null,
): Promise<XApiResult<any>> {
  try {
    const auth = ensureCredential(credential);
    const path = `/i/api/graphql/${X_UNFAVORITE_TWEET_QUERY_ID}/UnfavoriteTweet`;
    const url = `${X_BASE_URL}${path}`;

    const transactionId = await XClientTransaction.getTransactionId(
      path,
      "POST",
    );

    const response = await xHttp.post(
      url,
      {
        variables: { tweet_id: tweetId },
        queryId: X_UNFAVORITE_TWEET_QUERY_ID,
      },
      {
        headers: buildXHeaders(auth, {
          "x-client-transaction-id": transactionId,
          Referer: `https://x.com/i/status/${tweetId}`,
        }),
      },
    );

    return {
      code: 0,
      data: response.data?.data ?? response.data,
    };
  } catch (error) {
    const normalized = normalizeError(error);
    return {
      code: normalized.code,
      message: normalized.message,
      data: null,
    };
  }
}

/**
 * 获取用户的关注列表 (Following)
 */
export async function getXFollowing(
  userId: string,
  count: number = 20,
  cursor?: string,
  credential?: XCredential | null,
): Promise<XApiResult<any>> {
  try {
    const auth = ensureCredential(credential);
    const path = `/i/api/graphql/${X_FOLLOWING_QUERY_ID}/Following`;
    const url = `${X_BASE_URL}${path}`;

    const variables = {
      userId,
      count,
      ...(cursor ? { cursor } : {}),
      includePromotedContent: false,
      withGrokTranslatedBio: true,
    };

    // 使用 SEARCH_TIMELINE_FEATURES 的子集，或者直接用 HOME_TIMELINE_FEATURES
    const features = {
      ...HOME_TIMELINE_FEATURES,
      rweb_video_screen_enabled: false,
      rweb_cashtags_enabled: true,
    };

    const response = await xHttp.get(url, {
      headers: buildXHeaders(auth, {
        Referer: `https://x.com/i/user/${userId}/following`,
      }),
      params: {
        variables,
        features,
      },
    });

    const data = response.data?.data?.user?.result?.timeline?.timeline || {};
    const instructions = data.instructions || [];
    const entries =
      instructions.find((ins: any) => ins.type === "TimelineAddEntries")
        ?.entries || [];

    const users: any[] = [];
    let nextCursor = "";

    entries.forEach((entry: any) => {
      const content = entry.content;
      if (
        content?.entryType === "TimelineTimelineItem" ||
        content?.__typename === "TimelineTimelineItem"
      ) {
        // 关键：根据示例数据，用户信息位于 content.itemContent.user_results.result
        const userRes = content.itemContent?.user_results?.result;
        if (userRes) {
          users.push(parseXUserResult(userRes));
        }
      } else if (
        content?.entryType === "TimelineTimelineCursor" &&
        content?.cursorType === "Bottom"
      ) {
        nextCursor = content.value;
      }
    });

    return {
      code: 0,
      data: {
        users,
        cursor: nextCursor,
      },
    };
  } catch (error) {
    const normalized = normalizeError(error);
    return {
      code: normalized.code,
      message: normalized.message,
      data: null,
    };
  }
}

/**
 * 将 GraphQL 返回的 User 结果解析为 xUser 对象
 */
function parseXUserResult(obj: any): any {
  if (!obj) return {};
  let result = obj;
  if (result.result) result = result.result;

  const legacy = result.legacy || {};
  const core = result.core || {};

  // 关键：根据示例数据，关注列表接口中 name 和 screen_name 位于 core 对象下
  const name = legacy.name || core.name || result.name || "";
  const screenName = legacy.screen_name || core.screen_name || result.screen_name || "";

  // 简介抓取
  const description = legacy.description || result.description || "";

  // 头像抓取
  const avatar =
    result.avatar?.image_url ||
    legacy.profile_image_url_https ||
    result.profile_image_url_https ||
    "";

  const displayName =
    name && screenName
      ? `${name} (@${screenName})`
      : name || screenName || "Unknown";

  return {
    id: result.rest_id,
    screen_name: displayName,
    screen_name_raw: screenName,
    name: name,
    avatar_hd: avatar,
    avatar_large: avatar.replace("_normal", "_400x400"),
    following: result.relationship_perspectives?.following ?? legacy.following,
    followers_count: legacy.followers_count,
    followers_count_str: formatXCount(legacy.followers_count),
    friends_count_str: formatXCount(legacy.friends_count),
    descText: description,
    verified_reason: result.verification?.reason?.description?.text || "",
  };
}

/**
 * 格式化 X 的数字显示
 */
function formatXCount(count: number): string {
  if (!count) return "0";
  if (count >= 1000000) return (count / 1000000).toFixed(1) + "M";
  if (count >= 1000) return (count / 1000).toFixed(1) + "K";
  return count.toString();
}
