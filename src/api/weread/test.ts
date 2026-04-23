import { web_shelf_sync } from "./api/shelf";
import { web_book_chapterInfos, web_book_chapter_e } from "./api/book";
import { WeReadClient } from "./client";

async function main() {
  const cookie = process.env.WEREAD_COOKIE;
  if (!cookie) return;
  const auth = { cookie };
  const client = new WeReadClient(auth);

  try {
    const shelfData = await client.execute(web_shelf_sync, {});
    const books = shelfData.books || [];
    if (books.length === 0) return;

    const firstBook = books[0];
    const info = await client.execute(web_book_chapterInfos, [firstBook.bookId]);
    const chapters = info.data[0].updated || info.data[0].chapters || [];

    for (let i = 0; i < Math.min(2, chapters.length); i++) {
        const chapter = chapters[i];
        console.log(`\n================ [ 第 ${i+1} 章节: ${chapter.title} ] ================`);
        const { html, style } = await client.execute(web_book_chapter_e, firstBook.bookId, chapter.chapterUid);
        console.log("--- Style 内容 (前200字) ---");
        console.log(style.substring(0, 200) + "...");
        console.log("\n--- HTML 内容 (前1500字) ---");
        console.log(html.substring(0, 1500));
        console.log("================================================================\n");
    }
  } catch (error: any) {
    console.error(error.message);
  }
}

main();
