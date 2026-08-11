interface LiveGridCardProps {
  aweme: any;
  onClick: () => void;
}

const parseRoom = (aweme: any) => {
  if (aweme?.liveRoom) return aweme.liveRoom;
  const rawdata = aweme?.cell_room?.rawdata;
  if (typeof rawdata === "object") return rawdata;
  try {
    return rawdata ? JSON.parse(rawdata) : null;
  } catch {
    return null;
  }
};

const formatCount = (count: number) => {
  if (!count) return "直播中";
  return count >= 10_000 ? `${(count / 10_000).toFixed(1)}万` : String(count);
};

export default function LiveGridCard({ aweme, onClick }: LiveGridCardProps) {
  const room = parseRoom(aweme);
  const owner = room?.owner || aweme?.author;
  const cover =
    room?.cover?.url_list?.[0] || owner?.avatar_thumb?.url_list?.[0] || "";

  return (
    <button type="button" className="live-grid-card" onClick={onClick}>
      <div className="live-grid-cover-wrap">
        {cover ? <img src={cover} alt="" className="live-grid-cover" referrerPolicy="no-referrer" /> : null}
        <span className="live-grid-badge">直播</span>
        <span className="live-grid-viewers">{formatCount(room?.user_count)}</span>
      </div>
      <strong>{room?.title || owner?.nickname || "抖音直播"}</strong>
      <span>@{owner?.nickname || "主播"}</span>
    </button>
  );
}
