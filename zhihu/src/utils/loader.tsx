/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-06-18 14:25:26
 * @LastEditTime: 2025-06-18 14:38:09
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\weibo\src\utils\loader.tsx
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved. 
 * @Description: 
 */
import { Card, Skeleton } from "antd";

export const loaderFunc = (number: number = 3) => {
  return (
    <>
      {[...Array(number)].map((_, i) => (
        <Card
          styles={{
            body: {
              paddingBottom: "10px",
            },
          }}
          key={i}
        >
          <Skeleton avatar paragraph={{ rows: 5 }} active />
        </Card>
      ))}
    </>
  );
}