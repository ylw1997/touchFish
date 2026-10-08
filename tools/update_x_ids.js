/* eslint-disable @typescript-eslint/no-require-imports */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const net = require('net');

const X_TS_PATH = path.resolve(__dirname, '../src/api/x.ts');

/**
 * 检测代理服务端口是否可用
 */
async function isProxyAlive(proxyUrl) {
    if (!proxyUrl) return false;
    try {
        const urlStr = proxyUrl.startsWith('http://') || proxyUrl.startsWith('https://') || proxyUrl.startsWith('socks5://') || proxyUrl.startsWith('socks://')
            ? proxyUrl
            : `http://${proxyUrl}`;
        const parsed = new URL(urlStr);
        const host = parsed.hostname || '127.0.0.1';
        const port = parseInt(parsed.port || (parsed.protocol.startsWith('socks') ? '1080' : '80'), 10);
        return await new Promise(resolve => {
            const socket = net.createConnection({ host, port, timeout: 2000 }, () => {
                socket.destroy();
                resolve(true);
            });
            socket.on('error', () => resolve(false));
            socket.on('timeout', () => {
                socket.destroy();
                resolve(false);
            });
        });
    } catch {
        return false;
    }
}

/**
 * 尝试从输入文本中解析出 Query IDs 的 JSON 映射
 */
function tryParseJsonIds(rawInput) {
    if (!rawInput || typeof rawInput !== 'string') return null;
    const trimmed = rawInput.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
            const obj = JSON.parse(trimmed);
            if (obj && typeof obj === 'object' && Object.keys(obj).length > 0) {
                return obj;
            }
        } catch {
            console.warn('⚠️ 输入的 JSON 映射解析失败，请检查格式是否正确');
        }
    }
    return null;
}

/**
 * 解析 Cookie 字符串为 Playwright 所需格式
 */
function parseCookieStringToPlaywrightCookies(cookieStr) {
    if (!cookieStr || typeof cookieStr !== 'string') {
        return [];
    }

    const cookies = [];
    const parts = cookieStr.split(';');

    for (const part of parts) {
        const trimmed = part.trim();
        if (!trimmed) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx === -1) continue;

        const name = trimmed.substring(0, eqIdx).trim();
        const value = trimmed.substring(eqIdx + 1).trim();

        if (name) {
            cookies.push({
                name,
                value,
                domain: '.x.com',
                path: '/',
                secure: true,
                httpOnly: name === 'auth_token',
                sameSite: 'Lax',
            });
            cookies.push({
                name,
                value,
                domain: '.twitter.com',
                path: '/',
                secure: true,
                httpOnly: name === 'auth_token',
                sameSite: 'Lax',
            });
        }
    }

    return cookies;
}

/**
 * 获取输入凭据
 */
async function resolveInput() {
    // 1. 命令行参数
    const args = process.argv.slice(2);
    for (let i = 0; i < args.length; i++) {
        if (args[i].startsWith('--cookie=') || args[i].startsWith('--input=')) {
            const val = args[i].split('=')[1].trim();
            if (val) return val;
        }
        if (args[i] === '--cookie' || args[i] === '-c' || args[i] === '--input') {
            const val = (args[i + 1] || '').trim();
            if (val) return val;
        }
    }

    // 2. 环境变量
    if (process.env.X_COOKIE && process.env.X_COOKIE.trim()) {
        console.log('🔑 已从环境变量 X_COOKIE 读取凭据');
        return process.env.X_COOKIE.trim();
    }
    if (process.env.X_QUERY_IDS_JSON && process.env.X_QUERY_IDS_JSON.trim()) {
        console.log('🔑 检测到环境变量 X_QUERY_IDS_JSON');
        return process.env.X_QUERY_IDS_JSON.trim();
    }

    // 3. 交互式终端输入
    if (process.stdin.isTTY) {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        return new Promise(resolve => {
            console.log('\n======================================================');
            console.log('📌 提示: 请输入 X (Twitter) Cookie 字符串或 Query IDs JSON:');
            console.log('======================================================\n');
            rl.question('🔑 请输入 (回车确认): ', answer => {
                rl.close();
                resolve((answer || '').trim());
            });
        });
    }

    return '';
}

function parseOperationMappings(content) {
    const mappings = {};
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const opMatch = line.match(/\/\/\s*@operation:\s*(\w+)/);
        if (!opMatch) continue;

        const operationName = opMatch[1];
        for (let j = i + 1; j < lines.length && j < i + 5; j++) {
            const varMatch = lines[j].match(/export\s+(?:let|const)\s+(X_\w+_QUERY_ID)\s*=/);
            if (varMatch) {
                mappings[operationName] = varMatch[1];
                break;
            }
        }
    }

    console.log('📋 从 x.ts 解析到的 Query ID 映射:');
    for (const [op, varName] of Object.entries(mappings)) {
        console.log(`   ${op} -> ${varName}`);
    }

    return mappings;
}

function replaceQueryIdInContent(content, varName, queryId) {
    const regex = new RegExp(`(export (?:let|const) ${varName} = ")([^"]+)(";)`);
    const match = content.match(regex);

    if (!match) {
        return { content, updated: false, currentValue: null };
    }

    const currentValue = match[2];
    if (currentValue === queryId) {
        return { content, updated: false, currentValue };
    }

    return {
        content: content.replace(regex, `$1${queryId}$3`),
        updated: true,
        currentValue,
    };
}

function extractQueryIdsFromSource(source) {
    const results = [];
    const patterns = [
        /queryId\s*:\s*["']([^"']+)["']\s*,\s*operationName\s*:\s*["'](\w+)["']/g,
        /operationName\s*:\s*["'](\w+)["']\s*,\s*queryId\s*:\s*["']([^"']+)["']/g,
    ];

    for (const [index, pattern] of patterns.entries()) {
        for (const match of source.matchAll(pattern)) {
            const operationName = index === 0 ? match[2] : match[1];
            const queryId = index === 0 ? match[1] : match[2];
            results.push([operationName, queryId]);
        }
    }

    return results;
}

function applyUpdatesToContent(content, idMapping, resultMap) {
    let updatedCount = 0;
    let newContent = content;

    for (const [opName, varName] of Object.entries(idMapping)) {
        const queryId = resultMap.get(opName);
        if (!queryId) {
            console.log(`⚠️ 操作 ${opName} 未在抓取结果中找到，保持原样`);
            continue;
        }

        const replaceResult = replaceQueryIdInContent(newContent, varName, queryId);
        if (replaceResult.currentValue === null) {
            console.log(`⚠️ 变量 ${varName} 在文件中未找到或格式不匹配`);
            continue;
        }

        if (!replaceResult.updated) {
            console.log(`✅ ${varName} (${opName}) 已是最新 (${queryId})`);
            continue;
        }

        newContent = replaceResult.content;
        console.log(`📑 更新 ${varName} (${opName}) -> ${queryId}`);
        updatedCount++;
    }

    if (updatedCount > 0) {
        fs.writeFileSync(X_TS_PATH, newContent, 'utf8');
        console.log(`🎀 完成，共更新 ${updatedCount} 个 Query ID。`);
    } else {
        console.log('✅ 所有 Query ID 均已是最新状态，无需更新。');
    }
}

/**
 * 智能等待 Cloudflare 质询通过
 */
async function waitForCloudflareChallenge(page, timeoutMs = 30000) {
    const startTime = Date.now();
    let hasLogged = false;

    while (Date.now() - startTime < timeoutMs) {
        const currentUrl = page.url();
        const title = await page.title().catch(() => '');

        const isChallenge =
            currentUrl.includes('__cf_chl_rt_tk') ||
            title.includes('Just a moment') ||
            title.includes('Cloudflare') ||
            title.includes('Attention Required');

        if (!isChallenge) {
            if (hasLogged) {
                console.log('🎉 Cloudflare 质询已顺利通过！进入页面:', currentUrl);
            }
            return true;
        }

        if (!hasLogged) {
            console.log('🛡️ 检测到 Cloudflare 质询页面 (__cf_chl_rt_tk)，正在等待计算并自动重定向...');
            hasLogged = true;
        }

        // 尝试检测是否存在 Turnstile checkbox iframe 并进行交互辅助
        try {
            const cfIframes = await page.$$('iframe[src*="cloudflare"], iframe[src*="turnstile"], iframe[title*="Widget containing a Cloudflare security challenge"]');
            for (const iframe of cfIframes) {
                const box = await iframe.boundingBox();
                if (box && box.width > 0 && box.height > 0) {
                    await page.mouse.click(box.x + Math.min(30, box.width / 4), box.y + box.height / 2).catch(() => {});
                }
            }

            const frames = page.frames();
            for (const frame of frames) {
                const box = await frame.$('input[type="checkbox"], #challenge-stage, .cf-turnstile, .ctp-checkbox-label');
                if (box) {
                    await box.click().catch(() => {});
                }
            }
        } catch {
            console.warn('⚠️ 尝试与 Cloudflare Turnstile 交互失败，可能需要手动完成验证。');
        }

        await page.waitForTimeout(1500);
    }

    console.warn('⚠️ Cloudflare 质询等待超时，将继续尝试解析已加载的脚本。');
    return false;
}

async function updateIds() {
    console.log('🚀 正在启动 X Query IDs 更新流程...');

    let content = fs.readFileSync(X_TS_PATH, 'utf8');
    const idMapping = parseOperationMappings(content);

    const rawInput = await resolveInput();

    // 1. 若直接输入了 JSON 映射
    const parsedJson = tryParseJsonIds(rawInput);
    if (parsedJson) {
        console.log(`📦 检测到直接输入 Query IDs JSON 映射，包含 ${Object.keys(parsedJson).length} 个定义`);
        const resultMap = new Map(Object.entries(parsedJson));
        applyUpdatesToContent(content, idMapping, resultMap);
        return;
    }

    // 2. 否则通过 Playwright 携带 Cookie 模拟浏览器访问抓取
    const playwrightCookies = parseCookieStringToPlaywrightCookies(rawInput);
    const hasAuthCookie = playwrightCookies.length > 0;

    if (hasAuthCookie) {
        console.log(`🍪 已加载 Cookie（包含 ${Math.floor(playwrightCookies.length / 2)} 个字段）`);
    } else {
        console.log('⚠️ 未提供有效 Cookie，将尝试未登录访问');
    }

    const rawProxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.ALL_PROXY ||
        process.env.https_proxy || process.env.http_proxy || process.env.all_proxy;

    const isLinux = process.platform === 'linux';
    const userAgent = isLinux
        ? 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
        : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

    const launchArgs = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-infobars',
        '--disable-dev-shm-usage',
        '--no-first-run',
        '--no-default-browser-check',
        '--window-size=1920,1080',
    ];

    let headless = true;
    if (process.env.HEADLESS === 'false') {
        headless = false;
    } else if (process.env.HEADLESS === 'true') {
        headless = true;
    } else if (process.env.DISPLAY) {
        // 在 Linux 环境中如果有虚拟桌面 DISPLAY (如 xvfb)，使用真实桌面有头模式提升 Cloudflare 通过率
        headless = false;
    }

    const launchConfig = {
        headless,
        args: launchArgs,
    };

    if (rawProxyUrl) {
        const alive = await isProxyAlive(rawProxyUrl);
        if (alive) {
            launchConfig.proxy = { server: rawProxyUrl };
            console.log(`🌐 使用代理: ${rawProxyUrl}`);
        } else {
            console.log(`⚠️ 环境变量配置的代理 (${rawProxyUrl}) 连通性测试未通过，自动回退到直连访问`);
        }
    }

    const browser = await chromium.launch(launchConfig);
    const resultMap = new Map();

    try {
        const context = await browser.newContext({
            userAgent,
            locale: 'en-US',
            viewport: { width: 1440, height: 900 },
        });

        if (hasAuthCookie) {
            await context.addCookies(playwrightCookies);
        }

        const page = await context.newPage();
        await page.addInitScript(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
            window.chrome = {
                runtime: {},
                loadTimes: () => {},
                csi: () => {},
                app: {},
            };
            Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
            Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
        });

        const sourceResults = new Map();
        const scriptTasks = [];

        page.on('response', response => {
            const url = response.url();
            if (response.request().resourceType() === 'script' || url.includes('.js')) {
                const task = response.text()
                    .then(source => {
                        for (const [op, qid] of extractQueryIdsFromSource(source)) {
                            sourceResults.set(op, qid);
                        }
                    })
                    .catch(() => {});
                scriptTasks.push(task);
            }
        });

        const candidateUrls = hasAuthCookie
            ? ['https://x.com/home', 'https://twitter.com/home', 'https://x.com/explore']
            : ['https://x.com/explore', 'https://twitter.com/explore', 'https://x.com/?lang=en'];

        let lastStatus = 0;
        let lastUrl = '';

        for (const targetUrl of candidateUrls) {
            console.log(`📗 正在访问 ${targetUrl}...`);
            try {
                const response = await page.goto(targetUrl, {
                    waitUntil: 'domcontentloaded',
                    timeout: 45000,
                });
                lastStatus = response ? response.status() : 0;
                lastUrl = page.url();

                console.log(`📄 页面响应状态码: ${lastStatus}，当前URL: ${lastUrl}`);

                // 遇到 Cloudflare 质询时，智能等待质询完成，切勿直接抛错自杀
                await waitForCloudflareChallenge(page, 30000);

                const currentUrl = page.url();
                const title = await page.title().catch(() => '');

                if (!currentUrl.includes('__cf_chl_rt_tk') && !title.includes('Just a moment')) {
                    console.log(`✅ 成功建立会话，已就绪: ${currentUrl}`);
                    break;
                }
            } catch (navErr) {
                console.warn(`⚠️ 访问 ${targetUrl} 异常:`, navErr.message);
            }
        }

        console.log('⏳ 正在等待前端脚本及 Webpack chunks 加载...');
        await page.waitForTimeout(6000);
        await Promise.allSettled(scriptTasks);

        const runtimeResults = await page.evaluate(() => {
            const chunks = window.webpackChunk_twitter_responsive_web;
            if (chunks) {
                chunks.push([['query-id-scan-' + Date.now()], {}, r => {
                    window.__modules = Object.values(r.c);
                }]);
            }
            if (window.__modules) {
                return window.__modules
                    .filter(m => m?.exports && typeof m.exports === 'object' && m.exports.queryId && m.exports.operationName)
                    .map(m => [m.exports.operationName, m.exports.queryId]);
            }
            return [];
        }).catch(() => []);

        for (const [op, qid] of sourceResults) {
            resultMap.set(op, qid);
        }
        for (const [op, qid] of runtimeResults) {
            resultMap.set(op, qid);
        }

        const results = [...resultMap.entries()];
        const missingOperations = Object.keys(idMapping).filter(op => !resultMap.has(op));

        if (results.length === 0 || missingOperations.length > 0) {
            const diagnostics = {
                lastStatus,
                lastUrl: page.url(),
                title: await page.title().catch(() => ''),
                scripts: scriptTasks.length,
                extracted: results.length,
                missingOperations,
            };
            throw new Error(`Query ID 提取不完整。诊断信息: ${JSON.stringify(diagnostics)}`);
        }

        console.log(
            `✅ 成功提取到 ${results.length} 个定义（运行时 ${runtimeResults.length} 个，脚本源码 ${sourceResults.size} 个）。`,
        );

        applyUpdatesToContent(content, idMapping, resultMap);
    } finally {
        await browser.close().catch(() => {});
    }
}

if (require.main === module) {
    updateIds().catch(err => {
        console.error('❌ 执行失败:', err.message);
        process.exit(1);
    });
}

module.exports = {
    extractQueryIdsFromSource,
    parseOperationMappings,
    replaceQueryIdInContent,
    parseCookieStringToPlaywrightCookies,
    tryParseJsonIds,
    updateIds,
};
