/*
 * @Author: yangliwei 1280426581@qq.com
 * @Date: 2024-11-19 17:38:50
 * @LastEditTime: 2024-11-20 11:12:01
 * @LastEditors: yangliwei 1280426581@qq.com
 * @FilePath: \touchfish\weibo\src\components\YImg.tsx
 * Copyright (c) 2024 by yangliwei, All Rights Reserved. 
 * @Description: 
 */
import { useState, useEffect } from 'react';
import { vscode } from '../utils/vscode';
import { commandsType } from '../../../type';

interface YImgProps {
  src: string;
}

const YImg: React.FC<YImgProps> = ({ src }) => {
  const [imgSrc, setImgSrc] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (src) {
      
      vscode.postMessage({
        command:"GETIMG",
        payload: src
      } as commandsType<string>)
      
      window.addEventListener(
        "message",
        async (event: MessageEvent<commandsType<any>>) => {
          const msg = event.data;
          switch (msg.command) {
            case `SENDIMG:${src}`: {
              if (msg.payload) {
                console.log(`SENDIMG:${src}`);
                setImgSrc(msg.payload);
              }
              break;
              }
          }
        }
      );
    }
  }, []);

  

  return (
    <img src={imgSrc} />
  );
};

export default YImg;
