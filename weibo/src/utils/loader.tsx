/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-06-18 14:25:26
 * @LastEditTime: 2025-09-24 15:30:49
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\weibo\src\utils\loader.tsx
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description:
 */
import { Card, Skeleton } from "antd";

export const loaderFunc = () => {
  return (
    <Card
      styles={{
        body: {
          padding: "8px",
        },
      }}
      style={{
        marginBottom: "8px",
      }}
    >
      <Skeleton avatar paragraph={{ rows: 5 }} active />
    </Card>
  );
};
