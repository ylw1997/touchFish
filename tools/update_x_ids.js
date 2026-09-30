/* eslint-disable @typescript-eslint/no-require-imports */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const X_TS_PATH = path.resolve(__dirname, '../src/api/x.ts');

/**
 * 解析用户输入的 Cookie 字符串为 Playwright 所需的 Cookie 数组
 * 兼容 .x.com 与 .twitter.com 两个域名
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
 * 获取 Cookie：优先命令行参数 -> 环境变量 -> 交互式终端输入
 */
async function resolveCookie() {
    // 1. 命令行参数 --cookie / -c
    const args = process.argv.slice(2);
    for (let i = 0; i < args.length; i++) {
        if (args[i].startsWith('--cookie=')) {
            const val = args[i].substring('--cookie='.length).trim();
            if (val) return val;
        }
        if (args[i] === '--cookie' || args[i] === '-c') {
            const val = (args[i + 1] || '').trim();
            if (val) return val;
        }
    }

    // 2. 环境变量 X_COOKIE
    if (process.env.X_COOKIE && process.env.X_COOKIE.trim()) {
        console.log('🔑 已从环境变量 X_COOKIE 读取凭据');
        return process.env.X_COOKIE.trim();
    }

    // 3. 交互式终端输入
    if (process.stdin.isTTY) {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        return new Promise(resolve => {
            console.log('\n======================================================');
            console.log('📌 提示: X.com 当前需要登录态 Cookie 才能完整提取 Query IDs');
            console.log('👉 可在浏览器登录 x.com 后从 DevTools 复制整段 Cookie 粘贴于此');
            console.log('======================================================\n');
            rl.question('🔑 请输入 X (Twitter) Cookie (直接粘贴后回车，留空跳过): ', answer => {
                rl.close();
                resolve((answer || '').trim());
            });
        });
    }

    return '';
}

// 从 x.ts 文件解析 OperationName -> 常量名 的映射
// 格式: // @operation: OperationName
//       export let|const VAR_NAME = "...";
function parseOperationMappings(content) {
    const mappings = {};
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const opMatch = line.match(/\/\/\s*@operation:\s*(\w+)/);
        if (!opMatch) {
            continue;
        }

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
        return {
            content,
            updated: false,
            currentValue: null,
        };
    }

    const currentValue = match[2];
    if (currentValue === queryId) {
        return {
            content,
            updated: false,
            currentValue,
        };
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

const INJECTION_SCRIPT = `
(async () => {
    const chunks = window.webpackChunk_twitter_responsive_web;
    if (chunks) {
        chunks.push([['touchfish-query-ids-' + Date.now()], {}, runtime => {
            window.__touchfishModuleCache = [];
            for (const moduleId in runtime.c) {
                window.__touchfishModuleCache.push(runtime.c[moduleId]);
            }
        }]);
    }

    if (window.__touchfishModuleCache) {
        return window.__touchfishModuleCache
            .filter(module => {
                try {
                    const exports = module && module.exports;
                    return exports && typeof exports === 'object'
                        && typeof exports.operationName === 'string'
                        && typeof exports.queryId === 'string';
                } catch {
                    return false;
                }
            })
            .map(module => [module.exports.operationName, module.exports.queryId]);
    }

    return [];
})()
`;

async function updateIds() {
    console.log('🚀 正在启动 X Query IDs 更新流程...');

    // 获取并解析 Cookie
    const rawCookie = await resolveCookie();
    const playwrightCookies = parseCookieStringToPlaywrightCookies(rawCookie);
    const hasAuthCookie = playwrightCookies.length > 0;

    if (hasAuthCookie) {
        console.log(`🍪 已加载 Cookie（包含 ${Math.floor(playwrightCookies.length / 2)} 个字段）`);
    } else {
        console.log('⚠️ 未提供 Cookie，将尝试匿名访问（若遇 403 建议通过交互输入或 --cookie 提供 Cookie）');
    }

    let content = fs.readFileSync(X_TS_PATH, 'utf8');
    const idMapping = parseOperationMappings(content);

    const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.ALL_PROXY ||
        process.env.https_proxy || process.env.http_proxy || process.env.all_proxy;

    const launchConfig = {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
            '--disable-infobars',
        ],
    };
    if (proxyUrl) {
        launchConfig.proxy = { server: proxyUrl };
        console.log(`🌐 检测到系统代理: ${proxyUrl}`);
    }

    const browser = await chromium.launch(launchConfig);
    const resultMap = new Map();

    try {
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
            locale: 'en-US',
            viewport: { width: 1440, height: 900 },
        });

        if (hasAuthCookie) {
            await context.addCookies(playwrightCookies);
        }

        const page = await context.newPage();
        await page.addInitScript(() => {
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined,
            });
        });

        const sourceResults = new Map();
        const scriptTasks = [];

        page.on('response', response => {
            if (response.request().resourceType() !== 'script') {
                return;
            }

            const task = response.text()
                .then(source => {
                    for (const [operationName, queryId] of extractQueryIdsFromSource(source)) {
                        sourceResults.set(operationName, queryId);
                    }
                })
                .catch(() => {
                    // 忽略跨域或响应体已消费的脚本
                });
            scriptTasks.push(task);
        });

        // 登录态优先导航至 /home，未登录态尝试 /explore 或首页
        const candidateUrls = hasAuthCookie
            ? ['https://x.com/home', 'https://x.com/explore']
            : ['https://x.com/explore', 'https://x.com/?lang=en', 'https://x.com/i/flow/login'];

        let response = null;
        for (const targetUrl of candidateUrls) {
            console.log(`📗 正在导航至 ${targetUrl}...`);
            try {
                response = await page.goto(targetUrl, {
                    waitUntil: 'domcontentloaded',
                    timeout: 45000,
                });
                const status = response ? response.status() : 0;
                if (status === 200) {
                    console.log(`✅ 页面加载成功 (${status})`);
                    break;
                }
                console.log(`⚠️ 访问返回状态码 ${status}，尝试下一个地址...`);
            } catch (navErr) {
                console.warn(`⚠️ 访问 ${targetUrl} 异常:`, navErr.message);
            }
        }

        console.log('📳 正在注入脚本提取 Query IDs...');
        await page.waitForFunction(
            () => typeof window.webpackChunk_twitter_responsive_web !== 'undefined',
            { timeout: 20000 },
        ).catch(() => {
            console.log('⚠️ webpack 运行时未完全就绪，将尝试从已加载脚本源码提取。');
        });

        // 等待所有脚本响应加载完毕
        await page.waitForTimeout(4000);

        const runtimeResults = await page.evaluate(INJECTION_SCRIPT).catch(() => []);
        await Promise.allSettled([...scriptTasks]);

        for (const [operationName, queryId] of sourceResults) {
            resultMap.set(operationName, queryId);
        }
        for (const [operationName, queryId] of runtimeResults) {
            resultMap.set(operationName, queryId);
        }

        const results = [...resultMap.entries()];
        const missingOperations = Object.keys(idMapping)
            .filter(operationName => !resultMap.has(operationName));

        if (results.length === 0 || missingOperations.length > 0) {
            const diagnostics = {
                status: response ? response.status() : null,
                url: page.url(),
                title: await page.title().catch(() => ''),
                scripts: scriptTasks.length,
                extracted: results.length,
                missingOperations,
            };
            throw new Error(
                `Query ID 提取不完整。请确认 Cookie 是否有效。页面状态: ${JSON.stringify(diagnostics)}`,
            );
        }

        console.log(
            `✅ 成功提取到 ${results.length} 个定义`
            + `（运行时 ${runtimeResults.length} 个，脚本源码 ${sourceResults.size} 个）。`,
        );

        let updatedCount = 0;
        for (const [opName, varName] of Object.entries(idMapping)) {
            const queryId = resultMap.get(opName);
            const replaceResult = replaceQueryIdInContent(content, varName, queryId);
            if (replaceResult.currentValue === null) {
                console.log(`⚠️ 变量 ${varName} 在文件中未找到或格式不匹配`);
                continue;
            }

            if (!replaceResult.updated) {
                console.log(`✅ ${varName} (${opName}) 已是最新 (${queryId})`);
                continue;
            }

            content = replaceResult.content;
            console.log(`📑 更新 ${varName} (${opName}) -> ${queryId}`);
            updatedCount++;
        }

        if (updatedCount > 0) {
            fs.writeFileSync(X_TS_PATH, content, 'utf8');
            console.log(`🎀 完成，共更新 ${updatedCount} 个 Query ID。`);
        } else {
            console.log('✅ 所有 Query ID 均已是最新状态，无需更新。');
        }
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
    updateIds,
};
