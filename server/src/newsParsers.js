const { load } = require("cheerio");

function normalizeSpace(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function uniqueItems(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = item.url || item.title;
    if (!item.title || !key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function absoluteUrl(base, href) {
  if (!href) return "";
  try {
    return new URL(href, base).toString();
  } catch {
    return href;
  }
}

function parseChiphellList(html) {
  const $ = load(html);
  const items = [];

  $("#threadlisttableid a.s.xst").each((_, a) => {
    const title = normalizeSpace($(a).text());
    const href = ($(a).attr("href") || "").split("#")[0].trim();
    if (!href.startsWith("thread-")) return;
    items.push({ title, url: absoluteUrl("https://www.chiphell.com/", href) });
  });

  if (!items.length) {
    $("#waterfall h3.xw0 a, a.xst, .bm_c a.xst").each((_, a) => {
      const title = normalizeSpace($(a).text());
      const href = ($(a).attr("href") || "").split("#")[0].trim();
      if (!title || !href) return;
      if (!href.startsWith("thread-") && !href.includes("/thread-") && !href.includes("tid=")) return;
      items.push({ title, url: absoluteUrl("https://www.chiphell.com/", href) });
    });
  }

  return uniqueItems(items);
}

function parseChiphellDetail(html) {
  const $ = load(html);
  const content = $(".t_fsz").html() || "";
  return {
    html: content
      .replace(/src="static\/image\/common\/none.gif/g, "")
      .replace(/src="static/g, 'src="https://www.chiphell.com/static')
      .replace(/zoomfile/g, "src"),
  };
}

function parseV2exList(html) {
  const $ = load(html);
  const items = [];
  $("#Main .box")
    .first()
    .find(".cell.item")
    .each((_, element) => {
      const link = $(element).find(".topic-link");
      const href = (link.attr("href") || "").split("#")[0].split("?")[0];
      items.push({ title: normalizeSpace(link.text()), url: href });
    });
  return uniqueItems(items);
}

function parseV2exDetail(html) {
  const $ = load(html);
  return { html: ($("#Main").html() || "").replace(/&nbsp;/g, "") };
}

function parseHupuList(html, tab = "all-gambia") {
  const $ = load(html);
  const items = [];
  if (tab === "all-gambia") {
    $(".text-list-model .list-item").each((_, element) => {
      const link = $(element).find("a").first();
      let href = link.attr("href") || "";
      if (href && !href.startsWith("http") && !href.startsWith("/")) href = `/${href}`;
      items.push({ title: normalizeSpace($(element).find(".t-title").text()), url: href });
    });
  } else {
    $(".bbs-sl-web-post .post-title").each((_, element) => {
      const link = $(element).find(".p-title");
      let href = link.attr("href") || "";
      if (href && !href.startsWith("http") && !href.startsWith("/")) href = `/${href}`;
      items.push({ title: normalizeSpace(link.text()), url: href });
    });
  }
  return uniqueItems(items);
}

function parseHupuDetail(html) {
  const cleaned = html.replace(/__.\w*"/g, '"').replace(/__.\w*\s/g, " ");
  const $ = load(cleaned);
  return { html: $(".index_bbs-post-web-body-left-wrapper").html() || "" };
}

function parseNgaList(html) {
  const $ = load(html);
  const items = [];
  $("#topicrows .topic").each((_, element) => {
    items.push({
      title: normalizeSpace($(element).text()),
      url: $(element).attr("href") || "",
    });
  });
  return uniqueItems(items);
}

function parseNgaDetail(html) {
  let content = html
    .replace(/\[img\].\//g, "[img]")
    .replace(/\[img\](.*?)\[\/img\]/g, '<img src="https://img.nga.178.com/attachments/$1" />')
    .replace(/\[pid=(.*?)\](.*?)\[\/b\]/g, "")
    .replace(/\[s:(.*?)\]/g, "")
    .replace(/\[quote\]/g, '<div class="comment_c">')
    .replace(/\[\/quote\]/g, "</div>")
    .replace(/\[tid(.*?)\](.*?)\[\/tid\]/g, "")
    .replace(/\[b\](.*?)\[\/b\]/g, "");
  const $ = load(content);
  const pageMatch = html.match(/__PAGE\s*=\s*\{.*?\b1\s*:\s*(\d+)/);
  const currentMatch = html.match(/__PAGE\s*=\s*\{.*?\b2\s*:\s*(\d+)/);
  const authorMatch = html.match(/commonui\.postArg\.setDefault\([^,]+,[^,]+,[^,]+,(-?\d+)/);
  return {
    html: $("#m_posts").html() || "",
    totalPages: pageMatch ? Number(pageMatch[1]) || 1 : 1,
    currentPage: currentMatch ? Number(currentMatch[1]) || 1 : 1,
    authorUid: authorMatch ? Number(authorMatch[1]) || 0 : 0,
  };
}

function parseLinuxDoList(data) {
  const topics = data?.topic_list?.topics || [];
  return topics.map((topic) => ({
    id: topic.id,
    title: topic.title,
    url: `https://linux.do/t/${topic.slug}/${topic.id}`,
    postsCount: topic.posts_count,
    time: topic.bumped_at || topic.created_at,
  }));
}

function parseLinuxDoDetail(data) {
  return {
    id: data?.id,
    title: data?.title,
    posts: (data?.post_stream?.posts || []).map((post) => ({
      id: post.id,
      username: post.username,
      cooked: post.cooked,
      createdAt: post.created_at,
      postNumber: post.post_number,
    })),
  };
}

module.exports = {
  parseChiphellDetail,
  parseChiphellList,
  parseHupuDetail,
  parseHupuList,
  parseLinuxDoDetail,
  parseLinuxDoList,
  parseNgaDetail,
  parseNgaList,
  parseV2exDetail,
  parseV2exList,
};
