// 命令相关类型拆分
export type CommandList =
  | "GETDATA"
  | "SENDDATA"
  | "GETIMG"
  | "SENDIMG"
  | "GETCOMMENT"
  | "SENDCOMMENT"
  | "GETLONGTEXT"
  | "SENDLONGTEXT"
  | "GETUSERBLOG"
  | "SENDUSERBLOG"
  | "GETFOLLOW"
  | "SENDFOLLOW"
  | "GETNEWBLOGRESULT"
  | "SENDNEWBLOGRESULT"
  | "GETUPLOADIMGURL"
  | "SENDUPLOADIMGURL"
  | "GETCANCELFOLLOW"
  | "SENDCANCELFOLLOW"
  | "GETSETLIKE"
  | "SENDSETLIKE"
  | "GETCANCELLIKE"
  | "SENDCANCELLIKE"
  | "GETCREATECOMMENTS"
  | "SENDCREATECOMMENTS"
  | "GETCREATEREPOST"
  | "SENDCREATEREPOST"
  | "GETSEARCH"
  | "SENDSEARCH"
  | "GETUSERBYNAME"
  | "SENDUSERBYNAME"
  | "GETHOTSEARCH"
  | "SENDHOTSEARCH"
  | "GETVIDEO"
  | "SENDVIDEO"
  | "SAVE_SCROLL_POSITION"
  | "RESTORE_SCROLL_POSITION"
  | "TOGGLE_SHOW_IMG"
  | "GET_MY_USER_INFO"
  // XHS commands
  | "XHS_GET_HOME_FEED"
  | "XHS_SEARCH"
  | "XHS_FEED_DETAIL"
  | "XHS_SAVE_SCROLL_POSITION"
  | "XHS_RESTORE_SCROLL_POSITION"
  | "XHS_GET_COMMENTS"
  | "XHS_GET_USER_POSTED"
  | "XHS_USER_HOVER_CARD"
  | "XHS_USER_FOLLOW"
  | "XHS_USER_UNFOLLOW";

export type ZhihuCommandList =
  | "ZHIHU_GETDATA"
  | "ZHIHU_SENDDATA"
  | "getZhihuComment"
  | "getZhihuQuestionDetail"
  | "getZhihuChildComment"
  | "sendZhihuQuestionDetail"
  | "ZHIHU_SAVE_SCROLL_POSITION"
  | "ZHIHU_VOTE_ANSWER"
  | "ZHIHU_SEARCH"
  | "ZHIHU_SEND_SEARCH_RESULTS"
  | "ZHIHU_FOLLOW_QUESTION"
  | "ZHIHU_UNFOLLOW_QUESTION"
  | "ZHIHU_RESTORE_SCROLL_POSITION"
  | "TOGGLE_SHOW_IMG";

export type ZhihuCommandsType<T> = {
  command: ZhihuCommandList;
  payload: T;
  source?: string;
  uuid?: string;
};

export type CommandsType<T> = {
  command: CommandList;
  payload: T;
  source?: string;
  uuid?: string;
};
