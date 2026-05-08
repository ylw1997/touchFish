const assert = require("node:assert/strict");
const test = require("node:test");
const {
  parseChiphellList,
  parseHupuList,
  parseNgaList,
  parseV2exList,
  parseLinuxDoList,
} = require("../src/newsParsers");

test("parseChiphellList extracts thread links", () => {
  const items = parseChiphellList(`
    <table id="threadlisttableid">
      <a class="s xst" href="thread-123-1-1.html">Hello Chiphell</a>
      <a class="s xst" href="forum.php?mod=viewthread">Ignored</a>
    </table>
  `);

  assert.deepEqual(items, [
    { title: "Hello Chiphell", url: "https://www.chiphell.com/thread-123-1-1.html" },
  ]);
});

test("parseChiphellList extracts guide page rows", () => {
  const items = parseChiphellList(`
    <tbody id="normalthread_456">
      <a class="xst" href="thread-456-1-1.html">Guide Thread</a>
    </tbody>
  `);

  assert.deepEqual(items, [
    { title: "Guide Thread", url: "https://www.chiphell.com/thread-456-1-1.html" },
  ]);
});

test("parseV2exList extracts topic links", () => {
  const items = parseV2exList(`
    <div id="Main"><div class="box">
      <div class="cell item"><a class="topic-link" href="/t/1?p=1#reply1">Hello V2EX</a></div>
    </div></div>
  `);

  assert.deepEqual(items, [{ title: "Hello V2EX", url: "/t/1" }]);
});

test("parseHupuList extracts list items", () => {
  const items = parseHupuList(`
    <div class="text-list-model">
      <div class="list-item"><a href="123.html"><span class="t-title">Hello Hupu</span></a></div>
    </div>
  `);

  assert.deepEqual(items, [{ title: "Hello Hupu", url: "/123.html" }]);
});

test("parseNgaList extracts topics", () => {
  const items = parseNgaList(`
    <div id="topicrows">
      <a class="topic" href="/read.php?tid=1">Hello NGA</a>
    </div>
  `);

  assert.deepEqual(items, [{ title: "Hello NGA", url: "/read.php?tid=1" }]);
});

test("parseLinuxDoList normalizes discourse json", () => {
  const items = parseLinuxDoList({
    topic_list: {
      topics: [
        {
          id: 1,
          title: "Hello Linux.do",
          slug: "hello",
          posts_count: 2,
          bumped_at: "2026-05-08T00:00:00.000Z",
        },
      ],
    },
  });

  assert.deepEqual(items, [
    {
      id: 1,
      title: "Hello Linux.do",
      url: "https://linux.do/t/hello/1",
      postsCount: 2,
      time: "2026-05-08T00:00:00.000Z",
    },
  ]);
});
