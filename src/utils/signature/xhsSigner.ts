import { XhsClient, XhsSignature } from "./xhsClient";

export type { XhsSignature };

const xhsClient = new XhsClient();

export async function getXhsSignature(
  apiPath: string,
  payload: any,
  cookie: string,
  method: "GET" | "POST" = "POST",
  userId?: string
): Promise<XhsSignature> {
  try {
    return await xhsClient.signAsync(apiPath, payload, cookie, method, userId);
  } catch (e: any) {
    throw new Error(`Failed to execute xhs signature: ${e.message}`);
  }
}

export function getXhsSignatureSync(
  apiPath: string,
  payload: any,
  cookie: string,
  method: "GET" | "POST" = "POST",
  userId?: string
): XhsSignature {
  try {
    return xhsClient.sign(apiPath, payload, cookie, method, userId);
  } catch (e: any) {
    throw new Error(`Failed to execute xhs signature: ${e.message}`);
  }
}
