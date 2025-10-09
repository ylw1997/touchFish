/*
 * @Author: YangLiwei
 * @Date: 2022-05-20 15:26:01
 * @LastEditTime: 2025-10-09 11:00:32
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\src\config\index.ts
 * @Description: 
 */

import * as vscode from 'vscode';

// 仅保留配置写入工具函数（读取统一通过 runtime getConfiguration）
export const setConfigByKey = async (key: string, value: string) => {
  const cfg = vscode.workspace.getConfiguration('touchfish');
  return await cfg.update(key, value, true);
};

// 兼容旧引用: refrshConfig 已无必要, 暴露空函数避免潜在旧代码调用报错
export const refrshConfig = () => { /* noop */ };
