// QQ音乐平台端点
const { commonHeaders, fetchJson } = require("../../upstream");
const { endpoint, p, getQuery, requireQuery, parseJson } = require("../utils");
const qqmusic = require("../../qqmusicCore");

// musicu endpoint 辅助函数
function musicuEndpoint({ id, name, path, params = [], build, parse, method = "GET" }) {
  return endpoint({
    id,
    platformId: "qqmusic",
    name,
    method,
    path,
    params,
    handler: async (ctx) => {
      const result = await qqmusic.musicu(ctx, build(ctx));
      return { ...result, data: parse ? parse(result.data, ctx) : result.data };
    },
  });
}

// JSON handler 辅助函数
function jsonHandler(build) {
  return async (ctx) => {
    const request = await build(ctx);
    return fetchJson(ctx.fetchImpl, request.url, {
      method: request.method || "GET",
      headers: request.headers,
      body: request.body,
    });
  };
}

const qqmusicEndpoints = [
  // 搜索歌曲
  endpoint({
    id: "qqmusic-search-songs",
    platformId: "qqmusic",
    name: "搜索歌曲",
    path: "/api/qqmusic/search",
    params: [p("keyword", true, "周杰伦"), p("page", false, "1"), p("num", false, "20")],
    handler: jsonHandler(({ url }) => ({
      url: `https://c.y.qq.com/soso/fcgi-bin/client_search_cp?p=${getQuery(url, "page", "1")}&n=${getQuery(url, "num", "20")}&w=${encodeURIComponent(requireQuery(url, "keyword"))}`,
      headers: commonHeaders("", { referer: "https://y.qq.com/" }),
    })),
  }),

  // 搜索歌手
  endpoint({
    id: "qqmusic-search-singers",
    platformId: "qqmusic",
    name: "搜索歌手",
    path: "/api/qqmusic/search-singers",
    params: [p("keyword", true, "周杰伦")],
    handler: jsonHandler(({ url }) => ({
      url: `https://c.y.qq.com/soso/fcgi-bin/client_search_cp?p=${getQuery(url, "page", "1")}&n=${getQuery(url, "num", "20")}&w=${encodeURIComponent(requireQuery(url, "keyword"))}&type=singer`,
      headers: commonHeaders("", { referer: "https://y.qq.com/" }),
    })),
  }),

  // 歌词
  endpoint({
    id: "qqmusic-lyric",
    platformId: "qqmusic",
    name: "歌词",
    path: "/api/qqmusic/lyric",
    params: [p("mid", true, "0039MnYb0qxYhV")],
    handler: jsonHandler(({ url }) => ({
      url: `https://c.y.qq.com/lyric/fcgi-bin/fcg_query_lyric_new.fcg?songmid=${requireQuery(url, "mid")}&format=json&nobase64=1`,
      headers: commonHeaders("", { referer: "https://y.qq.com/" }),
    })),
  }),

  // 榜单列表
  endpoint({
    id: "qqmusic-rank-lists",
    platformId: "qqmusic",
    name: "榜单列表",
    path: "/api/qqmusic/rank-lists",
    handler: async (ctx) => {
      const result = await qqmusic.musicu(ctx, {
        "music.musicToplist.Toplist.GetAll": {
          module: "music.musicToplist.Toplist",
          method: "GetAll",
          param: {},
        },
      });
      const groups = result.data?.["music.musicToplist.Toplist.GetAll"]?.data?.group || [];
      const topList = groups.flatMap((group) => group.toplist || []);
      return {
        ...result,
        data: {
          items: topList.map((item) => ({
            id: item.topId,
            topId: item.topId,
            title: item.title,
            subtitle: item.titleShare || item.titleDetail,
            picUrl: item.headPicUrl || item.frontPicUrl,
            update_key: item.update_key,
          })),
        },
      };
    },
  }),

  // 榜单详情
  endpoint({
    id: "qqmusic-rank-detail",
    platformId: "qqmusic",
    name: "榜单详情",
    path: "/api/qqmusic/rank-detail",
    params: [p("topId", true, "62"), p("page", false, "1"), p("num", false, "30")],
    handler: async (ctx) => {
      const page = Number(getQuery(ctx.url, "page", "1")) || 1;
      const num = Number(getQuery(ctx.url, "num", "30")) || 30;
      const topId = Number(requireQuery(ctx.url, "topId"));
      const result = await qqmusic.musicu(ctx, {
        "music.musicToplist.Toplist.GetDetail": {
          module: "music.musicToplist.Toplist",
          method: "GetDetail",
          param: { topId, offset: num * (page - 1), num, withTags: false },
        },
      });
      const rawData = result.data?.["music.musicToplist.Toplist.GetDetail"]?.data || {};
      const resData = rawData.data || rawData;
      return {
        ...result,
        data: {
          rankInfo: {
            id: resData.topId || topId,
            topId: resData.topId || topId,
            title: resData.title || "unknown",
            subtitle: resData.titleShare || resData.titleDetail,
            picUrl: resData.headPicUrl || resData.frontPicUrl,
            update_key: resData.update_key,
          },
          songs: (rawData.songInfoList || resData.songInfoList || resData.song || []).map(qqmusic.song),
        },
      };
    },
  }),

  // 歌曲URL
  endpoint({
    id: "qqmusic-song-url",
    platformId: "qqmusic",
    name: "歌曲链接",
    path: "/api/qqmusic/song-url",
    params: [p("mid", true, "0039MnYb0qxYhV"), p("quality", false, "128")],
    handler: async (ctx) => {
      const mid = requireQuery(ctx.url, "mid");
      const quality = Number(getQuery(ctx.url, "quality", "128"));
      const fileType = quality === 999 ? "F000" : quality === 320 ? "M800" : "M500";
      const extension = quality === 999 ? ".flac" : ".mp3";
      const filename = `${fileType}${mid}${mid}${extension}`;
      const result = await qqmusic.musicu(
        ctx,
        {
          "music.vkey.GetVkey.UrlGetVkey": {
            method: "UrlGetVkey",
            module: "music.vkey.GetVkey",
            param: { filename: [filename], guid: qqmusic.guid(), songmid: [mid], songtype: [0] },
          },
        },
        { comm: { ct: "19" } },
      );
      const urlInfo = result.data?.["music.vkey.GetVkey.UrlGetVkey"]?.data?.midurlinfo?.[0];
      return { ...result, data: { url: urlInfo?.purl ? `https://isure.stream.qqmusic.qq.com/${urlInfo.purl}` : "", raw: urlInfo || null } };
    },
  }),

  // 歌曲详情
  musicuEndpoint({
    id: "qqmusic-song-detail",
    name: "歌曲详情",
    path: "/api/qqmusic/song-detail",
    params: [p("mid", true, "0039MnYb0qxYhV")],
    build: (ctx) => ({
      "music.pf_song_detail_svr": {
        method: "get_song_detail_yqq",
        module: "music.pf_song_detail_svr",
        param: { song_mid: requireQuery(ctx.url, "mid") },
      },
    }),
    parse: (data) => qqmusic.song(data?.["music.pf_song_detail_svr"]?.data?.track_info || {}),
  }),

  // 推荐歌单
  musicuEndpoint({
    id: "qqmusic-recommend-playlists",
    name: "推荐歌单",
    path: "/api/qqmusic/recommend-playlists",
    params: [p("num", false, "10")],
    build: (ctx) => ({
      "music.playlist.PlaylistSquare.GetRecommendFeed": {
        module: "music.playlist.PlaylistSquare",
        method: "GetRecommendFeed",
        param: { From: 0, Size: Number(getQuery(ctx.url, "num", "10")) || 10 },
      },
    }),
    parse: (data) => ({
      items: (data?.["music.playlist.PlaylistSquare.GetRecommendFeed"]?.data?.List || []).map((item) =>
        qqmusic.playlist(item.Playlist?.basic || {}),
      ),
    }),
  }),

  // 歌单详情
  endpoint({
    id: "qqmusic-playlist-detail",
    platformId: "qqmusic",
    name: "歌单详情",
    path: "/api/qqmusic/playlist-detail",
    params: [p("dissid", true, "1"), p("page", false, "1"), p("num", false, "30")],
    handler: async (ctx) => {
      const page = Number(getQuery(ctx.url, "page", "1")) || 1;
      const num = Number(getQuery(ctx.url, "num", "30")) || 30;
      const dissid = Number(requireQuery(ctx.url, "dissid"));
      const result = await qqmusic.musicu(ctx, {
        "music.srfDissInfo.DissInfo": {
          method: "CgiGetDiss",
          module: "music.srfDissInfo.DissInfo",
          param: { disstid: dissid, dirid: 0, tag: true, song_begin: (page - 1) * num, song_num: num, userinfo: true, orderlist: true, onlysonglist: false },
        },
      });
      const data = result.data?.["music.srfDissInfo.DissInfo"]?.data || {};
      return {
        ...result,
        data: {
          playlist: qqmusic.playlist({ id: data.dirinfo?.id || dissid, title: data.dirinfo?.title, picurl: data.dirinfo?.picurl, nick: data.dirinfo?.creator?.nick, songnum: data.total_song_num }),
          songs: (data.songlist || []).map(qqmusic.song),
        },
      };
    },
  }),

  // 用户信息
  endpoint({
    id: "qqmusic-user-info",
    platformId: "qqmusic",
    name: "用户信息",
    path: "/api/qqmusic/user-info",
    handler: async (ctx) => {
      const credential = qqmusic.requireCredential(ctx);
      const result = await qqmusic.musicu(ctx, {
        "music.UserInfo.userInfoServer": {
          method: "GetLoginUserInfo",
          module: "music.UserInfo.userInfoServer",
          param: {},
        },
      });
      const info = result.data?.["music.UserInfo.userInfoServer"]?.data?.info || {};
      return { ...result, data: { musicid: credential.musicid, nickname: info.nick || "", avatar: info.logo || "" } };
    },
  }),

  // 我的收藏
  endpoint({
    id: "qqmusic-my-favorite",
    platformId: "qqmusic",
    name: "my-favorite",
    path: "/api/qqmusic/my-favorite",
    params: [p("page", false, "1"), p("num", false, "30")],
    handler: async (ctx) => {
      const credential = qqmusic.requireCredential(ctx);
      const page = Number(getQuery(ctx.url, "page", "1")) || 1;
      const num = Number(getQuery(ctx.url, "num", "30")) || 30;
      const euin = await qqmusic.getEuin(ctx, credential.musicid);
      const result = await qqmusic.musicu(ctx, {
        "music.srfDissInfo.DissInfo": {
          method: "CgiGetDiss",
          module: "music.srfDissInfo.DissInfo",
          param: { disstid: 0, dirid: 201, tag: true, song_begin: (page - 1) * num, song_num: num, userinfo: true, orderlist: true, enc_host_uin: euin },
        },
      });
      const data = result.data?.["music.srfDissInfo.DissInfo"]?.data || {};
      return { ...result, data: { songs: (data.songlist || []).map(qqmusic.song), total: data.total_song_num || 0 } };
    },
  }),

  // 我的歌单
  endpoint({
    id: "qqmusic-my-playlists",
    platformId: "qqmusic",
    name: "my-playlists",
    path: "/api/qqmusic/my-playlists",
    handler: async (ctx) => {
      const credential = qqmusic.requireCredential(ctx);
      const result = await qqmusic.musicu(ctx, {
        "music.musicasset.PlaylistBaseRead": {
          method: "GetPlaylistByUin",
          module: "music.musicasset.PlaylistBaseRead",
          param: { uin: credential.musicid },
        },
      });
      return { ...result, data: { items: (result.data?.["music.musicasset.PlaylistBaseRead"]?.data?.v_playlist || []).map(qqmusic.playlist) } };
    },
  }),

  // 雷达推荐
  musicuEndpoint({
    id: "qqmusic-radar-recommend",
    name: "radar-recommend",
    path: "/api/qqmusic/radar-recommend",
    build: () => ({
      "music.recommend.TrackRelationServer": {
        method: "GetRadarSong",
        module: "music.recommend.TrackRelationServer",
        param: { Page: 1, ReqType: 0, FavSongs: [], EntranceSongs: [] },
      },
    }),
    parse: (data) => data?.["music.recommend.TrackRelationServer"]?.data || null,
  }),

  // 猜你喜欢
  musicuEndpoint({
    id: "qqmusic-guess-recommend",
    name: "guess-recommend",
    path: "/api/qqmusic/guess-recommend",
    build: () => ({
      "music.radioProxy.MbTrackRadioSvr": {
        method: "get_radio_track",
        module: "music.radioProxy.MbTrackRadioSvr",
        param: { id: 99, num: 5, from: 0, scene: 0, song_ids: [], ext: { bluetooth: "" }, should_count_down: 1 },
      },
    }),
    parse: (data) => data?.["music.radioProxy.MbTrackRadioSvr"]?.data || null,
  }),

  // 歌手信息
  musicuEndpoint({
    id: "qqmusic-singer-info",
    name: "singer-info",
    path: "/api/qqmusic/singer-info",
    params: [p("mid", true, "0025NhlN2yWrP4")],
    build: (ctx) => ({
      "music.UnifiedHomepage.UnifiedHomepageSrv": {
        method: "GetHomepageHeader",
        module: "music.UnifiedHomepage.UnifiedHomepageSrv",
        param: { SingerMid: requireQuery(ctx.url, "mid") },
      },
    }),
    parse: (data) => data?.["music.UnifiedHomepage.UnifiedHomepageSrv"]?.data || {},
  }),

  // 歌手歌曲
  musicuEndpoint({
    id: "qqmusic-singer-songs",
    name: "singer-songs",
    path: "/api/qqmusic/singer-songs",
    params: [p("mid", true, "0025NhlN2yWrP4"), p("page", false, "1"), p("num", false, "20")],
    build: (ctx) => {
      const page = Number(getQuery(ctx.url, "page", "1")) || 1;
      const num = Number(getQuery(ctx.url, "num", "20")) || 20;
      return {
        "musichall.song_list_server": {
          method: "GetSingerSongList",
          module: "musichall.song_list_server",
          param: { singerMid: requireQuery(ctx.url, "mid"), order: 1, number: num, begin: (page - 1) * num },
        },
      };
    },
    parse: (data) => ({ items: (data?.["musichall.song_list_server"]?.data?.songList || []).map((item) => qqmusic.song(item.songInfo || item)) }),
  }),

  // 添加歌曲到歌单
  endpoint({
    id: "qqmusic-add-songs",
    platformId: "qqmusic",
    name: "add-songs",
    method: "POST",
    path: "/api/qqmusic/add-songs",
    params: [p("payload", false, '{"dirid":201,"songIds":[1]}')],
    handler: async (ctx) => {
      qqmusic.requireCredential(ctx);
      const payload = parseJson(ctx.body || "{}");
      const result = await qqmusic.musicu(ctx, {
        "music.musicasset.PlaylistDetailWrite": {
          method: "AddSonglist",
          module: "music.musicasset.PlaylistDetailWrite",
          param: {
            dirId: Number(payload.dirid || payload.dirId || 201),
            v_songInfo: (payload.songIds || []).map((id) => ({ songType: 0, songId: Number(id) })),
          },
        },
      });
      const data = result.data?.["music.musicasset.PlaylistDetailWrite"]?.data || {};
      return { ...result, data: { ok: !!data.result?.updateTime, raw: data } };
    },
  }),

  // 从歌单删除歌曲
  endpoint({
    id: "qqmusic-remove-songs",
    platformId: "qqmusic",
    name: "remove-songs",
    method: "POST",
    path: "/api/qqmusic/remove-songs",
    params: [p("payload", false, '{"dirid":201,"songIds":[1]}')],
    handler: async (ctx) => {
      qqmusic.requireCredential(ctx);
      const payload = parseJson(ctx.body || "{}");
      const result = await qqmusic.musicu(ctx, {
        "music.musicasset.PlaylistDetailWrite": {
          method: "DelSonglist",
          module: "music.musicasset.PlaylistDetailWrite",
          param: {
            dirId: Number(payload.dirid || payload.dirId || 201),
            v_songInfo: (payload.songIds || []).map((id) => ({ songType: 0, songId: Number(id) })),
          },
        },
      });
      const data = result.data?.["music.musicasset.PlaylistDetailWrite"]?.data || {};
      return { ...result, data: { ok: !!data.result?.updateTime, raw: data } };
    },
  }),
];

module.exports = { qqmusicEndpoints };
