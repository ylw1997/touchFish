interface XhsFeedResponse {
    items: any[];
    cursor?: string;
    has_more?: boolean;
}
export declare function fetchFeed(cursor: string): Promise<XhsFeedResponse>;
export {};
