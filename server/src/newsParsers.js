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

function decodeHtmlEntities(text) {
  return String(text || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x2F;/g, "/")
    .replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)));
}

function extractXmlSection(xml, tag) {
  const startTag = `<${tag}>`;
  const endTag = `</${tag}>`;
  const start = xml.indexOf(startTag);
  if (start === -1) return null;
  const end = xml.indexOf(endTag, start);
  return xml.slice(start + startTag.length, end === -1 ? undefined : end);
}

function parseXmlItem(xml) {
  const item = {};
  const tags = [
    "tid",
    "fid",
    "authorid",
    "author",
    "subject",
    "postdate",
    "postdatestr",
    "lastpost",
    "replies",
    "floor",
    "lou",
    "pid",
    "content",
    "uid",
    "username",
    "avatar",
    "rvrc",
    "tpcurl",
    "lastposter",
  ];

  for (const tag of tags) {
    const startTag = `<${tag}>`;
    const endTag = `</${tag}>`;
    const start = xml.indexOf(startTag);
    if (start === -1) continue;

    let end = start + startTag.length;
    let depth = 1;
    while (end < xml.length && depth > 0) {
      const nextStart = xml.indexOf(startTag, end);
      const nextEnd = xml.indexOf(endTag, end);
      if (nextEnd === -1) break;
      if (nextStart !== -1 && nextStart < nextEnd) {
        depth += 1;
        end = nextStart + startTag.length;
      } else {
        depth -= 1;
        end = depth === 0 ? nextEnd : nextEnd + endTag.length;
      }
    }

    if (end <= start + startTag.length) continue;
    let value = xml.slice(start + startTag.length, end);
    const cdataStart = value.indexOf("<![CDATA[");
    const cdataEnd = value.indexOf("]]>", cdataStart);
    if (cdataStart !== -1 && cdataEnd !== -1) {
      value = value.slice(cdataStart + 9, cdataEnd);
    }
    item[tag] = decodeHtmlEntities(value);
  }

  return item;
}

function parseXmlItems(xml) {
  const items = [];
  let position = 0;
  while (position < xml.length) {
    const start = xml.indexOf("<item>", position);
    if (start === -1) break;

    let end = start + 6;
    let depth = 1;
    while (end < xml.length && depth > 0) {
      const nextStart = xml.indexOf("<item>", end);
      const nextEnd = xml.indexOf("</item>", end);
      if (nextEnd === -1) break;
      if (nextStart !== -1 && nextStart < nextEnd) {
        depth += 1;
        end = nextStart + 6;
      } else {
        depth -= 1;
        end = depth === 0 ? nextEnd : nextEnd + 7;
      }
    }

    if (depth === 0 && end > start + 6) {
      const item = parseXmlItem(xml.slice(start + 6, end));
      if (Object.keys(item).length) items.push(item);
    }
    position = end + 7;
  }
  return items;
}

function parseNgaXml(xml) {
  const root = {};
  const topicSection = extractXmlSection(xml, "__T");
  if (topicSection) {
    const trimmed = topicSection.trim();
    root.__T = {
      item: trimmed.startsWith("<item>") ? parseXmlItems(topicSection) : [parseXmlItem(topicSection)],
    };
  }

  const replySection = extractXmlSection(xml, "__R");
  if (replySection) root.__R = { item: parseXmlItems(replySection) };

  const userSection = extractXmlSection(xml, "__U");
  if (userSection) root.__U = { item: parseXmlItems(userSection) };

  const rowsMatch = xml.match(/<__ROWS>(\d+)<\/__ROWS>/);
  if (rowsMatch) root.__ROWS = Number(rowsMatch[1]);
  const rowsPageMatch = xml.match(/<__R__ROWS_PAGE>(\d+)<\/__R__ROWS_PAGE>/);
  if (rowsPageMatch) root.__R__ROWS_PAGE = Number(rowsPageMatch[1]);
  const pageMatch = xml.match(/<__PAGE>(\d+)<\/__PAGE>/);
  if (pageMatch) root.__PAGE = Number(pageMatch[1]);

  return { root };
}

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function processNgaContent(content) {
  return String(content || "")
    .replace(/\[img\]\.\/(.+?)\[\/img\]/gi, '<img src="https://img.nga.178.com/attachments/$1" referrerpolicy="no-referrer" />')
    .replace(/\[img\]\.u\/(.+?)\[\/img\]/gi, '<img src="https://img.nga.178.com/attachments/u/$1" referrerpolicy="no-referrer" />')
    .replace(/\[img\](https?:\/\/.+?)\[\/img\]/gi, '<img src="$1" referrerpolicy="no-referrer" />')
    .replace(/\[img\]\/\/(.+?)\[\/img\]/gi, '<img src="https://$1" referrerpolicy="no-referrer" />')
    .replace(/\[url=(.*?)\](.*?)\[\/url\]/gi, '<a href="$1">$2</a>')
    .replace(/\[url\](.*?)\[\/url\]/gi, '<a href="$1">$1</a>')
    .replace(/\[uid=(\d+)\](.*?)\[\/uid\]/gi, '<a href="https://bbs.nga.cn/nuke.php?func=ucp&uid=$1">$2</a>')
    .replace(/\[quote\]/gi, '<div class="comment_c">')
    .replace(/\[\/quote\]/gi, "</div>")
    .replace(/\[b\](.*?)\[\/b\]/gi, "<strong>$1</strong>")
    .replace(/\[color=(.*?)\](.*?)\[\/color\]/gi, '<span style="color:$1">$2</span>')
    .replace(/\[size=(.*?)\](.*?)\[\/size\]/gi, '<span style="font-size:$1px">$2</span>')
    .replace(/\[s:[^\]]+\]/gi, "")
    .replace(/\[pid=.*?\].*?\[\/pid\]/gi, "")
    .replace(/\[tid=.*?\].*?\[\/tid\]/gi, "")
    .replace(/\[align=(.*?)\](.*?)\[\/align\]/gi, '<div style="text-align:$1">$2</div>')
    .replace(/\n/g, "<br />");
}

function parseNgaXmlList(xml) {
  const data = parseNgaXml(xml);
  const topics = asArray(data.root.__T?.item);
  return uniqueItems(
    topics.map((topic) => {
      const tid = String(topic.tid || "");
      const subject = normalizeSpace(topic.subject);
      const replies = String(topic.replies || "0");
      return {
        id: tid || undefined,
        title: subject ? `[${replies}] ${subject}` : "",
        url: topic.tpcurl || (tid ? `/read.php?tid=${tid}` : ""),
        time: topic.postdatestr || topic.postdate || topic.lastpost,
        author: topic.author,
        category: topic.fid,
      };
    }),
  );
}

function parseNgaXmlDetail(xml) {
  const data = parseNgaXml(xml);
  const users = new Map();
  for (const user of asArray(data.root.__U?.item)) {
    if (user.uid) users.set(String(user.uid), user);
  }

  const topic = asArray(data.root.__T?.item)[0] || {};
  const replies = asArray(data.root.__R?.item);
  const totalRows = Number(data.root.__ROWS || data.root.__R__ROWS || replies.length);
  const rowsPerPage = Number(data.root.__R__ROWS_PAGE || 20);

  const html = replies
    .map((reply) => {
      const uid = String(reply.authorid || "0");
      const user = uid.startsWith("-") ? null : users.get(uid);
      const author = normalizeSpace(user?.username || reply.author || "匿名");
      const floor = Number(reply.lou || reply.floor || 0) + 1;
      return `
        <article class="reply-item" id="post_${reply.pid || ""}">
          <div class="reply-header">
            <span class="post-floor">#${floor}</span>
            <span class="post-author">${author}</span>
            <span class="post-time">${reply.postdate || ""}</span>
          </div>
          <div class="post-content">${processNgaContent(reply.content)}</div>
        </article>
      `;
    })
    .join("");

  return {
    html,
    totalPages: Math.max(1, Math.ceil(totalRows / rowsPerPage)),
    currentPage: Number(data.root.__PAGE || 1),
    authorUid: Number(topic.authorid || 0),
  };
}

function parseNgaList(content) {
  if (content.includes("<__T>")) return parseNgaXmlList(content);

  const $ = load(content);
  const items = [];
  $("#topicrows .topic").each((_, element) => {
    items.push({
      title: normalizeSpace($(element).text()),
      url: $(element).attr("href") || "",
    });
  });
  return uniqueItems(items);
}

function parseNgaDetail(content) {
  if (content.includes("<__R>") || content.includes("<__T>")) return parseNgaXmlDetail(content);

  const cleaned = content
    .replace(/\[img\].\//g, "[img]")
    .replace(/\[img\](.*?)\[\/img\]/g, '<img src="https://img.nga.178.com/attachments/$1" />')
    .replace(/\[pid=(.*?)\](.*?)\[\/b\]/g, "")
    .replace(/\[s:(.*?)\]/g, "")
    .replace(/\[quote\]/g, '<div class="comment_c">')
    .replace(/\[\/quote\]/g, "</div>")
    .replace(/\[tid(.*?)\](.*?)\[\/tid\]/g, "")
    .replace(/\[b\](.*?)\[\/b\]/g, "");
  const $ = load(cleaned);
  const pageMatch = content.match(/__PAGE\s*=\s*\{.*?\b1\s*:\s*(\d+)/);
  const currentMatch = content.match(/__PAGE\s*=\s*\{.*?\b2\s*:\s*(\d+)/);
  const authorMatch = content.match(/commonui\.postArg\.setDefault\([^,]+,[^,]+,[^,]+,(-?\d+)/);
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
