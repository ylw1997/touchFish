export interface ApiResponse<T> {
  code: number;
  message?: string;
  data: T;
}

export interface XiaoyuzhouUserInfo {
  uid: string;
  nickname: string;
  avatar?: string;
}

export interface XiaoyuzhouImage {
  picUrl?: string;
  largePicUrl?: string;
  middlePicUrl?: string;
  smallPicUrl?: string;
  thumbnailUrl?: string;
}

export interface XiaoyuzhouPodcast {
  pid: string;
  title: string;
  author?: string;
  description?: string;
  brief?: string;
  image?: XiaoyuzhouImage;
  subscriptionCount?: number;
  episodeCount?: number;
  latestEpisodePubDate?: string;
}

export interface XiaoyuzhouEpisode {
  eid: string;
  pid: string;
  title: string;
  description?: string;
  shownotes?: string;
  enclosure?: { url?: string };
  media?: {
    source?: { url?: string };
    backupSource?: { url?: string };
  };
  image?: XiaoyuzhouImage;
  podcast?: XiaoyuzhouPodcast;
  pubDate?: string;
  duration?: number;
  playCount?: number;
}
