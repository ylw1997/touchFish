export interface XiaoyuzhouDiscoveryBlock {
  type: "BANNER" | "EPISODES" | "EDITOR_PICK";
  title?: string;
  items: any[];
}

function normalizeItems(value: unknown) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];

  const record = value as Record<string, any>;
  if (Array.isArray(record.picks)) return record.picks;
  if (Array.isArray(record.target)) return record.target;
  if (Array.isArray(record.items)) return record.items;

  return [];
}

export function parseXiaoyuzhouDiscoveryBlocks(
  blocks: unknown,
): XiaoyuzhouDiscoveryBlock[] {
  if (!Array.isArray(blocks)) return [];

  return blocks
    .map((block: any) => {
      const type = block?.type;
      const data = block?.data;

      if (type === "DISCOVERY_COVER_BANNER" && Array.isArray(data)) {
        return {
          type: "BANNER" as const,
          items: data.map((item: any) => ({
            id: item.id,
            image: item.image,
            url: item.url,
            title: item.voiceover || "",
          })),
        };
      }

      if (type === "DISCOVERY_EPISODE_RECOMMEND" && data?.target) {
        return {
          type: "EPISODES" as const,
          title: data.title || "为你推荐",
          items: data.target
            .map((item: any) => item?.episode || item)
            .filter(Boolean),
        };
      }

      if (type === "EDITOR_PICK") {
        return {
          type: "EDITOR_PICK" as const,
          title: "编辑精选",
          items: normalizeItems(data)
            .map((item: any) => item?.episode || item?.podcast || item)
            .filter(Boolean),
        };
      }

      return null;
    })
    .filter(Boolean) as XiaoyuzhouDiscoveryBlock[];
}
