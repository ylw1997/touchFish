export type commandsType<T> = {
  command: "GETDATA" | "SENDDATA" | "GETIMG" | "SENDIMG" | string,
  payload: T
};

export type weiboAJAX = {
  ok: number,
  since_id: number,
  max_id: number,
  total_number: number,
  since_id_str: string,
  max_id_str: string,
  statuses: weiboItem[]
}

export type weiboItem = {
  id: number;
  text: string;
  text_raw: string;
  source: string;
  pic_ids: string[];
  pic_infos: {
    [key: string]: {
      pic_id: string;
      type: "pic" | "video";
      largest: {
        url: string;
        height: number;
        width: number;
      },
      large: {
        url: string;
        height: number;
        width: number;
      },
      bmiddle: {
        url: string;
        height: number
        width: number
      }
    }
  }[];
  user: weiboUser;
  comments_count: number;
  pic_num: number;
}



export type weiboUser = {
  id: number;
  screen_name: string;
  avatar_hd: string;
  avatar_large: string;
}