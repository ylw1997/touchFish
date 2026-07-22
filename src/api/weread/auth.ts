const AUTH_ERROR_CODES = new Set([-2012, -2013, -12013]);

export class WeReadAuthError extends Error {
  constructor(
    message: string,
    public readonly errCode?: number,
  ) {
    super(message);
    this.name = "WeReadAuthError";
  }
}

function getErrorCode(value: any): number | undefined {
  const code = value?.errCode ?? value?.response?.data?.errCode;
  return typeof code === "number" ? code : undefined;
}

export function isWeReadAuthFailure(value: any): boolean {
  const errCode = getErrorCode(value);
  if (errCode !== undefined && AUTH_ERROR_CODES.has(errCode)) {
    return true;
  }

  if (value?.response?.status === 401) {
    return true;
  }

  const message = String(
    value?.errMsg ?? value?.response?.data?.errMsg ?? value?.message ?? "",
  );
  return message.includes("鉴权失败") || message.includes("登录授权已过期");
}

export function assertWeReadAuthenticated(value: any): void {
  if (!isWeReadAuthFailure(value)) return;

  const errCode = getErrorCode(value);
  const message = String(
    value?.errMsg ?? value?.response?.data?.errMsg ?? value?.message ?? "微信读书登录已失效",
  );
  throw new WeReadAuthError(message, errCode);
}

export function assertWeReadTextAuthenticated(text: string): void {
  try {
    assertWeReadAuthenticated(JSON.parse(text));
  } catch (error) {
    if (error instanceof SyntaxError) return;
    throw error;
  }
}
