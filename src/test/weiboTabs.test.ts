import * as assert from "assert";
import { suite, test } from "mocha";
import {
  buildWeiboTabsFromGroups,
  defaultWeiboActiveKey,
  getWeiboUidFromGroups,
} from "../../weibo/src/data/weiboTabs";

suite("weibo tabs", () => {
  test("builds user-specific tabs from allGroups response", () => {
    const tabs = buildWeiboTabsFromGroups({
      groups: [
        {
          title: "默认分组",
          group: [
            { gid: "10001", title: "全部关注" },
            { gid: "11000", title: "最新微博" },
            { gid: "45634", title: "特别关注" },
            { gid: "10009", title: "互相关注" },
          ],
        },
        {
          title: "我的分组",
          group: [{ gid: "10005", title: "悄悄关注" }],
        },
        {
          title: "我的频道",
          group: [
            { gid: "102803", title: "热门", containerid: "102803" },
            {
              gid: "1028034188",
              title: "社会",
              containerid: "102803_ctg1_4188_-_ctg1_4188",
            },
          ],
        },
      ],
    });

    assert.deepStrictEqual(
      tabs.map((tab) => tab.label),
      ["推荐", "全部", "最新", "特别", "好友", "我的"]
    );
    assert.strictEqual(defaultWeiboActiveKey(tabs), tabs[1].key);
    assert.strictEqual(
      tabs[1].key,
      "/unreadfriendstimeline?list_id=10001&refresh=4&since_id=0&count=15"
    );
    assert.strictEqual(
      tabs[2].key,
      "/friendstimeline?list_id=11000&refresh=4&since_id=0&count=25"
    );
    assert.strictEqual(
      tabs[3].key,
      "/groupstimeline?list_id=45634&refresh=4&since_id=0&count=25"
    );
    assert.strictEqual(
      tabs[4].key,
      "/groupstimeline?list_id=10009&refresh=4&since_id=0&count=25"
    );
    assert.deepStrictEqual(tabs[5].childrenList?.map((tab) => tab.label), [
      "悄悄关注",
    ]);
    assert.strictEqual(
      tabs[0].childrenList?.[1].key,
      "/hottimeline?group_id=1028034188&containerid=102803_ctg1_4188_-_ctg1_4188&extparam=discover%7Cnew_feed&max_id=0&count=25"
    );
    assert.strictEqual(
      getWeiboUidFromGroups({
        groups: [
          {
            title: "默认分组",
            group: [{ gid: "10001", uid: "7515513422", title: "全部关注" }],
          },
        ],
      }),
      "7515513422"
    );
  });

  test("does not fall back to hard-coded tabs when groups are missing", () => {
    const tabs = buildWeiboTabsFromGroups({ groups: [] });

    assert.deepStrictEqual(tabs, []);
    assert.strictEqual(defaultWeiboActiveKey(tabs), "");
    assert.strictEqual(getWeiboUidFromGroups({ groups: [] }), "");
  });

  test("selects all tab first even when channel groups are unavailable", () => {
    const tabs = buildWeiboTabsFromGroups({
      groups: [
        {
          title: "默认分组",
          group: [
            { gid: "10001", title: "全部关注" },
            { gid: "11000", title: "最新微博" },
          ],
        },
      ],
    });

    assert.strictEqual(tabs[0].label, "全部");
    assert.strictEqual(defaultWeiboActiveKey(tabs), tabs[0].key);
  });

  test("maps focus tabs by default group title when group order changes", () => {
    const tabs = buildWeiboTabsFromGroups({
      groups: [
        {
          title: "默认分组",
          group: [
            { gid: "10009", title: "互相关注" },
            { gid: "10001", title: "全部关注" },
            { gid: "45634", title: "特别关注" },
            { gid: "11000", title: "最新微博" },
          ],
        },
      ],
    });

    const friendTab = tabs.find((tab) => tab.label === "好友");

    assert.strictEqual(
      friendTab?.key,
      "/groupstimeline?list_id=10009&refresh=4&since_id=0&count=25"
    );
  });
});
