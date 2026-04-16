
export function updateXList(
  list: any[],
  matcher: (item: any) => boolean,
  updater: (item: any) => any
): any[] {
  return list.map((item) => {
    if (matcher(item)) return updater(item);

    let changed = false;
    const newItem = { ...item };

    // 检查转推
    if (newItem.retweeted_status) {
      if (matcher(newItem.retweeted_status)) {
        newItem.retweeted_status = updater(newItem.retweeted_status);
        changed = true;
      } else if (newItem.retweeted_status.comments) {
        // 转推里的评论（虽然少见，但支持一下）
        const updatedSubComments = updateXList(newItem.retweeted_status.comments, matcher, updater);
        if (updatedSubComments !== newItem.retweeted_status.comments) {
          newItem.retweeted_status = { ...newItem.retweeted_status, comments: updatedSubComments };
          changed = true;
        }
      }
    }

    // 检查评论
    if (newItem.comments && Array.isArray(newItem.comments)) {
      const updatedComments = updateXList(newItem.comments, matcher, updater);
      if (updatedComments !== newItem.comments) {
        newItem.comments = updatedComments;
        changed = true;
      }
    }

    return changed ? newItem : item;
  });
}
