/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-11-06
 * @Description: 基础 Drawer 容器组件，统一样式和配置
 */
import React from "react";
import { Drawer } from "antd";
import type { DrawerProps } from "antd";

interface BaseDrawerProps extends DrawerProps {
  /** Drawer 是否打开 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 标题 */
  title?: React.ReactNode;
  /** 子内容 */
  children: React.ReactNode;
  /** 可滚动容器ID（用于 InfiniteScroll） */
  scrollableId?: string;
}

/**
 * 基础 Drawer 组件
 * 统一处理小红书项目中 Drawer 的通用配置和样式
 */
export const BaseDrawer: React.FC<BaseDrawerProps> = ({
  open,
  onClose,
  title,
  children,
  scrollableId,
  ...restProps
}) => {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      placement="bottom"
      destroyOnHidden
      height="90vh"
      title={title}
      styles={{
        body: {
          padding: 0,
          height: "100%",
          minHeight: 0,
          overflow: "hidden",
        },
      }}
      {...restProps}
    >
      <div
        id={scrollableId}
        style={{
          height: "100%",
          overflow: "auto",
          padding: scrollableId ? 8 : 0,
        }}
      >
        {children}
      </div>
    </Drawer>
  );
};

export default BaseDrawer;
