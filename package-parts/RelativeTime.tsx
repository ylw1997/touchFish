import React from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/zh-cn";

dayjs.extend(relativeTime);
dayjs.locale("zh-cn");

export interface RelativeTimeProps {
  timestamp?: number | string | null;
  className?: string;
  needUnix?: boolean;
}

const RelativeTime: React.FC<RelativeTimeProps> = ({
  timestamp,
  className = "",
  needUnix = true,
}) => {
  const d = timestamp
    ? needUnix
      ? dayjs.unix(Number(timestamp))
      : dayjs(Number(timestamp))
    : null;

  const timeString = timestamp ? d!.fromNow() : "";

  return (
    <span
      title={timestamp ? d!.format("YYYY-MM-DD HH:mm") : ""}
      className={className}
    >
      {timeString}
    </span>
  );
};

export default RelativeTime;
