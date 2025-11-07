/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-11-07
 * @Description: 小红书图片处理工具函数
 */

/**
 * 获取原图结果类型
 */
export interface OriginalImageResult {
  /** 是否成功 */
  success: boolean;
  /** 消息 */
  msg: string;
  /** 原图URL（成功时） */
  newUrl?: string;
  /** 是否为原图 */
  isOriginal: boolean;
}

/**
 * 获取笔记无水印原图
 * @param imgUrl 你想要获取的图片的url
 * @returns 返回笔记无水印原图信息
 * 
 * @example
 * ```ts
 * const result = getNoteOriginalImage('https://sns-webpic-qc.xhscdn.com/202403211626/c4fcecea4bd012a1fe8d2f1968d6aa91/110/0/01e50c1c135e8c010010000000018ab74db332_0.jpg!nd_dft_wlteh_webp_3');
 * // { success: true, msg: '成功获取原图', newUrl: 'https://sns-img-qc.xhscdn.com/110/0/01e50c1c135e8c010010000000018ab74db332_0.jpg', isOriginal: true }
 * ```
 */
export function getNoteOriginalImage(imgUrl: string): OriginalImageResult {
  let success = true;
  let msg = '成功获取原图';
  let newUrl: string | undefined;
  let isOriginal = false;

  try {
    // 情况1: URL包含.jpg
    // 示例: https://sns-webpic-qc.xhscdn.com/202403211626/c4fcecea4bd012a1fe8d2f1968d6aa91/110/0/01e50c1c135e8c010010000000018ab74db332_0.jpg!nd_dft_wlteh_webp_3
    if (imgUrl.includes('.jpg')) {
      // 提取最后三段路径并去除感叹号后的参数
      const parts = imgUrl.split('/');
      const lastThreeParts = parts.slice(-3).join('/');
      const imgId = lastThreeParts.split('!')[0];
      
      // 使用 sns-img-qc.xhscdn.com 获取原图
      newUrl = `https://sns-img-qc.xhscdn.com/${imgId}`;
      isOriginal = true;
    }
    // 情况2: URL包含spectrum
    // 示例: https://sns-webpic-qc.xhscdn.com/202403231640/ea961053c4e0e467df1cc93afdabd630/spectrum/1000g0k0200n7mj8fq0005n7ikbllol6q50oniuo!nd_dft_wgth_webp_3
    else if (imgUrl.includes('spectrum')) {
      // 提取最后两段路径并去除感叹号后的参数
      const parts = imgUrl.split('/');
      const lastTwoParts = parts.slice(-2).join('/');
      const imgId = lastTwoParts.split('!')[0];
      
      // 使用 sns-webpic.xhscdn.com 并添加imageView2参数获取原图
      newUrl = `http://sns-webpic.xhscdn.com/${imgId}?imageView2/2/w/format/jpg`;
      isOriginal = true;
    }
    // 情况3: 其他格式
    // 示例: http://sns-webpic-qc.xhscdn.com/202403181511/64ad2ea67ce04159170c686a941354f5/1040g008310cs1hii6g6g5ngacg208q5rlf1gld8!nd_dft_wlteh_webp_3
    else {
      // 提取最后一段路径并去除感叹号后的参数
      const parts = imgUrl.split('/');
      const imgId = parts[parts.length - 1].split('!')[0];
      
      // 使用 sns-img-qc.xhscdn.com 获取原图
      newUrl = `https://sns-img-qc.xhscdn.com/${imgId}`;
      isOriginal = true;
    }
  } catch (e) {
    success = false;
    msg = e instanceof Error ? e.message : '解析图片URL失败';
    isOriginal = false;
  }
  console.log('获取原图结果:', {imgUrl, success, msg, newUrl, isOriginal });
  return {
    success,
    msg,
    newUrl,
    isOriginal,
  };
}

/**
 * 批量获取原图URL
 * @param imgUrls 图片URL数组
 * @returns 原图URL数组
 */
export function batchGetOriginalImages(imgUrls: string[]): OriginalImageResult[] {
  return imgUrls.map(url => getNoteOriginalImage(url));
}
