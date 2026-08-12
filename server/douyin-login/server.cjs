'use strict';

const http = require('node:http');
const crypto = require('node:crypto');
const { chromium } = require('playwright');

const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.PORT || 8787);
const SESSION_TTL_MS = Number(process.env.SESSION_TTL_MS || 5 * 60 * 1000);
const MAX_SESSIONS = Number(process.env.MAX_SESSIONS || 3);
const STANDBY_REFRESH_AGE_MS = Number(process.env.STANDBY_REFRESH_AGE_MS || 30_000);
const STANDBY_MAX_AGE_MS = Number(process.env.STANDBY_MAX_AGE_MS || 90_000);
const HEADLESS = process.env.HEADLESS !== 'false';
const ALLOW_LOCAL_TEST = process.env.ALLOW_LOCAL_TEST === 'true';
const DOUYIN_URL = process.env.DOUYIN_URL || 'https://www.douyin.com/user/self';
const PROFILE_URL = process.env.PROFILE_URL || 'https://www.douyin.com/aweme/v1/web/user/profile/self/?device_platform=webapp&aid=6383&channel=channel_pc_web&pc_client_type=1&cookie_enabled=true&browser_language=zh-CN&browser_platform=Win32';
const USER_AGENT = process.env.USER_AGENT ||
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36';
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

function readJsonBody(req, limit = 4096) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error('请求内容过大'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); }
      catch { reject(new Error('请求格式无效')); }
    });
    req.on('error', reject);
  });
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
    qrVersion: session.qrVersion,
    verificationMethod: session.verificationMethod,
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
  const loginHostname = new URL(DOUYIN_URL).hostname;
  return cookies
    .filter((cookie) => cookie.domain === '.douyin.com' || cookie.domain.endsWith('.douyin.com') ||
      cookie.domain === 'douyin.com' || ALLOW_LOCAL_TEST && cookie.domain === loginHostname)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join('; ');
}

function safeLoginResponse(url) {
  return url.includes('check_qrconnect') || url.includes('passport') && url.includes('login');
}

function findNestedValue(value, keys, depth = 0) {
  if (!value || depth > 5) return undefined;
  if (typeof value === 'string') {
    const candidate = value.trim();
    if (candidate.length > 1 && candidate.length < 100_000 && (candidate[0] === '{' || candidate[0] === '[')) {
      try { return findNestedValue(JSON.parse(candidate), keys, depth + 1); } catch { return undefined; }
    }
    return undefined;
  }
  if (typeof value !== 'object') return undefined;
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(value, key) && value[key] != null) return value[key];
  }
  for (const child of Object.values(value)) {
    const found = findNestedValue(child, keys, depth + 1);
    if (found != null) return found;
  }
  return undefined;
}

function decodeDataImage(dataUrl) {
  if (typeof dataUrl !== 'string') return null;
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$/);
  if (!match) return null;
  try {
    const image = Buffer.from(match[2].replace(/\s/g, ''), 'base64');
    if (!image.length) return null;
    return { image, mimeType: match[1].toLowerCase() };
  } catch {
    return null;
  }
}

async function imageDataFromLocator(locator) {
  if (!await locator.count() || !await locator.isVisible().catch(() => false)) return null;
  const dataUrl = await locator.evaluate((element) =>
    element.getAttribute('src') || element.getAttribute('href') || element.getAttribute('xlink:href') || ''
  ).catch(() => '');
  return decodeDataImage(dataUrl);
}

async function followLoginRedirect(session, redirectUrl) {
  if (session.redirectFollowed || typeof redirectUrl !== 'string') return;
  let target;
  try { target = new URL(redirectUrl); } catch { return; }
  const isDouyinHost = target.hostname === 'douyin.com' || target.hostname.endsWith('.douyin.com');
  if (target.protocol !== 'https:' || !isDouyinHost) return;
  session.redirectFollowed = true;
  session.state = 'verifying';
  session.message = '扫码已确认，正在完成登录跳转';
  try {
    const response = await session.context.request.get(target.toString(), {
      headers: { Referer: 'https://www.douyin.com/', 'User-Agent': USER_AGENT },
      maxRedirects: 20,
      timeout: 20_000,
    });
    console.log(
      `[douyin-login] session=${session.id.slice(0, 8)} redirect ` +
      `status=${response.status()} host=${target.hostname}`
    );
  } catch (error) {
    session.redirectFollowed = false;
    console.log(`[douyin-login] session=${session.id.slice(0, 8)} redirect failed=${error.name}`);
  }
}

async function findQr(page) {
  const selectors = [
    '#douyin_login_comp_scan_code img[src^="data:image"]',
    '#douyin_login_comp_scan_code image[href^="data:image"]',
    '#animate_qrcode_container img',
    'div[class*="animate_qrcode_container"] img[src^="data:image"]',
    'div[class*="scan_qrcode_login_content"] img[src^="data:image"]',
    'img[src^="data:image/png;base64"]',
    '#login-pannel img[src^="data:image"]',
    '#login-panel-new img[src^="data:image"]',
    'img[src*="qrcode"]',
  ];
  for (const selector of selectors) {
    const matches = page.locator(selector);
    const count = await matches.count();
    for (let index = 0; index < count; index += 1) {
      const locator = matches.nth(index);
      if (!await locator.isVisible().catch(() => false)) continue;
      const box = await locator.boundingBox().catch(() => null);
      if (!box || box.width < 140 || box.height < 140 || box.width > 300 || box.height > 300) continue;
      const ratio = box.width / box.height;
      if (ratio >= 0.85 && ratio <= 1.15) return locator;
    }
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
      const decoded = await imageDataFromLocator(qr);
      session.qr = decoded ? null : qr;
      session.qrImage = decoded?.image || await qr.screenshot({ type: 'png' });
      session.qrMimeType = decoded?.mimeType || 'image/png';
      session.qrVersion = 1;
      session.state = 'waiting';
      session.message = '请使用抖音 App 扫码并在手机上确认';
      return;
    }
    await session.page.waitForTimeout(500);
  }
  throw new Error('未能从抖音登录页提取二维码');
}

async function captureFaceQr(page) {
  const container = page.locator('#uc_verification_animate_qrcode_container').first();
  if (!await container.count() || !await container.isVisible().catch(() => false)) return null;
  const candidates = container.locator(
    'img[src^="data:image"], image[href^="data:image"], image[xlink\\:href^="data:image"]'
  );
  const count = await candidates.count();
  for (let index = 0; index < count; index += 1) {
    const decoded = await imageDataFromLocator(candidates.nth(index));
    if (decoded) return decoded;
  }
  const canvas = container.locator('canvas').first();
  if (await canvas.count() && await canvas.isVisible().catch(() => false)) {
    return { image: await canvas.screenshot({ type: 'png' }), mimeType: 'image/png' };
  }
  return null;
}

async function startFaceVerification(session) {
  if (session.identityVerificationStarted || !session.page || session.closed) return false;
  const faceButton = session.page.getByText('手机刷脸验证', { exact: true }).first();
  if (!await faceButton.count() || !await faceButton.isVisible().catch(() => false)) return false;
  session.state = 'verification_required';
  session.message = '检测到身份验证，正在生成刷脸验证二维码';
  console.log(`[douyin-login] session=${session.id.slice(0, 8)} identityVerification=face`);
  try {
    await faceButton.click({ timeout: 5_000 });
    session.identityVerificationStarted = true;
    session.verificationMethod = 'face';
    const deadline = Date.now() + 15_000;
    while (Date.now() < deadline && !session.closed) {
      const qr = await captureFaceQr(session.page);
      if (qr) {
        session.qr = null;
        session.qrImage = qr.image;
        session.qrMimeType = qr.mimeType;
        session.qrVersion += 1;
        session.state = 'face_verification';
        session.message = '请使用抖音 App 扫描新二维码并按提示完成刷脸验证';
        return true;
      }
      await session.page.waitForTimeout(500);
    }
    session.state = 'failed';
    session.message = '已进入刷脸验证，但未能提取验证二维码，请重新生成';
  } catch (error) {
    session.identityVerificationStarted = false;
    session.verificationMethod = '';
    console.log(`[douyin-login] session=${session.id.slice(0, 8)} faceVerification failed=${error.name}`);
  }
  return false;
}

async function startSmsVerification(session, phone) {
  if (!session.page || session.closed) throw new Error('登录会话已结束');
  if (!/^1\d{10}$/.test(phone)) throw new Error('请输入正确的 11 位手机号');
  session.identityVerificationStarted = true;
  session.verificationMethod = 'sms';
  session.state = 'sms_preparing';
  session.message = '正在发送短信验证码';
  const phoneInput = session.page.getByPlaceholder('请输入手机号', { exact: true }).first();
  if (!await phoneInput.count() || !await phoneInput.isVisible().catch(() => false)) {
    throw new Error('当前页面没有手机号登录入口');
  }
  await phoneInput.fill(phone);
  const sendButton = session.page.getByText(/获取验证码|发送验证码|重新发送/, { exact: true }).first();
  if (!await sendButton.count() || !await sendButton.isVisible().catch(() => false)) {
    throw new Error('当前页面没有发送验证码按钮');
  }
  await sendButton.click({ timeout: 5_000 });
  session.state = 'sms_verification';
  session.message = '短信验证码已发送，请输入验证码';
  console.log(`[douyin-login] session=${session.id.slice(0, 8)} identityVerification=sms`);
}

async function submitSmsCode(session, code) {
  if (!/^\d{4,8}$/.test(code)) throw new Error('请输入 4 至 8 位数字验证码');
  const input = session.page.locator(
    'input[placeholder*="验证码"]:visible, input[type="tel"]:visible, input[placeholder*="短信"]:visible'
  ).first();
  if (!await input.count() || !await input.isVisible().catch(() => false)) {
    throw new Error('未找到验证码输入框');
  }
  await input.fill(code);
  const submitTexts = ['确认', '确定', '验证', '登录', '提交'];
  for (const label of submitTexts) {
    const button = session.page.getByText(label, { exact: true }).first();
    if (await button.count() && await button.isVisible().catch(() => false)) {
      await button.click({ timeout: 5_000 });
      session.state = 'verifying';
      session.message = '验证码已提交，正在验证登录态';
      return;
    }
  }
  await input.press('Enter');
  session.state = 'verifying';
  session.message = '验证码已提交，正在验证登录态';
}

async function detectLogin(session) {
  if (!session.context || session.closed || session.cookie) return;
  const secondVerify = session.page.locator('#uc-second-verify').first();
  if (await secondVerify.count() && await secondVerify.isVisible().catch(() => false)) {
    if (!session.identityVerificationStarted) await startFaceVerification(session);
    return;
  }
  const cookies = await session.context.cookies();
  const serialized = cookieHeader(cookies);
  if (!serialized) return;
  const cookieFingerprint = crypto.createHash('sha256').update(serialized).digest('hex');
  const loginStatus = cookies.find((cookie) => cookie.name === 'LOGIN_STATUS')?.value;
  let hasUserLogin = false;
  try {
    hasUserLogin = await session.page.evaluate(() => localStorage.getItem('HasUserLogin') === '1');
  } catch {}

  const cookieChanged = cookieFingerprint !== session.lastCookieFingerprint;
  const loginConfirmed = session.identityVerificationStarted || session.redirectFollowed ||
    session.lastLoginResponseStatus.startsWith('confirmed:') ||
    session.lastLoginResponseStatus.startsWith('3:');
  if (!cookieChanged && loginStatus !== '1' && !hasUserLogin && !loginConfirmed) return;
  if (!cookieChanged && Date.now() - session.lastProfileCheckAt < 2_000) return;
  session.lastCookieFingerprint = cookieFingerprint;
  session.lastProfileCheckAt = Date.now();
  if (cookieChanged) {
    console.log(
      `[douyin-login] session=${session.id.slice(0, 8)} cookieChanged fields=${cookies.length} ` +
      `loginStatus=${loginStatus === '1'} localStorage=${hasUserLogin}`
    );
  }
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
    session.message = session.verificationMethod === 'sms'
      ? '短信验证码已提交，正在等待登录跳转'
      : '扫码已确认，正在等待登录跳转';
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
      session.message = '登录验证暂时失败，请重新生成二维码';
      console.log(`[douyin-login] session=${session.id.slice(0, 8)} verify failed=${error.name}`);
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
  session.qrImage = null;
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
    lastProfileCheckAt: 0,
    redirectFollowed: false,
    identityVerificationStarted: false,
    verificationMethod: '',
    qrVersion: 0,
    qrExpired: false,
    issued: false,
    context: null,
    page: null,
    qr: null,
    qrImage: null,
    qrMimeType: 'image/png',
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
        const status = findNestedValue(payload, ['status', 'scan_status']) ?? payload?.error_code ?? 'unknown';
        const redirectUrl = findNestedValue(payload, ['redirect_url', 'redirectUrl']);
        const responseKey = `${String(status)}:${Boolean(redirectUrl)}`;
        if (status === 'confirmed' || status === '3' || redirectUrl) {
          void followLoginRedirect(session, redirectUrl);
        }
        if (responseKey === session.lastLoginResponseStatus) return;
        session.lastLoginResponseStatus = responseKey;
        console.log(
          `[douyin-login] session=${session.id.slice(0, 8)} loginResponse ` +
          `status=${status} http=${response.status()} path=${new URL(response.url()).pathname}`
        );
        // 扫码响应中的数字状态会随登录组件版本变化，不能据此提前显示“已扫描”。
        // 页面出现二次验证 DOM 或最终登录态后再推进公开状态。
        if (status === 'expired' && !session.identityVerificationStarted) {
          session.qrExpired = true;
          if (session.issued) {
            session.state = 'expired';
            session.message = '二维码已过期，请重新生成';
            void closeSession(session);
          } else if (standbySession === session) {
            standbySession = null;
            void closeSession(session).then(() => prepareStandbySession());
          }
        }
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
    session.message = '二维码生成失败，请稍后重试';
    await closeSession(session);
    throw error;
  }
}

async function prepareStandbySession(force = false) {
  if (standbySession && !force) return;
  if (standbyPreparation) return standbyPreparation;
  const previousStandby = standbySession;
  standbyPreparation = buildSession()
    .then((session) => {
      if (previousStandby && standbySession === previousStandby) {
        void closeSession(previousStandby);
      }
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

  let standbyAge = standbySession ? Date.now() - Date.parse(standbySession.createdAt) : Number.POSITIVE_INFINITY;
  if ((!standbySession || standbyAge > STANDBY_MAX_AGE_MS) && standbyPreparation) {
    await standbyPreparation;
  }
  standbyAge = standbySession ? Date.now() - Date.parse(standbySession.createdAt) : Number.POSITIVE_INFINITY;
  if (!standbySession || standbyAge > STANDBY_MAX_AGE_MS) await prepareStandbySession(true);
  let session = standbySession;
  standbySession = null;
  standbyAge = session ? Date.now() - Date.parse(session.createdAt) : Number.POSITIVE_INFINITY;
  if (!session || session.closed || session.qrExpired || standbyAge > STANDBY_MAX_AGE_MS) {
    if (session) await closeSession(session);
    session = await buildSession();
  }
  session.issued = true;
  session.expiresAt = Date.now() + SESSION_TTL_MS;
  sessions.set(session.id, session);
  void watchSession(session);
  void prepareStandbySession();
  return session;
}

function parseSessionPath(pathname) {
  const match = pathname.match(/^\/api\/sessions\/([A-Za-z0-9_-]+)(?:\/(qr|claim|screenshot|sms|sms-code))?$/);
  if (!match) return null;
  return { id: match[1], action: match[2] || 'status' };
}

const appHtml = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>TouchFish 抖音扫码登录验证</title><style>
body{margin:0;background:#101114;color:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;display:grid;place-items:center;min-height:100vh}.card{width:min(520px,calc(100vw - 40px));padding:32px;border:1px solid #303238;border-radius:22px;background:#18191d;text-align:center;box-sizing:border-box}h1{font-size:25px;margin:0 0 10px}p{color:#aeb0b8;line-height:1.6}.qr{width:260px;height:260px;object-fit:contain;background:#fff;border-radius:16px;padding:12px;box-sizing:border-box;margin:18px auto;display:none}button{border:0;border-radius:12px;background:#fe2c55;color:#fff;font-weight:700;font-size:16px;padding:12px 22px;cursor:pointer}button:disabled{opacity:.45}.divider{display:none;color:#777b85;margin:18px 0 12px}.sms{display:none;margin-top:10px;gap:8px;justify-content:center;flex-wrap:wrap}.sms input{width:170px;border:1px solid #454852;border-radius:10px;background:#101114;color:#fff;padding:12px;font-size:16px;box-sizing:border-box}.sms button{font-size:14px;padding:11px 14px}.ok{color:#56d68b}.error{color:#ff718d}.meta{font-size:13px;color:#777b85;word-break:break-all}</style></head>
<body><main class="card"><h1>抖音登录验证</h1><p id="status">可使用抖音 App 扫码，或直接使用手机号验证码登录。</p><img id="qr" class="qr" alt="抖音登录二维码"><div><button id="start">开始登录</button></div><div id="divider" class="divider">或者使用手机号验证码</div><div id="phoneForm" class="sms"><input id="phone" inputmode="tel" maxlength="11" autocomplete="tel" placeholder="手机号"><button id="smsSend">获取验证码</button></div><div id="smsForm" class="sms"><input id="smsCode" inputmode="numeric" maxlength="8" autocomplete="one-time-code" placeholder="短信验证码"><button id="smsSubmit">登录</button></div><p id="meta" class="meta"></p></main>
<script>
let id='',token='',timer=0,qrUrl='',qrVersion=0;const statusEl=document.querySelector('#status'),qr=document.querySelector('#qr'),button=document.querySelector('#start'),meta=document.querySelector('#meta'),divider=document.querySelector('#divider'),phoneForm=document.querySelector('#phoneForm'),phone=document.querySelector('#phone'),smsSend=document.querySelector('#smsSend'),smsForm=document.querySelector('#smsForm'),smsCode=document.querySelector('#smsCode'),smsSubmit=document.querySelector('#smsSubmit');
async function api(url,options={}){options.headers={...(options.headers||{}),...(token?{'X-Claim-Token':token}:{})};const response=await fetch(url,options);const data=await response.json();if(!response.ok)throw new Error(data.error||'请求失败');return data}
async function loadQr(version){const response=await fetch('/api/sessions/'+id+'/qr',{headers:{'X-Claim-Token':token}});if(!response.ok)throw new Error((await response.json()).error);if(qrUrl)URL.revokeObjectURL(qrUrl);qrUrl=URL.createObjectURL(await response.blob());qr.src=qrUrl;qr.style.display='block';qrVersion=version||qrVersion+1}
function resetVerificationUi(){divider.style.display='none';phoneForm.style.display='none';smsForm.style.display='none';phone.value='';smsCode.value=''}
function stopWaiting(message){clearInterval(timer);timer=0;if(qrUrl){URL.revokeObjectURL(qrUrl);qrUrl=''}qr.removeAttribute('src');qr.style.display='none';resetVerificationUi();button.disabled=false;button.textContent='重新生成';statusEl.textContent=message;statusEl.className='error';id='';token=''}
async function poll(){try{const s=await api('/api/sessions/'+id);if(s.qrVersion&&s.qrVersion!==qrVersion)await loadQr(s.qrVersion);statusEl.textContent=s.message;statusEl.className=s.state==='verified'?'ok':(s.state==='failed'||s.state==='expired'?'error':'');smsForm.style.display=s.verificationMethod==='sms'?'flex':'none';meta.textContent=s.cookieReady?'Cookie 已验证：'+s.cookieFieldCount+' 个字段，'+s.cookieLength+' 个字符'+(s.user?.nickname?'，账号：'+s.user.nickname:''):'';if(s.state==='verified'){clearInterval(timer);timer=0;button.disabled=false;button.textContent='重新登录';qr.style.display='none';resetVerificationUi()}else if(s.state==='failed'||s.state==='expired'){stopWaiting(s.message)}}catch(e){stopWaiting(e.message+'，请重新生成二维码')}}
smsSend.onclick=async()=>{smsSend.disabled=true;try{const s=await api('/api/sessions/'+id+'/sms',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone:phone.value.trim()})});statusEl.textContent=s.message;smsForm.style.display='flex';smsCode.focus()}catch(e){statusEl.textContent=e.message;statusEl.className='error'}finally{smsSend.disabled=false}};
smsSubmit.onclick=async()=>{const code=smsCode.value.trim();smsSubmit.disabled=true;try{const s=await api('/api/sessions/'+id+'/sms-code',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code})});statusEl.textContent=s.message;smsForm.style.display='none'}catch(e){statusEl.textContent=e.message;statusEl.className='error'}finally{smsSubmit.disabled=false}};
button.onclick=async()=>{clearInterval(timer);if(qrUrl)URL.revokeObjectURL(qrUrl);qrUrl='';qrVersion=0;resetVerificationUi();button.disabled=true;statusEl.className='';statusEl.textContent='正在启动浏览器并获取登录二维码…';meta.textContent='';qr.removeAttribute('src');qr.style.display='none';try{const s=await api('/api/sessions',{method:'POST'});id=s.id;token=s.claimToken;await loadQr(s.qrVersion);statusEl.textContent=s.message;button.textContent='等待登录';divider.style.display='block';phoneForm.style.display='flex';timer=setInterval(poll,1200)}catch(e){stopWaiting(e.message)}};
</script></body></html>`;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (req.method === 'GET' && url.pathname === '/') return text(res, 200, appHtml, 'text/html; charset=utf-8');
  if (req.method === 'GET' && url.pathname === '/healthz') return json(res, 200, { ok: true });
  if (req.method === 'POST' && url.pathname === '/api/sessions') {
    try {
      const session = await createSession();
      return json(res, 201, { ...publicState(session), claimToken: session.claimToken });
    } catch {
      return json(res, 503, { error: '二维码服务暂时不可用，请稍后重试' });
    }
  }

  const parsed = parseSessionPath(url.pathname);
  if (!parsed) return json(res, 404, { error: '接口不存在' });
  const session = sessions.get(parsed.id);
  if (!session) return json(res, 404, { error: '会话不存在或已销毁' });
  if (!authorized(req, session)) return json(res, 401, { error: '会话密钥无效' });

  if (req.method === 'GET' && parsed.action === 'status') return json(res, 200, publicState(session));
  if (req.method === 'GET' && parsed.action === 'qr') {
    if ((!session.qrImage && !session.qr) || session.closed) return json(res, 409, { error: session.message });
    try {
      const image = session.qrImage || await session.qr.screenshot({ type: 'png' });
      res.writeHead(200, {
        'Content-Type': session.qrMimeType || 'image/png',
        'Content-Length': image.length,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      });
      return res.end(image);
    } catch {
      return json(res, 500, { error: '读取二维码失败，请重新生成' });
    }
  }
  if (req.method === 'GET' && parsed.action === 'screenshot') {
    if (!session.page || session.closed) return json(res, 409, { error: session.message });
    try {
      const image = await session.page.screenshot({ type: 'png', fullPage: false });
      res.writeHead(200, {
        'Content-Type': 'image/png',
        'Content-Length': image.length,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      });
      return res.end(image);
    } catch {
      return json(res, 500, { error: '读取登录页面截图失败' });
    }
  }
  if (req.method === 'POST' && parsed.action === 'sms') {
    try {
      const body = await readJsonBody(req);
      await startSmsVerification(session, String(body.phone || ''));
      return json(res, 200, publicState(session));
    } catch (error) {
      const safeMessage = [
        '请输入正确的 11 位手机号', '当前页面没有手机号登录入口',
        '当前页面没有发送验证码按钮', '登录会话已结束',
      ].includes(error.message)
        ? error.message
        : '切换短信验证失败，请重试';
      return json(res, 409, { error: safeMessage });
    }
  }
  if (req.method === 'POST' && parsed.action === 'sms-code') {
    try {
      const body = await readJsonBody(req);
      await submitSmsCode(session, String(body.code || ''));
      return json(res, 200, publicState(session));
    } catch (error) {
      const safeErrors = new Set([
        '请求内容过大', '请求格式无效', '请输入 4 至 8 位数字验证码',
        '未找到验证码输入框', '当前页面没有短信验证入口', '登录会话已结束',
      ]);
      return json(res, 400, { error: safeErrors.has(error.message) ? error.message : '验证码提交失败，请重试' });
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
  if (standbySession && (
    standbySession.qrExpired
  )) {
    void closeSession(standbySession);
    standbySession = null;
  }
  if (standbySession && Date.now() - Date.parse(standbySession.createdAt) > STANDBY_REFRESH_AGE_MS) {
    void prepareStandbySession(true);
  } else {
    void prepareStandbySession();
  }
}, 5_000);
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
  console.log(
    `[douyin-login] standbyRefreshAge=${STANDBY_REFRESH_AGE_MS}ms, ` +
    `standbyMaxAge=${STANDBY_MAX_AGE_MS}ms`
  );
  void prepareStandbySession();
});
