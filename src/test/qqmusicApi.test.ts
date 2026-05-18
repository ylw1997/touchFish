import * as assert from "assert";
import { before, describe, it } from "mocha";
import axios from "axios";
import * as Module from "module";
import type { QQMusicCredential } from "../api/qqmusic";

const originalLoad = (Module as any)._load;
(Module as any)._load = function (
  request: string,
  parent: NodeModule | null,
  isMain: boolean,
) {
  if (request === "vscode") {
    return {
      window: {
        showErrorMessage: () => undefined,
      },
    };
  }

  return originalLoad.call(this, request, parent, isMain);
};

let qqmusicApi: typeof import("../api/qqmusic");

before(async () => {
  qqmusicApi = await import("../api/qqmusic");
});

describe("qqmusic api credential refresh", () => {
  it("refreshes a credential with the QQ Music login refresh payload", async () => {
    const originalPost = axios.post;
    const credential: QQMusicCredential = {
      musicid: "1152921504000000000",
      musickey: "W_X_expired",
      refresh_key: "refresh-key",
      refresh_token: "refresh-token",
      openid: "openid",
      unionid: "unionid",
      login_type: 1,
    };

    (axios as any).post = async (_url: string, data: any) => {
      const request = data["music.login.LoginServer.Login"];
      assert.equal(request.module, "music.login.LoginServer");
      assert.equal(request.method, "Login");
      assert.deepEqual(request.param, {
        openid: "openid",
        refresh_token: "refresh-token",
        str_musicid: "1152921504000000000",
        musicid: "1152921504000000000",
        musickey: "W_X_expired",
        unionid: "unionid",
        refresh_key: "refresh-key",
        loginMode: 2,
      });
      assert.equal(data.comm.tmeLoginType, 1);

      return {
        data: {
          code: 0,
          "music.login.LoginServer.Login": {
            code: 0,
            data: {
              str_musicid: "1152921504000000000",
              musickey: "W_X_fresh",
              refresh_key: "fresh-refresh-key",
              refresh_token: "fresh-refresh-token",
              openid: "openid",
              unionid: "unionid",
              loginType: 1,
            },
          },
        },
      };
    };

    try {
      const refreshed = await qqmusicApi.refreshQQMusicCredential(credential);

      assert.deepEqual(refreshed, {
        musicid: "1152921504000000000",
        musickey: "W_X_fresh",
        refresh_key: "fresh-refresh-key",
        refresh_token: "fresh-refresh-token",
        openid: "openid",
        unionid: "unionid",
        access_token: "",
        expired_at: 0,
        str_musicid: "1152921504000000000",
        login_type: 1,
        musickeyCreateTime: 0,
        keyExpiresIn: 0,
      });
    } finally {
      (axios as any).post = originalPost;
      qqmusicApi.setGlobalCredential(null);
    }
  });

  it("refreshes and retries once when a login-gated request reports expired credential", async () => {
    const originalPost = axios.post;
    let userInfoAttempts = 0;

    qqmusicApi.setGlobalCredential({
      musicid: "1152921504000000000",
      musickey: "W_X_expired",
      refresh_key: "refresh-key",
      refresh_token: "refresh-token",
      openid: "openid",
      unionid: "unionid",
      login_type: 1,
    });

    (axios as any).post = async (_url: string, data: any, config?: any) => {
      if (data["music.UserInfo.userInfoServer"]) {
        userInfoAttempts += 1;

        if (userInfoAttempts === 1) {
          return {
            data: {
              code: 0,
              "music.UserInfo.userInfoServer": {
                code: 104401,
                message: "expired",
              },
            },
          };
        }

        assert.equal(data.comm.authst, "W_X_fresh");
        assert.ok(String(config?.headers?.Cookie || "").includes("qqmusic_key=W_X_fresh"));
        return {
          data: {
            code: 0,
            "music.UserInfo.userInfoServer": {
              code: 0,
              data: {
                info: {
                  nick: "Fresh User",
                  logo: "https://example.com/avatar.png",
                },
              },
            },
          },
        };
      }

      if (data["music.login.LoginServer.Login"]) {
        return {
          data: {
            code: 0,
            "music.login.LoginServer.Login": {
              code: 0,
              data: {
                str_musicid: "1152921504000000000",
                musickey: "W_X_fresh",
                refresh_key: "fresh-refresh-key",
                refresh_token: "fresh-refresh-token",
                openid: "openid",
                unionid: "unionid",
                loginType: 1,
              },
            },
          },
        };
      }

      throw new Error("Unexpected QQMusic request");
    };

    try {
      const result = await qqmusicApi.getUserInfo();

      assert.equal(result.code, 0);
      assert.equal(userInfoAttempts, 2);
      assert.equal(result.data.nickname, "Fresh User");
      assert.equal(result.data.musickey, "W_X_fresh");
      assert.equal(result.data.refresh_token, "fresh-refresh-token");
    } finally {
      (axios as any).post = originalPost;
      qqmusicApi.setGlobalCredential(null);
    }
  });
});
