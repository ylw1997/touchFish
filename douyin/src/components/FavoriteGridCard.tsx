import { HeartFilled } from "@ant-design/icons";

interface FavoriteGridCardProps {
  aweme: any;
  onClick: () => void;
}

export default function FavoriteGridCard({ aweme, onClick }: FavoriteGridCardProps) {
  const { desc, video, statistics } = aweme;
  const coverUrl = video?.cover?.url_list?.[0] || "";

  const formatCount = (count: number) => {
    if (!count) return "0";
    if (count > 10000) {
      return (count / 10000).toFixed(1) + "w";
    }
    return count.toString();
  };

  return (
    <div className="dy-grid-card" onClick={onClick}>
      <img
        src={coverUrl}
        alt="封面"
        className="grid-cover"
        referrerPolicy="no-referrer"
        loading="lazy"
      />
      <div className="grid-info-bar">
        <div className="grid-title">{desc || "无描述"}</div>
        <div className="grid-stats">
          <HeartFilled style={{ color: "#fe2c55" }} />
          <span>{formatCount(statistics?.digg_count)}</span>
        </div>
      </div>
    </div>
  );
}
