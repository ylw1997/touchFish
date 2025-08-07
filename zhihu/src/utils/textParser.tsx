export const processCommentContent = (content: string): string => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
  const regex = /<a.*?href="(.*?)".*?>(.*?)<\/a>/g;

  return content.replace(regex, (match, href, text) => {
    const isImage = imageExtensions.some(ext => href.toLowerCase().endsWith(ext));
    if (isImage) {
      return `<img src="${href}" alt="${text}" class="comment-image" />`;
    }
    return match; // Keep the original link if it's not an image
  });
};