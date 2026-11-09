// Run against the WeRead Vite dev server: node --test tools/weread/reader.test.mjs
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

let browser;
before(async () => { browser = await chromium.launch({ channel: process.env.WEREAD_BROWSER || 'chrome', headless: true }); });
after(async () => { await browser?.close(); });
const url = process.env.WEREAD_TEST_URL || 'http://127.0.0.1:5183';

test('HTML source coordinates, entities, UTF-16, repeated text, overlapping marks and TXT CRLF', async () => {
  const page = await browser.newPage();
  try {
    await page.goto(url);
    const result = await page.evaluate(async () => {
      const { prepareChapter, decorateChapter, selectionFromRange } = await import('/src/reader/chapter.ts');
      const root = document.createElement('div'); document.body.append(root);
      const identity = { bookId: 'book', chapterUid: 2 };
      const html = '<html><head><title>Title</title></head><body><p>A&amp;B😀<em>C</em></p><p>重复文字，重复文字</p><p>脚<img class="qqreader-footnote" alt="注释"/>后</p></body></html>';
      root.innerHTML = prepareChapter(html, 'epub');
      const select = (start, a, end = start, b = start.textContent.length) => {
        const range = document.createRange(); range.setStart(start.firstChild, a); range.setEnd(end.firstChild, b);
        return selectionFromRange(root, range, identity);
      };
      const spans = () => [...root.querySelectorAll('[data-wr-source-start]')];
      const amp = spans().find(s => s.textContent === '&');
      const entity = select(amp, 0);
      const b = spans().find(s => s.textContent === 'B😀');
      const emoji = select(b, 1, b, 3);
      const repeated = spans().find(s => s.textContent === '重复文字，重复文字');
      const repeat = select(repeated, 5, repeated, 9);
      const c = spans().find(s => s.textContent === 'C');
      const cross = select(b, 0, c, 1);
      const foot = spans().find(s => s.textContent === '脚');
      const tail = spans().find(s => s.textContent === '后');
      const footnote = select(foot, 0, tail, 1);
      const start = html.indexOf('A&amp;');
      root.innerHTML = decorateChapter(prepareChapter(html, 'epub'), [
        { range: `${start}-${start + 9}` }, { range: `${start + 6}-${start + 9}`, personal: true, id: 'mine' },
      ]);
      const overlap = root.querySelectorAll('.hot-underline.personal-underline').length;
      root.innerHTML = prepareChapter('甲\r\n\r\n乙😀', 'txt');
      const range = document.createRange(); range.selectNodeContents(root);
      const txt = selectionFromRange(root, range, identity);
      root.innerHTML = '<span data-wr-source-start="1">甲</span>unmapped<span data-wr-source-start="20">乙</span>';
      range.selectNodeContents(root);
      const unmapped = selectionFromRange(root, range, identity);
      root.innerHTML = prepareChapter('<p>a\r\nb</p>', 'epub');
      const crlfSpan = spans().find(s => s.textContent.includes('b'));
      const crlf = select(crlfSpan, 3, crlfSpan, 4);
      root.remove();
      return { html, entity, emoji, repeat, cross, footnote, overlap, txt, unmapped, crlf };
    });
    const { html } = result;
    const at = (text, length = text.length) => `${html.indexOf(text)}-${html.indexOf(text) + length}`;
    assert.equal(result.entity.range, at('&amp;', 1));
    assert.equal(result.emoji.range, at('😀'));
    assert.equal(result.repeat.range, `${html.lastIndexOf('重复文字')}-${html.lastIndexOf('重复文字') + 4}`);
    assert.equal(result.cross.quote, 'B😀C');
    assert.equal(result.cross.range, `${html.indexOf('B😀')}-${html.indexOf('C</em>') + 1}`);
    assert.equal(result.footnote.quote, '脚后');
    assert.ok(result.overlap > 0);
    assert.equal(result.txt.quote, '甲\r\n\r\n乙😀');
    assert.equal(result.txt.range, '0-8');
    assert.equal(result.unmapped, null);
    assert.equal(result.crlf.range, '6-7');
  } finally { await page.close(); }
});

test('reader selects text, submits private thoughts and preserves uncertain drafts', async () => {
  const page = await browser.newPage({ viewport: { width: 700, height: 850 } });
  try {
    await page.addInitScript(() => {
      window.requests = []; window.ownNotes = []; window.uncertainWrite = false;
      window.acquireVsCodeApi = () => ({ getState: () => undefined, setState: s => s, postMessage: m => {
        window.requests.push(m);
        const frame = { uuid: m.uuid, bookId: m.payload?.bookId, chapterUid: m.payload?.chapterUid };
        const send = (command, payload) => setTimeout(() => { window.dispatchEvent(new MessageEvent('message', { data: { ...frame, command, payload } })); if (command === 'WEREAD_MY_NOTES_DATA') window.notesLoaded = true; }, 10);
        switch (m.command) {
          case 'WEREAD_GET_SHELF': send('WEREAD_SHELF_DATA', { books: [{ bookId: 'book', title: '阅读测试', cover: '' }] }); break;
          case 'WEREAD_GET_CATALOG': send('WEREAD_CATALOG_DATA', { data: [{ bookId: 'book', updated: [{ chapterUid: 2, chapterIdx: 1, title: '第一章' }, { chapterUid: 3, chapterIdx: 2, title: '第二章' }] }] }); break;
          case 'WEREAD_GET_PROGRESS': send('WEREAD_PROGRESS_DATA', { bookId: 'book', book: { chapterUid: 2 } }); break;
          case 'WEREAD_GET_CHAPTER': send('WEREAD_CHAPTER_DATA', { html: '<body><p>选中这段文字写想法。</p><p>第二段正文。</p></body>', format: 'epub', style: '', bookVersion: 1 }); break;
          case 'WEREAD_GET_UNDERLINES': send('WEREAD_UNDERLINES_DATA', { underlines: [{ range: '9-19' }] }); break;
          case 'WEREAD_GET_MY_NOTES': send('WEREAD_MY_NOTES_DATA', { notes: window.ownNotes }); break;
          case 'WEREAD_ADD_THOUGHT':
          case 'WEREAD_ADD_BOOKMARK': {
            if (window.uncertainWrite) { send('WEREAD_NOTE_RESULT', { status: 'uncertain' }); break; }
            const note = { ...m.payload, id: String(window.ownNotes.length + 1) }; window.ownNotes.push(note);
            send('WEREAD_NOTE_RESULT', { status: 'saved', note }); break;
          }
          case 'WEREAD_RECHECK_NOTE': send('WEREAD_NOTE_RESULT', { status: 'uncertain' }); break;
        }
      } });
    });
    await page.goto(url);
    await page.getByText('阅读测试', { exact: true }).click();
    await page.locator('.xhtml-content').waitFor();
    await page.waitForFunction(() => window.notesLoaded);
    const select = async () => {
      await page.locator('.xhtml-content p').first().evaluate(p => {
        const range = document.createRange(); range.selectNodeContents(p);
        const selected = window.getSelection(); selected.removeAllRanges(); selected.addRange(range);
      });
      await page.locator('.xhtml-content').dispatchEvent('mouseup');
      await page.getByRole('toolbar', { name: '选文操作' }).waitFor({ timeout: 5000 });
    };
    await select();
    await page.getByRole('button', { name: /划\s*线/, exact: true }).click();
    await page.locator('.personal-underline').first().waitFor();
    assert.equal(await page.evaluate(() => window.requests.filter(r => r.command === 'WEREAD_ADD_BOOKMARK').length), 1);
    await page.locator('.personal-underline').first().click();
    await page.getByRole('dialog', { name: '我的笔记' }).waitFor();
    await page.getByRole('button', { name: '查看这段的热门想法' }).waitFor();
    await page.getByRole('dialog', { name: '我的笔记' }).getByRole('button', { name: 'Close', exact: true }).click();
    await select();
    await page.getByRole('button', { name: '写想法', exact: true }).click();
    await page.getByRole('textbox', { name: '想法内容' }).fill('浏览器验证的想法');
    await page.getByRole('radio', { name: '仅自己可见' }).check();
    await page.getByRole('button', { name: '提交到微信读书' }).click();
    await page.locator('.personal-underline').first().waitFor();
    const write = await page.evaluate(() => window.requests.find(r => r.command === 'WEREAD_ADD_THOUGHT'));
    assert.equal(write.payload.isPrivate, true); assert.equal(write.payload.quote, '选中这段文字写想法。');
    await page.evaluate(() => { window.uncertainWrite = true; });
    await select(); await page.getByRole('button', { name: '写想法', exact: true }).click();
    await page.getByRole('textbox', { name: '想法内容' }).fill('结果未知时保留');
    await page.getByRole('button', { name: '提交到微信读书' }).click();
    await page.getByText('保存结果待确认，输入已保留', { exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: '提交到微信读书' }).isDisabled(), true);
    assert.equal(await page.getByRole('textbox', { name: '想法内容' }).inputValue(), '结果未知时保留');
    await page.getByRole('button', { name: '重新核对', exact: true }).click();
    assert.equal(await page.evaluate(() => window.requests.filter(r => r.command === 'WEREAD_ADD_THOUGHT').length), 2);
  } finally { await page.close(); }
});
