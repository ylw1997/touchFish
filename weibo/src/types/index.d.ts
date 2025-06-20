type weiboVisible = {
  0: '公开',
  1: '自己',
  6: '好友圈',
  10: '粉丝'
}
export type weiboSendParams = {
  content:string;
  visible?: keyof weiboVisible;
  vote?: string;
  media?: string;
  pic_id?: string;
}