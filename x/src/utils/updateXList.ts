import { xItem } from "../../../types/x";

export function updateXList(
  list: xItem[],
  matcher: (item: xItem) => boolean,
  updater: (item: xItem) => xItem
): xItem[] {
  return list.map((item) => {
    if (matcher(item)) return updater(item);
    if (item.retweeted_status && matcher(item.retweeted_status as xItem)) {
      return {
        ...item,
        retweeted_status: updater(item.retweeted_status as xItem),
      };
    }
    return item;
  });
}
