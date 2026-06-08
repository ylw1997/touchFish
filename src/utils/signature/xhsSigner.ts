import { XhsClient } from "./xhsClient";

export interface XhsSignature {
  xs: string;
  xt: string;
  xs_common: string;
}

const xhsClient = new XhsClient();

export async function getXhsSignature(
  apiPath: string,
  payload: any,
  cookie: string,
  method: "GET" | "POST" = "POST"
): Promise<XhsSignature> {
  try {
    const signature = xhsClient.sign(apiPath, payload, cookie, method);
    return {
      xs: signature.xs,
      xt: String(signature.xt),
      xs_common: signature.xs_common,
    };
  } catch (e: any) {
    throw new Error(`Failed to execute xhs signature: ${e.message}`);
  }
}
