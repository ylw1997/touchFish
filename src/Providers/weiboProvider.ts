/*
 * @Author: yangliwei 1280426581@qq.com
 * @Date: 2024-11-12 15:14:35
 * @LastEditTime: 2025-11-19 17:06:03
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\src\Providers\weiboProvider.ts
 * Copyright (c) 2024 by yangliwei, All Rights Reserved.
 * @Description:
 */
import { WebviewView, ExtensionContext, Uri, window } from "vscode";
import { showInfo } from '../utils/errorMessage';
import {
  cancelfollowUser,
  cancelLike,
  createComments,
  createRepost,
  followUser,
  getLongText,
  getUserWeibo,
  getWeiboComment,
  getWeiboData,
  getWeiboImg,
  downloadVideoAsFile,
  getWeiboSearch,
  sendWeibo,
  setLike,
  uploadImage,
  getUserByName,
  getHotSearch,
} from "../api/weibo";
import { CommandsType } from "../../types/commands";
import { uploadType, weiboAJAX } from "../../types/weibo";
import { setConfigByKey } from "../core/config";
import { BaseWebviewProvider, IncomingMessage } from "./baseWebviewProvider";

export class WeiboProvider extends BaseWebviewProvider {
  constructor(context: ExtensionContext) {
    super(context, {
      distPath: "weibo/dist",
      devPort: 5173,
      title: "微博",
      scrollKey: "weiboScrollPosition",
      restoreCommand: "RESTORE_SCROLL_POSITION",
      saveCommand: "SAVE_SCROLL_POSITION",
    });
  }

  public override resolveWebviewView(webviewView: WebviewView) {
    return super.resolveWebviewView(webviewView);
  }

  protected async handleCustomMessage(message: IncomingMessage, webviewView: WebviewView) {
    const { command, payload, uuid } = message;
    switch (command) {
      case "GETDATA": {
        let res = await getWeiboData(payload);
        if (res.data?.ok !== 1) {
          if (res.data?.ok == -100) {
            const cookie = await window.showInputBox({
              placeHolder: "请输入微博的cookie",
              prompt: "请输入微博的cookie",
            });
            if (cookie) {
              await setConfigByKey("weiboCookie", cookie);
              res = await getWeiboData(payload);
            }
          } else {
            showInfo("获取微博数据失败!");
          }
        }
        webviewView.webview.postMessage({
          command: "SENDDATA",
          payload: { ...res.data },
          uuid,
        } as CommandsType<weiboAJAX>);
        break;
      }
      case "GETIMG": {
        const res = await getWeiboImg(payload);
        webviewView.webview.postMessage({ payload: res, uuid });
        break;
      }
      case "GETVIDEO": {
        const videoUrl = payload;
        try {
          const videoPath = await downloadVideoAsFile(videoUrl);
          const videoUri = Uri.file(videoPath);
          const webviewUri = webviewView.webview.asWebviewUri(videoUri);
          webviewView.webview.postMessage({ payload: webviewUri.toString(), uuid });
        } catch {
          webviewView.webview.postMessage({ payload: { ok: 0, msg: "获取视频失败!" }, uuid });
        }
        break;
      }
      case "GETCOMMENT": {
        const res = await getWeiboComment((payload as any).url);
        webviewView.webview.postMessage({
          command: `SENDCOMMENT`,
          payload: { payload: payload, ...res.data },
          uuid,
        } as CommandsType<weiboAJAX>);
        break;
      }
      case "GETLONGTEXT": {
        const res = await getLongText(payload);
        webviewView.webview.postMessage({
          command: `SENDLONGTEXT`,
          payload: { payload: payload, ...res.data },
          uuid,
        } as CommandsType<weiboAJAX>);
        break;
      }
      case "GETUSERBLOG": {
        const res = await getUserWeibo(payload);
        webviewView.webview.postMessage({
          command: `SENDUSERBLOG`,
          payload: { payload: payload, ...res.data },
          uuid,
        } as CommandsType<weiboAJAX>);
        break;
      }
      case "GETFOLLOW": {
        const res = await followUser(payload);
        webviewView.webview.postMessage({
          command: `SENDFOLLOW`,
          payload: { payload: payload, ...res.data },
          uuid,
        } as CommandsType<weiboAJAX>);
        break;
      }
      case "GETNEWBLOGRESULT": {
        const res = await sendWeibo(payload);
        webviewView.webview.postMessage({
          command: "SENDNEWBLOGRESULT",
          payload: { payload: payload, ...res.data },
          uuid,
        } as CommandsType<weiboAJAX>);
        break;
      }
      case "GETUPLOADIMGURL": {
        const uploadObj = JSON.parse(payload) as uploadType;
        const res = await uploadImage(uploadObj.base64);
        webviewView.webview.postMessage({
          command: `SENDUPLOADIMGURL`,
          payload: { payload: uploadObj.uid, uid: uploadObj.uid, type: uploadObj.type, ...res.data },
          uuid,
        } as CommandsType<weiboAJAX>);
        break;
      }
      case "GETCANCELFOLLOW": {
        const res = await cancelfollowUser(payload);
        webviewView.webview.postMessage({
          command: `SENDCANCELFOLLOW`,
          payload: { payload: payload, ...res.data },
          uuid,
        } as CommandsType<weiboAJAX>);
        break;
      }
      case "GETCREATECOMMENTS": {
        const res = await createComments(payload);
        webviewView.webview.postMessage({
          command: `SENDCREATECOMMENTS`,
          payload: { payload: payload, ...res.data },
          uuid,
        } as CommandsType<weiboAJAX>);
        break;
      }
      case "GETCREATEREPOST": {
        const res = await createRepost(payload);
        webviewView.webview.postMessage({
          command: `SENDCREATEREPOST`,
          payload: { payload: payload, ...res.data },
          uuid,
        } as CommandsType<weiboAJAX>);
        break;
      }
      case "GETSETLIKE": {
        const res = await setLike(payload);
        webviewView.webview.postMessage({
          command: `SENDSETLIKE`,
          payload: { payload: payload, ...res.data },
          uuid,
        } as CommandsType<weiboAJAX>);
        break;
      }
      case "GETCANCELLIKE": {
        const res = await cancelLike(payload);
        webviewView.webview.postMessage({
          command: `SENDCANCELLIKE`,
          payload: { payload: payload, ...res.data },
          uuid,
        } as CommandsType<weiboAJAX>);
        break;
      }
      case "GETSEARCH": {
        const res = await getWeiboSearch(payload);
        webviewView.webview.postMessage({
          command: `SENDSEARCH`,
          payload: { payload: payload, ...res.data },
          uuid,
        } as CommandsType<weiboAJAX>);
        break;
      }
      case "GETUSERBYNAME": {
        const res = await getUserByName(payload);
        webviewView.webview.postMessage({
          command: `SENDUSERBYNAME`,
          payload: { payload: payload, ...res.data },
          uuid,
        } as CommandsType<weiboAJAX>);
        break;
      }
      case "GETHOTSEARCH": {
        const res = await getHotSearch();
        webviewView.webview.postMessage({
          command: `SENDHOTSEARCH`,
          payload: { payload: payload, ...res.data },
          uuid,
        } as CommandsType<weiboAJAX>);
        break;
      }
    }
  }
}

