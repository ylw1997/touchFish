/*
 * @Author: copied from weibo
 * @Date: 2025-10-24
 * @Description: 通用加载占位组件
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
        margin: '5px'
      }}
    >
      <Skeleton avatar paragraph={{ rows }} active />
    </Card>
  );
};
