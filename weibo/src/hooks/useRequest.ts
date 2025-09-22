import { message } from "antd";
import { useCallback } from "react";
import { request as httpRequest } from "../utils/request";
import { CommandList } from "../../../type";

export const useRequest = () => {
  const [messageApi, contextHolder] = message.useMessage();

  const request = useCallback(
    <T = any>(
      command: CommandList,
      payload: any,
      content: string
    ): Promise<T> => {
      return httpRequest<T>(command, payload, content, messageApi);
    },
    [messageApi]
  );

  return { request, contextHolder, messageApi };
};
