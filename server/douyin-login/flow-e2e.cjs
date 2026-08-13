'use strict';

const http = require('node:http');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { chromium } = require('playwright');

const MOCK_PORT = 29777;
const SERVICE_PORT = 29778;
const initialQr = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220" viewBox="0 0 22 22">
  <rect width="22" height="22" fill="white"/><path d="M1 1h6v6H1zm2 2v2h2V3zM15 1h6v6h-6zm2 2v2h2V3zM1 15h6v6H1zm2 2v2h2v-2zM9 2h2v2H9zm3 1h2v3h-2zM8 7h3v2H8zm4 1h2v3h-2zM15 9h5v2h-5zM9 11h2v3H9zm3 1h3v2h-3zM16 13h2v3h-2zM8 16h3v2H8zm4 1h3v3h-3zM17 18h4v2h-4z" fill="black"/>
</svg>`)} `;

const faceQr = `data:image/svg+xml;base64,${Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="228" height="228" viewBox="0 0 22 22">
  <rect width="22" height="22" fill="white"/><path d="M1 1h7v7H1zm2 2v3h3V3zM14 1h7v7h-7zm2 2v3h3V3zM1 14h7v7H1zm2 2v3h3v-3zM10 2h2v4h-2zm1 6h4v2h-4zm5 2h5v2h-5zm-6 2h2v4h-2zm3 1h3v3h-3zm4 3h2v5h-2zm-7 3h5v2h-5z" fill="black"/>
</svg>`).toString('base64')}`;

const pageHtml = `<!doctype html><meta charset="utf-8"><style>
body{margin:0;background:#eef3ff;color:#111;font-family:sans-serif}.modal{position:absolute;left:250px;top:120px;width:850px;height:500px;background:#fff;border-radius:20px;text-align:center;padding:24px;box-sizing:border-box}.columns{display:flex;justify-content:center;gap:70px}img{width:179px;height:179px}.item{padding:18px;margin:12px;border:1px solid #ddd}
</style><main id="app"><div class="modal"><h2>个人主页</h2><div class="columns"><section id="douyin_login_comp_scan_code"><h3>扫码登录</h3><img alt="二维码" src="${initialQr}"></section></div></div></main><script>
setTimeout(()=>{document.querySelector('#app').innerHTML='<div id="uc-second-verify"><h2>身份验证</h2><div class="item">接收短信验证码</div><div class="item" id="face">手机刷脸验证</div></div>';document.querySelector('#face').onclick=()=>{document.querySelector('#uc-second-verify').innerHTML='<h2>手机刷脸验证</h2><div id="uc_verification_animate_qrcode_container"><svg width="228" height="228"><image width="228" height="228" href="${faceQr}"></image></svg></div>';setTimeout(()=>{document.cookie='LOGIN_STATUS=1; path=/';localStorage.setItem('HasUserLogin','1');document.querySelector('#app').innerHTML='<h1>登录成功</h1>'},1200)}},1200)
</script>`;

const mock = http.createServer((req, res) => {
  if (req.url.startsWith('/profile')) {
    const loggedIn = (req.headers.cookie || '').includes('LOGIN_STATUS=1');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(loggedIn
      ? { status_code: 0, user: { nickname: '本地流程测试', sec_uid: 'local' } }
      : { status_code: 8 }));
  }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(pageHtml);
});

async function waitForHealth() {
  for (let index = 0; index < 80; index += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${SERVICE_PORT}/healthz`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error('本地登录服务启动超时');
}

(async () => {
  await new Promise((resolve) => mock.listen(MOCK_PORT, '127.0.0.1', resolve));
  const service = spawn(process.execPath, [path.join(__dirname, 'server.cjs')], {
    env: {
      ...process.env,
      HOST: '127.0.0.1',
      PORT: String(SERVICE_PORT),
      DOUYIN_URL: `http://127.0.0.1:${MOCK_PORT}/user/self`,
      PROFILE_URL: `http://127.0.0.1:${MOCK_PORT}/profile`,
      ALLOW_LOCAL_TEST: 'true',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let serviceOutput = '';
  service.stdout.on('data', (chunk) => { serviceOutput += chunk; });
  service.stderr.on('data', (chunk) => { serviceOutput += chunk; });
  let browser;
  try {
    await waitForHealth();
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1100, height: 850 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${SERVICE_PORT}/`);
    await page.getByRole('button', { name: '开始登录' }).click();
    await page.locator('#qr').waitFor({ state: 'visible' });
    await page.getByText('请使用抖音 App 扫码并在手机上确认').waitFor();
    if (await page.getByText('二维码已扫描，请在手机上确认登录').count()) {
      throw new Error('未扫码时错误进入已扫描状态');
    }
    const loginQr = await page.locator('#qr').screenshot({ type: 'png' });
    const darkPixelRatio = await page.locator('#qr').evaluate((image) => {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let dark = 0;
      for (let index = 0; index < pixels.length; index += 4) {
        if (pixels[index] < 80 && pixels[index + 1] < 80 && pixels[index + 2] < 80 && pixels[index + 3] > 0) dark += 1;
      }
      return dark / (canvas.width * canvas.height);
    });
    await page.getByText('请使用抖音 App 扫描新二维码并按提示完成刷脸验证').waitFor({ timeout: 10_000 });
    await page.waitForFunction(() => document.querySelector('#qr')?.src && document.querySelector('#qr').complete);
    const faceQrImage = await page.locator('#qr').screenshot({ type: 'png' });
    await page.getByText('登录成功，已取得并验证 Cookie').waitFor({ timeout: 10_000 });
    const result = {
      initialQrVisible: true,
      loginQrBytes: loginQr.length,
      loginQrDarkPixelRatio: darkPixelRatio,
      faceQrVisible: true,
      faceQrBytes: faceQrImage.length,
      verified: true,
      errors,
    };
    console.log(JSON.stringify(result));
    if (errors.length || loginQr.length < 1000 || faceQrImage.length < 1000 || darkPixelRatio < 0.03) process.exitCode = 1;
  } catch (error) {
    console.error(error.stack);
    console.error(serviceOutput);
    process.exitCode = 1;
  } finally {
    await browser?.close();
    service.kill('SIGTERM');
    mock.close();
  }
})();
