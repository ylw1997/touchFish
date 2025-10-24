import axios, { AxiosError } from 'axios';
import * as vscode from 'vscode';
import { setConfigByKey } from './config';

export const xhsHttp = axios.create({
  timeout: 10000
});

// XHS 专用响应拦截：统一提示后端 msg，code === -100 时引导重新输入 xhsCookie
xhsHttp.interceptors.response.use(
  (response) => {
    try {
      const data = response?.data;
      if (data && typeof data === 'object') {
        if (data.code === -100) {
          const msg = data.msg || '登录已过期';
          vscode.window
            .showErrorMessage(msg, '重新输入 Cookie')
            .then(async (choice) => {
              if (choice === '重新输入 Cookie') {
                const input = await vscode.window.showInputBox({
                  prompt: '请输入小红书 Cookie',
                  placeHolder: '请输入小红书 Cookie',
                });
                if (input) {
                  await setConfigByKey('xhsCookie', input);
                  vscode.window.showInformationMessage('已保存小红书 Cookie，请重试操作');
                }
              }
            });
          return Promise.reject(new Error(msg));
        }
        if (data.success === false && data.msg) {
          return Promise.reject(new Error(String(data.msg)));
        }
      }
    } catch (e) {
      console.error('[xhsHttp interceptor error]', e);
    }
    return response;
  },
  (error: AxiosError) => {
    if (error.code === 'ECONNABORTED') return Promise.reject(new Error('请求超时'));
    if (error.response) return Promise.reject(new Error(`请求失败: ${error.response.status}`));
    return Promise.reject(error);
  }
);

export default xhsHttp;
