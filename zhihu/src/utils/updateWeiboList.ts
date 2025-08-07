import { weiboItem } from "../../../type";

export function updateWeiboList(
  list: weiboItem[],
  matcher: (item: weiboItem) => boolean,
  updater: (item: weiboItem) => weiboItem
): weiboItem[] {
  return list.map((item) => {
    if (matcher(item)) return updater(item);
    if (item.retweeted_status && matcher(item.retweeted_status as weiboItem)) {
      return {
        ...item,
        retweeted_status: updater(item.retweeted_status as weiboItem),
      };
    }
    return item;
  });
}
