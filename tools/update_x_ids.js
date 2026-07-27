/* eslint-disable @typescript-eslint/no-require-imports */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const X_TS_PATH = path.resolve(__dirname, '../src/api/x.ts');

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
    console.log('🚀 正在启动浏览器访问 X.com...');

    let content = fs.readFileSync(X_TS_PATH, 'utf8');
    const idMapping = parseOperationMappings(content);

    const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.ALL_PROXY ||
        process.env.https_proxy || process.env.http_proxy || process.env.all_proxy;

    const launchConfig = { headless: true };
    if (proxyUrl) {
        launchConfig.proxy = { server: proxyUrl };
        console.log(`🌐 检测到系统代理: ${proxyUrl}`);
    }

    const browser = await chromium.launch(launchConfig);

    try {
        const page = await browser.newPage({
            locale: 'en-US',
            viewport: { width: 1440, height: 900 },
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

        console.log('📗 正在导航至 X.com...');
        const response = await page.goto(
            'https://x.com/i/flow/login',
            { waitUntil: 'domcontentloaded', timeout: 90000 },
        );

        console.log('📳 正在注入脚本提取 Query IDs...');
        await page.waitForFunction(
            () => typeof window.webpackChunk_twitter_responsive_web !== 'undefined',
            { timeout: 30000 },
        ).catch(() => {
            console.log('⚠️ webpack 运行时未出现，将尝试从已加载脚本源码提取。');
        });
        await page.waitForTimeout(5000);

        const runtimeResults = await page.evaluate(INJECTION_SCRIPT);
        await Promise.allSettled([...scriptTasks]);

        const resultMap = new Map(sourceResults);
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
                title: await page.title(),
                scripts: scriptTasks.length,
                extracted: results.length,
                missingOperations,
            };
            throw new Error(
                `Query ID 提取不完整。页面状态: ${JSON.stringify(diagnostics)}`,
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
            console.log('⚠️ 没有匹配到需要更新的变量，所有 Query ID 可能已经是最新。');
        }
    } catch (error) {
        console.error('❌ 出错了:', error.message);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

if (require.main === module) {
    updateIds();
}

module.exports = {
    extractQueryIdsFromSource,
    parseOperationMappings,
    replaceQueryIdInContent,
    updateIds,
};
