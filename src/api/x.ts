import axios, { AxiosError } from "axios";

const X_BASE_URL = "https://x.com";

export const X_HOME_TIMELINE_QUERY_ID = "y7EXm-q2D84r46khKFkSBA";
export const X_TWEET_DETAIL_QUERY_ID = "rU08O-YiXdr0IZfE7qaUMg";
export const X_SEARCH_TIMELINE_QUERY_ID = "5yhbMCF0-WQ6M8UOAs1mAg";
export const X_USER_BY_SCREEN_NAME_QUERY_ID = "qW5u-DAuXpMEG0zA1F7UGQ";
export const X_USER_TWEETS_QUERY_ID = "9zyyd1hebl7oNWIPdA8HRw";

export interface XCredential {
  cookie: string;
  authorization: string;
  csrfToken: string;
}

export interface XApiResult<T> {
  code: number;
  message?: string;
  data: T | null;
}

export interface XTimelineNextParams {
  cursor: string;
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

const SEARCH_TIMELINE_FEATURES: XFeatureFlags = {
  rweb_tipjar_consumption_enabled: true,
  responsive_web_graphql_exclude_directive_enabled: true,
  verified_phone_label_enabled: false,
  creator_subscriptions_tweet_preview_api_enabled: true,
  responsive_web_graphql_timeline_navigation_enabled: true,
  responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
  communities_web_enable_tweet_community_results_fetch: true,
  c9s_tweet_anatomy_moderator_badge_enabled: true,
  articles_preview_enabled: true,
  tweetypie_unmention_optimization_enabled: true,
  responsive_web_edit_tweet_api_enabled: true,
  graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
  view_counts_everywhere_api_enabled: true,
  longform_notetweets_consumption_enabled: true,
  responsive_web_twitter_article_tweet_consumption_enabled: true,
  tweet_awards_web_tipping_enabled: false,
  creator_subscriptions_quote_tweet_preview_enabled: false,
  freedom_of_speech_not_reach_fetch_enabled: true,
  standardized_nudges_misinfo: true,
  tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
  tweet_with_visibility_results_prefer_gql_media_interstitial_enabled: true,
  rweb_video_timestamps_enabled: true,
  longform_notetweets_rich_text_read_enabled: true,
  longform_notetweets_inline_media_enabled: true,
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

export function buildXHeaders(
  credential: XCredential,
  extraHeaders: Record<string, string> = {},
): Record<string, string> {
  return {
    accept: "*/*",
    "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
    authorization: credential.authorization,
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
      cursor: params.cursor,
      includePromotedContent: params.includePromotedContent ?? true,
      withCommunity: params.withCommunity ?? true,
      seenTweetIds: params.seenTweetIds ?? [],
    },
    features: HOME_TIMELINE_FEATURES,
    queryId: X_HOME_TIMELINE_QUERY_ID,
  };
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

export async function getStoredXCredential(): Promise<XCredential | null> {
  const { getConfigByKey } = (await import("../core/config")) as ConfigModule;
  const cookie = getConfigByKey("xCookie");
  const authorization = getConfigByKey("xAuthorization");
  const csrfToken = getConfigByKey("xCsrfToken");

  if (!cookie || !authorization || !csrfToken) {
    return null;
  }

  return { cookie, authorization, csrfToken };
}

async function askForCredentialField(
  key: "xCookie" | "xAuthorization" | "xCsrfToken",
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
  const authorization = await askForCredentialField(
    "xAuthorization",
    "请输入 X 的 authorization",
  );
  const csrfToken = await askForCredentialField(
    "xCsrfToken",
    "请输入 X 的 x-csrf-token",
  );

  if (!cookie || !authorization || !csrfToken) {
    return null;
  }

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
    const response = await xHttp.get(
      `${X_BASE_URL}/i/api/graphql/${X_SEARCH_TIMELINE_QUERY_ID}/SearchTimeline`,
      {
        headers: buildXHeaders(auth, {
          Referer: `https://x.com/search?q=${encodeURIComponent(params.query)}&src=typed_query`,
        }),
        params: {
          variables: buildSearchTimelineVariables(params),
          features: SEARCH_TIMELINE_FEATURES,
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
