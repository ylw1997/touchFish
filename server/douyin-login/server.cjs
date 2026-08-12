'use strict';

const http = require('node:http');
const crypto = require('node:crypto');
const { chromium } = require('playwright');

const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.PORT || 8787);
const SESSION_TTL_MS = Number(process.env.SESSION_TTL_MS || 5 * 60 * 1000);
const MAX_SESSIONS = Number(process.env.MAX_SESSIONS || 3);
const HEADLESS = process.env.HEADLESS !== 'false';
const DOUYIN_URL = 'https://www.douyin.com/?recommend=1';
const PROFILE_URL = 'https://www.douyin.com/aweme/v1/web/user/profile/self/?device_platform=webapp&aid=6383&channel=channel_pc_web&pc_client_type=1&cookie_enabled=true&browser_language=zh-CN&browser_platform=Win32';
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const sessions = new Map();

let browserPromise;
let standbySession = null;
let standbyPreparation = null;

function browser() {
  if (!browserPromise) {
    browserPromise = chromium.launch({
      headless: HEADLESS,
      args: ['--disable-dev-shm-usage', '--no-sandbox'],
    }).catch((error) => {
      browserPromise = undefined;
      throw error;
    });
  }
  return browserPromise;
}

function randomToken(bytes = 24) {
  return crypto.randomBytes(bytes).toString('base64url');
}

function json(res, statusCode, value, extraHeaders = {}) {
  const body = Buffer.from(JSON.stringify(value));
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': body.length,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...extraHeaders,
  });
  res.end(body);
}

function text(res, statusCode, value, contentType = 'text/plain; charset=utf-8') {
  const body = Buffer.from(value);
  res.writeHead(statusCode, {
    'Content-Type': contentType,
    'Content-Length': body.length,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'self'; img-src 'self' blob:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'",
  });
  res.end(body);
}

function publicState(session) {
  return {
    id: session.id,
    state: session.state,
    message: session.message,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
    cookieReady: Boolean(session.cookie),
    cookieLength: session.cookie?.length || 0,
    cookieFieldCount: session.cookie ? session.cookie.split(';').length : 0,
    user: session.user || null,
  };
}

function authorized(req, session) {
  const token = req.headers['x-claim-token'];
  if (typeof token !== 'string') return false;
  const provided = Buffer.from(token);
  const expected = Buffer.from(session.claimToken);
  return provided.length === expected.length && crypto.timingSafeEqual(provided, expected);
}

function cookieHeader(cookies) {
  return cookies
    .filter((cookie) => cookie.domain === '.douyin.com' || cookie.domain.endsWith('.douyin.com') || cookie.domain === 'douyin.com')
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join('; ');
}

function safeLoginResponse(url) {
  return url.includes('check_qrconnect') || url.includes('passport') && url.includes('login');
}

async function findQr(page) {
  const selectors = [
    '#animate_qrcode_container img',
    '#login-pannel img[src^="data:image"]',
    '#login-panel-new img[src^="data:image"]',
    'img[src*="qrcode"]',
  ];
  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    if (await locator.count() && await locator.isVisible().catch(() => false)) return locator;
  }
  return null;
}

async function ensureLoginPanel(page) {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    if (await findQr(page)) return;
    const loginButtons = [
      page.getByText('登录', { exact: true }).first(),
      page.locator('p:has-text("登录")').first(),
      page.locator('[data-e2e="login-button"]').first(),
    ];
    for (const button of loginButtons) {
      if (await button.count() && await button.isVisible().catch(() => false)) {
        await button.click({ timeout: 3000 }).catch(() => {});
        return;
      }
    }
    await page.waitForTimeout(250);
  }
}

async function waitForQr(session) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline && session.state === 'initializing') {
    const qr = await findQr(session.page);
    if (qr) {
      session.qr = qr;
      session.state = 'waiting';
      session.message = '请使用抖音 App 扫码并在手机上确认';
      return;
    }
    await session.page.waitForTimeout(500);
  }
  throw new Error('未能从抖音登录页提取二维码');
}

async function detectLogin(session) {
  if (!session.context || session.closed || session.cookie) return;
  const cookies = await session.context.cookies();
  const serialized = cookieHeader(cookies);
  if (!serialized) return;
  const cookieFingerprint = crypto.createHash('sha256').update(serialized).digest('hex');
  const loginStatus = cookies.find((cookie) => cookie.name === 'LOGIN_STATUS')?.value;
  let hasUserLogin = false;
  try {
    hasUserLogin = await session.page.evaluate(() => localStorage.getItem('HasUserLogin') === '1');
  } catch {}

  if (cookieFingerprint === session.lastCookieFingerprint && loginStatus !== '1' && !hasUserLogin) return;
  session.lastCookieFingerprint = cookieFingerprint;
  console.log(
    `[douyin-login] session=${session.id.slice(0, 8)} cookieChanged fields=${cookies.length} ` +
    `loginStatus=${loginStatus === '1'} localStorage=${hasUserLogin}`
  );
  session.state = 'verifying';
  session.message = '检测到登录凭证变化，正在验证登录态';

  const response = await session.context.request.get(PROFILE_URL, {
    headers: {
      Accept: 'application/json, text/plain, */*',
      Referer: 'https://www.douyin.com/',
      Cookie: serialized,
      'User-Agent': USER_AGENT,
    },
    timeout: 20_000,
  });
  const body = await response.text();
  let payload;
  try { payload = JSON.parse(body); } catch {}
  const user = payload?.user || payload?.user_info;
  console.log(
    `[douyin-login] session=${session.id.slice(0, 8)} profile status=${response.status()} ` +
    `statusCode=${payload?.status_code ?? 'unknown'} user=${Boolean(user)}`
  );
  if (!response.ok() || payload?.status_code !== 0 || !user) {
    session.state = 'waiting';
    session.message = '扫码已确认，但登录态尚未生效，正在继续等待';
    return;
  }

  session.cookie = serialized;
  session.user = {
    nickname: user.nickname || '',
    secUid: user.sec_uid || user.secUid || '',
  };
  session.state = 'verified';
  session.message = '登录成功，已取得并验证 Cookie';
}

async function watchSession(session) {
  while (!session.closed && Date.now() < session.expiresAt && !session.cookie) {
    try {
      await detectLogin(session);
    } catch (error) {
      session.state = 'failed';
      session.message = `登录验证失败：${error.message}`;
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  if (!session.closed && !session.cookie && Date.now() >= session.expiresAt) {
    session.state = 'expired';
    session.message = '二维码会话已过期，请重新生成';
    await closeSession(session);
  }
}

async function closeSession(session) {
  if (session.closed) return;
  session.closed = true;
  await session.context?.close().catch(() => {});
  session.context = null;
  session.page = null;
  session.qr = null;
}

async function buildSession() {
  const now = Date.now();
  const session = {
    id: randomToken(18),
    claimToken: randomToken(32),
    state: 'initializing',
    message: '正在打开抖音登录页',
    createdAt: new Date(now).toISOString(),
    expiresAt: now + SESSION_TTL_MS,
    cookie: '',
    user: null,
    lastCookieFingerprint: '',
    lastLoginResponseStatus: '',
    context: null,
    page: null,
    qr: null,
    closed: false,
  };

  try {
    const instance = await browser();
    session.context = await instance.newContext({
      locale: 'zh-CN',
      timezoneId: 'Asia/Shanghai',
      userAgent: USER_AGENT,
      viewport: { width: 1440, height: 1000 },
    });
    await session.context.route('**/*', (route) => {
      const resourceType = route.request().resourceType();
      if (resourceType === 'media' || resourceType === 'font') return route.abort();
      return route.continue();
    });
    session.page = await session.context.newPage();
    session.page.on('response', async (response) => {
      if (!safeLoginResponse(response.url())) return;
      try {
        const payload = await response.json();
        const data = payload?.data || {};
        const status = data.status ?? payload?.status ?? payload?.error_code ?? 'unknown';
        if (status === session.lastLoginResponseStatus) return;
        session.lastLoginResponseStatus = status;
        console.log(
          `[douyin-login] session=${session.id.slice(0, 8)} loginResponse ` +
          `status=${status} http=${response.status()} path=${new URL(response.url()).pathname}`
        );
      } catch {
        console.log(
          `[douyin-login] session=${session.id.slice(0, 8)} loginResponse ` +
          `http=${response.status()} path=${new URL(response.url()).pathname}`
        );
      }
    });
    await session.page.goto(DOUYIN_URL, { waitUntil: 'commit', timeout: 45_000 });
    await ensureLoginPanel(session.page);
    await waitForQr(session);
    const initialCookies = cookieHeader(await session.context.cookies());
    session.lastCookieFingerprint = crypto.createHash('sha256').update(initialCookies).digest('hex');
    return session;
  } catch (error) {
    session.state = 'failed';
    session.message = `二维码生成失败：${error.message}`;
    await closeSession(session);
    throw error;
  }
}

async function prepareStandbySession() {
  if (standbySession) return;
  if (standbyPreparation) return standbyPreparation;
  standbyPreparation = buildSession()
    .then((session) => {
      standbySession = session;
      console.log(`[douyin-login] standby ready in ${Date.now() - Date.parse(session.createdAt)}ms`);
    })
    .catch((error) => {
      console.error(`[douyin-login] standby failed: ${error.message}`);
    })
    .finally(() => {
      standbyPreparation = null;
    });
  await standbyPreparation;
}

async function createSession() {
  const activeCount = [...sessions.values()].filter((item) => !item.closed && Date.now() < item.expiresAt).length;
  if (activeCount >= MAX_SESSIONS) throw new Error('当前扫码会话过多，请稍后重试');

  if (!standbySession) await prepareStandbySession();
  let session = standbySession;
  standbySession = null;
  if (!session || session.closed || session.expiresAt - Date.now() < 60_000) {
    if (session) await closeSession(session);
    session = await buildSession();
  }
  sessions.set(session.id, session);
  void watchSession(session);
  void prepareStandbySession();
  return session;
}

function parseSessionPath(pathname) {
  const match = pathname.match(/^\/api\/sessions\/([A-Za-z0-9_-]+)(?:\/(qr|claim))?$/);
  if (!match) return null;
  return { id: match[1], action: match[2] || 'status' };
}

const appHtml = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>TouchFish 抖音扫码登录验证</title><style>
body{margin:0;background:#101114;color:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;display:grid;place-items:center;min-height:100vh}.card{width:min(520px,calc(100vw - 40px));padding:32px;border:1px solid #303238;border-radius:22px;background:#18191d;text-align:center;box-sizing:border-box}h1{font-size:25px;margin:0 0 10px}p{color:#aeb0b8;line-height:1.6}.qr{width:280px;height:280px;object-fit:contain;background:#fff;border-radius:16px;padding:12px;box-sizing:border-box;margin:18px auto;display:none}button{border:0;border-radius:12px;background:#fe2c55;color:#fff;font-weight:700;font-size:17px;padding:13px 26px;cursor:pointer}button:disabled{opacity:.45}.ok{color:#56d68b}.error{color:#ff718d}.meta{font-size:13px;color:#777b85;word-break:break-all}</style></head>
<body><main class="card"><h1>抖音扫码登录验证</h1><p id="status">点击按钮生成一次性二维码。服务不会在页面或日志中显示完整 Cookie。</p><img id="qr" class="qr" alt="抖音登录二维码"><div><button id="start">生成二维码</button></div><p id="meta" class="meta"></p></main>
<script>
let id='',token='',timer=0,qrUrl='';const statusEl=document.querySelector('#status'),qr=document.querySelector('#qr'),button=document.querySelector('#start'),meta=document.querySelector('#meta');
async function api(url,options={}){options.headers={...(options.headers||{}),...(token?{'X-Claim-Token':token}:{})};const response=await fetch(url,options);const data=await response.json();if(!response.ok)throw new Error(data.error||'请求失败');return data}
function stopWaiting(message){clearInterval(timer);timer=0;if(qrUrl){URL.revokeObjectURL(qrUrl);qrUrl=''}qr.removeAttribute('src');qr.style.display='none';button.disabled=false;button.textContent='重新生成';statusEl.textContent=message;statusEl.className='error';id='';token=''}
async function poll(){try{const s=await api('/api/sessions/'+id);statusEl.textContent=s.message;statusEl.className=s.state==='verified'?'ok':(s.state==='failed'||s.state==='expired'?'error':'');meta.textContent=s.cookieReady?'Cookie 已验证：'+s.cookieFieldCount+' 个字段，'+s.cookieLength+' 个字符'+(s.user?.nickname?'，账号：'+s.user.nickname:''):'';if(s.state==='verified'){clearInterval(timer);timer=0;button.disabled=false;button.textContent='重新生成';qr.style.display='none'}else if(s.state==='failed'||s.state==='expired'){stopWaiting(s.message)}}catch(e){stopWaiting(e.message+'，请重新生成二维码')}}
button.onclick=async()=>{clearInterval(timer);if(qrUrl)URL.revokeObjectURL(qrUrl);qrUrl='';button.disabled=true;statusEl.className='';statusEl.textContent='正在启动浏览器并获取二维码…';meta.textContent='';qr.removeAttribute('src');qr.style.display='none';try{const s=await api('/api/sessions',{method:'POST'});id=s.id;token=s.claimToken;const response=await fetch('/api/sessions/'+id+'/qr',{headers:{'X-Claim-Token':token}});if(!response.ok)throw new Error((await response.json()).error);qrUrl=URL.createObjectURL(await response.blob());qr.src=qrUrl;qr.style.display='block';statusEl.textContent=s.message;button.textContent='等待扫码';timer=setInterval(poll,1200)}catch(e){stopWaiting(e.message)}};
</script></body></html>`;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (req.method === 'GET' && url.pathname === '/') return text(res, 200, appHtml, 'text/html; charset=utf-8');
  if (req.method === 'GET' && url.pathname === '/healthz') return json(res, 200, { ok: true });
  if (req.method === 'POST' && url.pathname === '/api/sessions') {
    try {
      const session = await createSession();
      return json(res, 201, { ...publicState(session), claimToken: session.claimToken });
    } catch (error) {
      return json(res, 503, { error: error.message });
    }
  }

  const parsed = parseSessionPath(url.pathname);
  if (!parsed) return json(res, 404, { error: '接口不存在' });
  const session = sessions.get(parsed.id);
  if (!session) return json(res, 404, { error: '会话不存在或已销毁' });
  if (!authorized(req, session)) return json(res, 401, { error: '会话密钥无效' });

  if (req.method === 'GET' && parsed.action === 'status') return json(res, 200, publicState(session));
  if (req.method === 'GET' && parsed.action === 'qr') {
    if (!session.qr || session.closed) return json(res, 409, { error: session.message });
    try {
      const image = await session.qr.screenshot({ type: 'png' });
      res.writeHead(200, {
        'Content-Type': 'image/png',
        'Content-Length': image.length,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      });
      return res.end(image);
    } catch (error) {
      return json(res, 500, { error: `读取二维码失败：${error.message}` });
    }
  }
  if (req.method === 'POST' && parsed.action === 'claim') {
    if (!session.cookie || session.state !== 'verified') return json(res, 409, { error: 'Cookie 尚未验证完成' });
    const cookie = session.cookie;
    session.cookie = '';
    session.state = 'claimed';
    session.message = 'Cookie 已领取，会话已销毁';
    await closeSession(session);
    sessions.delete(session.id);
    return json(res, 200, { cookie });
  }
  return json(res, 405, { error: '请求方法不支持' }, { Allow: parsed.action === 'claim' ? 'POST' : 'GET' });
});

const cleanupTimer = setInterval(() => {
  const cutoff = Date.now() - 60_000;
  for (const [id, session] of sessions) {
    if (session.expiresAt < cutoff || session.state === 'claimed') {
      void closeSession(session);
      sessions.delete(id);
    }
  }
  if (standbySession && standbySession.expiresAt - Date.now() < 60_000) {
    void closeSession(standbySession);
    standbySession = null;
  }
  void prepareStandbySession();
}, 30_000);
cleanupTimer.unref();

async function shutdown() {
  server.close();
  for (const session of sessions.values()) await closeSession(session);
  if (standbySession) await closeSession(standbySession);
  if (browserPromise) await (await browserPromise).close().catch(() => {});
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

server.listen(PORT, HOST, () => {
  console.log(`[douyin-login] listening on http://${HOST}:${PORT}`);
  console.log(`[douyin-login] headless=${HEADLESS}, sessionTTL=${SESSION_TTL_MS}ms, maxSessions=${MAX_SESSIONS}`);
  void prepareStandbySession();
});
