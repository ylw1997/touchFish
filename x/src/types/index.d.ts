type xVisible = {
  0: '公开',
  1: '自己',
  6: '好友圈',
  10: '粉丝'
}
export type xSendParams = {
  content:string;
  visible?: keyof xVisible;
  vote?: string;
  media?: string;
  pic_id?: string;
}