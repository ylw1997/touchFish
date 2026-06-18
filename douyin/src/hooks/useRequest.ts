import { App } from "antd";
import { useCallback } from "react";
import { CommandList } from "../../../types/commands";
import { generateUUID } from "../../../types/utils";
import { vscode } from "../utils/vscode";
import { messageHandler } from "../utils/messageHandler";

export const useRequest = () => {
  const { message: messageApi } = App.useApp();

  const request = useCallback(
    <T = any>(command: CommandList, payload?: any): Promise<T> => {
      const uuid = generateUUID();

      return new Promise<T>((resolve, reject) => {
        messageHandler.addRequest(uuid, resolve, reject);
        vscode.postMessage({ command, payload, uuid });
      });
    },
    []
  );

  return { request, messageApi };
};
