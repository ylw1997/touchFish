/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-11-05
 * @Description: 小红书项目常量配置
 */

/**
 * 瀑布流布局断点配置
 * 根据不同屏幕宽度显示不同列数
 */
export const MASONRY_BREAKPOINTS = {
  default: 2,
  1500: 5,
  1200: 4,
  900: 3,
  600: 2,
  300: 1,
} as const;

/**
 * 无限滚动配置
 */
export const INFINITE_SCROLL_CONFIG = {
  /** 触发加载更多的阈值 (0-1，表示滚动到底部的百分比) */
  THRESHOLD: 0.9,
  /** 回到顶部的可见高度阈值 */
  BACK_TOP_VISIBILITY_HEIGHT: 500,
  /** 回到顶部的动画持续时间(ms) */
  BACK_TOP_DURATION: 1000,
} as const;

/**
 * 防抖/节流默认延迟
 */
export const DEBOUNCE_DELAY = {
  SCROLL: 500,
  SEARCH: 300,
  INPUT: 300,
} as const;
