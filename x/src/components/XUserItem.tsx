/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-07-31 14:09:36
 * @LastEditTime: 2025-07-31 15:07:31
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\x\src\components\XUserItem.tsx
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved. 
 * @Description: 
 */
import { List, Avatar } from "antd";
import YImg from "./YImg";
import { xUser } from "../../../types/x";
export const XUserItem = (item: xUser,showUser?: (item: xUser) => void) => (
  <List.Item>
    <List.Item.Meta
      avatar={
        <Avatar
          size={48}
          src={item.avatar_hd && <YImg useImg src={item.avatar_hd} />}
        />
      }
      title={
        <span className={"nick-name"} onClick={() => showUser?.(item)}>
          {item.screen_name}
        </span>
      }
      description={item.verified_reason ? `${item.verified_reason}` : ""}
    />
  </List.Item>
);
