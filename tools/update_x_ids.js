/* eslint-disable @typescript-eslint/no-require-imports */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const X_TS_PATH = path.resolve(__dirname, '../src/api/x.ts');

const FALLBACK_QUERY_ID_URLS = [
    'https://fastly.jsdelivr.net/gh/ylw1997/xapi@master/query_ids.json',
    'https://raw.githubusercontent.com/ylw1997/xapi/master/query_ids.json',
];

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

async function fetchFallbackQueryIds() {
    for (const url of FALLBACK_QUERY_ID_URLS) {
        try {
            console.log(`🌐 尝试从备用数据源获取 Query IDs: ${url}`);
            const resp = await fetch(url, { signal: AbortSignal.timeout(10000) });
            if (resp.ok) {
                const data = await resp.json();
                if (data && typeof data === 'object' && Object.keys(data).length > 0) {
                    console.log(`✅ 成功从备用数据源获取到 ${Object.keys(data).length} 个 Query IDs`);
                    return data;
                }
            }
        } catch (e) {
            console.warn(`⚠️ 从备用源获取失败 (${url}):`, e.message);
        }
    }
    return null;
}

async function extractFromBrowser() {
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
                    // 第三方脚本可能无法读取响应体，不影响 X 主脚本提取。
                });
            scriptTasks.push(task);
        });

        const candidateUrls = [
            'https://x.com/explore',
            'https://x.com/?lang=en',
            'https://x.com/i/flow/login',
        ];

        let navResponse = null;
        for (const targetUrl of candidateUrls) {
            console.log(`📗 正在导航至 ${targetUrl}...`);
            try {
                navResponse = await page.goto(
                    targetUrl,
                    { waitUntil: 'domcontentloaded', timeout: 30000 },
                );
                const status = navResponse ? navResponse.status() : 0;
                if (status === 200) {
                    break;
                }
                console.log(`⚠️ 页面返回状态码 ${status}，尝试下一个候选地址...`);
            } catch (navErr) {
                console.warn(`⚠️ 访问 ${targetUrl} 失败:`, navErr.message);
            }
        }

        console.log('📳 正在注入脚本提取 Query IDs...');
        await page.waitForFunction(
            () => typeof window.webpackChunk_twitter_responsive_web !== 'undefined',
            { timeout: 15000 },
        ).catch(() => {
            console.log('⚠️ webpack 运行时未出现，将尝试从已加载脚本源码提取。');
        });
        await page.waitForTimeout(3000);

        const runtimeResults = await page.evaluate(INJECTION_SCRIPT).catch(() => []);
        await Promise.allSettled([...scriptTasks]);

        for (const [op, qid] of sourceResults) {
            resultMap.set(op, qid);
        }
        for (const [op, qid] of runtimeResults) {
            resultMap.set(op, qid);
        }

        console.log(
            `📊 浏览器提取结果: 共找到 ${resultMap.size} 个定义`
            + `（运行时 ${runtimeResults.length} 个，脚本源码 ${sourceResults.size} 个）。`,
        );
    } catch (browserErr) {
        console.warn('⚠️ 浏览器自动化提取异常:', browserErr.message);
    } finally {
        await browser.close().catch(() => {});
    }

    return resultMap;
}

async function updateIds() {
    console.log('🚀 正在启动 X Query IDs 更新流程...');

    let content = fs.readFileSync(X_TS_PATH, 'utf8');
    const idMapping = parseOperationMappings(content);

    // 1. 尝试通过浏览器自动化从 X.com 官网提取
    let resultMap = await extractFromBrowser(idMapping);

    // 检查是否有缺失项
    const missingOperations = Object.keys(idMapping).filter(op => !resultMap.has(op));

    // 2. 如果官网被 403 拦截或提取不完整，触发备用数据源降级
    if (missingOperations.length > 0) {
        console.log(`⚠️ 官网提取存在未匹配项 (${missingOperations.length} 个): ${missingOperations.join(', ')}`);
        console.log('🔄 正在启动备用数据源降级获取...');
        const fallbackData = await fetchFallbackQueryIds();
        if (fallbackData) {
            for (const [op, qid] of Object.entries(fallbackData)) {
                if (!resultMap.has(op)) {
                    resultMap.set(op, qid);
                }
            }
        }
    }

    const finalMissing = Object.keys(idMapping).filter(op => !resultMap.has(op));
    if (finalMissing.length > 0) {
        throw new Error(`Query ID 提取仍不完整，缺失操作: ${finalMissing.join(', ')}`);
    }

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
    updateIds,
};

