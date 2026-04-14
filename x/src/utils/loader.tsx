/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-06-18 14:25:26
 * @LastEditTime: 2025-09-26 11:26:39
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\x\src\utils\loader.tsx
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description:
 */
import { Card, Skeleton } from "antd";

export const loaderFunc = (rows=5) => {
  return (
    <Card
      styles={{
        body: {
          padding: "8px",
        },
      }}
      style={{
        marginBottom: "5px",
      }}
    >
      <Skeleton avatar paragraph={{ rows }} active />
    </Card>
  );
};
