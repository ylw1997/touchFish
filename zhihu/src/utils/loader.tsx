/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-06-18 14:25:26
 * @LastEditTime: 2025-09-12 16:44:32
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\zhihu\src\utils\loader.tsx
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description:
 */
import { Card, Skeleton } from "antd";

export const loaderFunc = (rows = 5) => {
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
      <Skeleton avatar paragraph={{ rows }} active />
    </Card>
  );
};
