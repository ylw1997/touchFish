// Zhihu 相关类型
export interface ZhihuAuthor { id: string; name: string; avatar_url: string }
export interface ZhihuQuestion { id: string; title: string }
export interface ZhihuItemData {
  id: string;
  author?: ZhihuAuthor;
  question?: ZhihuQuestion;
  created_time?: number;
  voteup_count?: number;
  comment_count?: number;
  excerpt: string;
  content?: string;
  metrics_area?: string;
  image_area?: string;
  index?: number;
  vote_next_step?: "vote" | "unvote";
  title?: string;
  type: "answer" | "article" | "topic";
  tab: "hot" | "follow" | "recommend" | "hot_question";
}
export interface ZhihuCommentItem {
  content: string;
  created_time: number;
  id: number;
  is_author: boolean;
  like_count: number;
  reply_to_id: number;
  type: number;
  author: { avatar_url: string; id: number; name: string; url_token: string };
  reply_to_author?: { name?: string };
  comment_tag: { type: "ip_info" | "hot"; text: string }[];
  child_comments: ZhihuCommentItem[];
  can_more?: boolean;
  child_comment_count?: number;
  paging?: { is_end: boolean; next?: string };
}
export interface ZhihuHotItem { excerpt_area: { text: string }; image_area: { url: string }; link: { url: string }; title_area: { text: string }; metrics_area: { text: string } }
export interface ZhihuSearchItem { type: "hot_timing" | "search_result"; object: ZhihuItemData; index: number; highlight?: { description: string; title: string } }
export interface ZhihuHotQuestion {
  type: "personalized_question";
  reason: string;
  question: { id: string; title: string; detail?: string; excerpt?: string; answer_count: number; visit_count: number; follower_count: number; author: { id: string; name: string; avatar_url: string } };
}
