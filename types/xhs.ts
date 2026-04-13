/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-11-20 09:06:54
 * @LastEditTime: 2025-11-20 09:22:50
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\types\xhs.ts
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved. 
 * @Description: 
 */
// 小红书 XHS 相关类型
export interface XhsCoverInfo {
  image_scene: "WB_PRV" | "WB_DFT" | string;
  url: string;
  [key: string]: any;
}
export interface XhsCover {
  url_default: string;
  file_id: string;
  height: number;
  width: number;
  url: string;
  info_list: XhsCoverInfo[];
  url_pre: string;
  [key: string]: any;
}
export interface XhsInteractInfo {
  liked: boolean;
  liked_count: string | number;
  comment_count: string | number;
  followed: boolean;
  collected_count: string | number;
  [key: string]: any;
}
export interface XhsUser {
  nick_name: string;
  nickname: string;
  avatar: string;
  user_id: string;
  xsec_token: string;
  [key: string]: any;
}
export interface XhsNoteVideoCapa {
  duration: string | number;
  [key: string]: any;
}
export interface XhsVideoStreamItem {
  vmaf: number;
  psnr: number;
  quality_type: string;
  stream_type: number;
  volume: number;
  fps: number;
  rotate: number;
  master_url: string;
  hdr_type: number;
  duration: number;
  audio_channels: number;
  format: string;
  width: number;
  height: number;
  video_bitrate: number;
  audio_bitrate: number;
  backup_urls: string[];
  stream_desc: string;
  size: number;
  video_codec: string;
  audio_codec: string;
  default_stream: number;
  [key: string]: any;
}
export interface XhsNoteVideo {
  capa: XhsNoteVideoCapa;
  media: {
    video_id: number | string;
    video: {
      hdr_type: number;
      drm_type: number;
      stream_types: number[];
      biz_name: number;
      biz_id: string;
      duration: number;
      md5: string;
      [key: string]: any;
    };
    stream: {
      h265: XhsVideoStreamItem[];
      h264: XhsVideoStreamItem[];
      h266: XhsVideoStreamItem[];
      av1: XhsVideoStreamItem[];
      [key: string]: any;
    };
    [key: string]: any;
  };
  image: {
    first_frame_fileid: string;
    thumbnail_fileid: string;
    [key: string]: any;
  };
  consumer: { origin_video_key: string; [key: string]: any };
  [key: string]: any;
}
export interface XhsImageListItem {
  live_photo: boolean;
  file_id: string;
  url: string;
  trace_id: string;
  info_list: XhsCoverInfo[];
  url_pre: string;
  url_default: string;
  stream: any;
  height: number;
  width: number;
  [key: string]: any;
}
export interface XhsNoteCard {
  display_title: string;
  user: XhsUser;
  interact_info: XhsInteractInfo;
  cover: XhsCover;
  type: "normal" | "video" | string;
  desc: string;
  title: string;
  video?: XhsNoteVideo;
  [key: string]: any;
}
export interface XhsNoteCardFull extends XhsNoteCard {
  user: XhsUser;
  interact_info: XhsInteractInfo;
  at_user_list: any[];
  last_update_time: number;
  ip_location: string;
  title: string;
  time: number;
  share_info: any;
  desc: string;
  image_list: XhsImageListItem[];
  video: XhsNoteVideo;
  tag_list: Array<{ id?: string; name: string; type?: string }>;
  note_id: string;
  type: string;
}
export interface XhsFeedRawItem {
  ignore: boolean;
  xsec_token: string;
  id: string;
  model_type: "note" | string;
  note_card: XhsNoteCard;
  track_id: string;
  [key: string]: any;
}
export interface XhsFeedRawResponse {
  cursor_score: string;
  items: XhsFeedRawItem[];
}
export interface XhsFeedResponse {
  data: {
    cursor_score: string;
    items: Array<{
      id: string;
      model_type: string;
      note_card: XhsNoteCardFull;
      [key: string]: any;
    }>;
    current_time: number;
    [key: string]: any;
  };
  code: number;
  success: boolean;
  msg: string;
}
export interface XhsFeedDetailParams {
  source_note_id: string;
  image_formats?: string[];
  extra?: { need_body_topic?: string };
  xsec_source?: string;
  xsec_token: string;
}
export interface XhsTagInfo {
  id: string;
  name: string;
  type?: string;
  [key: string]: any;
}
export interface XhsNoteDetail {
  note_id: string;
  type: "normal" | "video" | string;
  title: string;
  desc: string;
  time: number;
  last_update_time: number;
  user: XhsUser;
  image_list: XhsImageListItem[];
  video?: XhsNoteVideo;
  tag_list: XhsTagInfo[];
  at_user_list: any[];
  interact_info: XhsInteractInfo;
  ip_location: string;
  share_info?: any;
  [key: string]: any;
}
export interface XhsFeedDetailResponse {
  note?: XhsNoteDetail;
  note_card?: XhsNoteCardFull;
  [key: string]: any;
}
export interface XhsUserPostedParams {
  user_id: string;
  cursor: string;
  xsec_token: string;
  xsec_source?: string;
  num?: number;
  image_formats?: string[];
}
export interface XhsUserPostedResponse {
  items: XhsFeedRawItem[];
  cursor: string;
  has_more: boolean;
  [key: string]: any;
}
export interface XhsUserHoverCardParams {
  target_user_id: string;
  image_formats?: string;
  xsec_source?: string;
  xsec_token: string;
}
export interface XhsUserBasicInfo {
  red_id: string;
  nickname: string;
  avatar: string;
  desc: string;
  gender?: number;
  ip_location?: string;
  imageb?: string;
  [key: string]: any;
}
export interface XhsUserInteractInfo {
  follows: string | number;
  fans: string | number;
  interaction: string | number;
  [key: string]: any;
}
export interface XhsUserExtraInfo {
  fstatus: "none" | "follows" | "each_other" | string;
  [key: string]: any;
}
export interface XhsUserHoverCardResponse {
  basic_info: XhsUserBasicInfo;
  interact_info: XhsUserInteractInfo;
  extraInfo_info: XhsUserExtraInfo;
  [key: string]: any;
}
export interface XhsFollowParams {
  target_user_id: string;
}
export interface XhsFollowResponse {
  success: boolean;
  msg?: string;
  [key: string]: any;
}
export interface XhsUnfollowParams {
  target_user_id: string;
}
export interface XhsUnfollowResponse {
  success: boolean;
  msg?: string;
  [key: string]: any;
}
export interface XhsLikeNoteParams { note_oid: string }
export interface XhsLikeNoteResponse { new_like: boolean; [k: string]: any }
export interface XhsDislikeNoteParams { note_oid: string }
export interface XhsDislikeNoteResponse { like_count: number; [k: string]: any }
export interface XhsCollectNoteParams { note_id: string }
export interface XhsCollectNoteResponse { code: number; success: boolean; msg: string; [k: string]: any }
export interface XhsUncollectNoteParams { note_ids: string }
export interface XhsUncollectNoteResponse { code: number; success: boolean; msg: string; [k: string]: any }
export interface XhsPostCommentParams { note_id: string; content: string; at_users?: any[] }
export interface XhsPostCommentResponse {
  code: number;
  success: boolean;
  msg: string;
  data: {
    comment: {
      note_id: string;
      at_users: any[];
      liked: boolean;
      user_info: {
        nickname: string;
        image: string;
        user_id: string;
      };
      create_time: number;
      ip_location: string;
      id: string;
      status: number;
      content: string;
      like_count: string;
      show_tags: any[];
      [k: string]: any;
    };
    time: number;
    toast: string;
  };
  [k: string]: any;
}
export interface XhsApiResponse<T = any> {
  code: number;
  success: boolean;
  msg: string;
  data: T;
  [key: string]: any;
}
export interface XhsErrorResponse {
  code: number;
  success: false;
  msg: string;
  error_msg?: string;
  [key: string]: any;
}
export interface XhsSearchParams {
  keyword: string;
  page?: number;
  search_id?: string;
  image_formats?: string[];
  note_type?: number;
  search_scene?: string;
}
export interface XhsSearchNoteCard extends XhsNoteCard {
  liked_count?: string | number;
  collected_count?: string | number;
  comment_count?: string | number;
  share_count?: string | number;
}
export interface XhsSearchItem {
  id: string;
  model_type: "note" | "user" | string;
  note_card?: XhsSearchNoteCard;
  user?: XhsUser;
  xsec_token: string;
  [key: string]: any;
}
export interface XhsSearchResponse {
  items: XhsSearchItem[];
  has_more: boolean;
  search_id: string;
  total: number;
  cursor?: string;
  [key: string]: any;
}
export interface XhsCommentsResponseData {
  comments: XhsCommentItem[];
  cursor: string;
  has_more: boolean;
  user_id: string;
  time: number;
  xsec_token: string;
}
export interface XhsSubCommentItem {
  id: string;
  content: string;
  like_count: string | number;
  liked: boolean;
  create_time: number;
  ip_location: string;
  user_info: {
    user_id: string;
    nickname: string;
    image: string;
    xsec_token: string;
  };
  target_comment: {
    id: string;
    user_info: { nickname: string; user_id: string; image: string };
  };
  show_tags: string[];
  at_users: any[];
  [k: string]: any;
}
export interface XhsCommentItem extends XhsSubCommentItem {
  sub_comments: XhsSubCommentItem[];
  sub_comment_count: string | number;
  sub_comment_cursor: string;
  sub_comment_has_more: boolean;
  status: number;
}

export interface XhsSubCommentsResponseData {
  // 后端实际返回可能为 comments，这里统一标准化为 sub_comments
  sub_comments: XhsSubCommentItem[];
  comments?: XhsSubCommentItem[]; // 兼容原始字段，避免断言失败
  cursor: string;
  has_more: boolean;
  note_id: string;
  root_comment_id: string;
  xsec_token: string;
  time?: number;
  [k: string]: any;
}

// 小红书发布笔记相关类型
export interface XhsUploadImageParams {
  file: string; // base64
  name: string;
  type: string;
}

export interface XhsUploadImageResponse {
  url: string;
  file_id?: string;
  [k: string]: any;
}

export interface XhsPublishNoteParams {
  title: string;
  desc: string;
  images: string[]; // 图片URL列表
}

export interface XhsPublishNoteResponse {
  success: boolean;
  note_id?: string;
  msg?: string;
  [k: string]: any;
}
