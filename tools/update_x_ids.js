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

const INJECTION_SCRIPT = `
(async () => {
    if (typeof webpackChunk_twitter_responsive_web !== 'undefined') {
        webpackChunk_twitter_responsive_web.push([[''], {}, e => {
            window.moduleCache = [];
            for (const c in e.c) {
                window.moduleCache.push(e.c[c]);
            }
        }]);
    }

    if (window.moduleCache) {
        return window.moduleCache
            .filter(x => typeof x.exports === "object" && x.exports && "queryId" in x.exports)
            .map(x => [x.exports.operationName, x.exports.queryId]);
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
        const page = await browser.newPage();
        console.log('📗 正在导航至 X.com...');
        await page.goto('https://x.com', { waitUntil: 'domcontentloaded', timeout: 90000 });

        console.log('📳 正在注入脚本提取 Query IDs...');
        await page.waitForTimeout(10000);

        const results = await page.evaluate(INJECTION_SCRIPT);
        if (!results || results.length === 0) {
            throw new Error('未能从页面提取到任何 Query ID，请检查 X.com 是否可访问或脚本是否失效。');
        }

        console.log(`✅ 成功提取到 ${results.length} 个定义。`);

        let updatedCount = 0;

        for (const [opName, queryId] of results) {
            const varName = idMapping[opName];
            if (!varName) {
                console.log(`ℹ️ 跳过未知 Operation: ${opName} (x.ts 中未找到 @operation 注释)`);
                continue;
            }

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
    parseOperationMappings,
    replaceQueryIdInContent,
    updateIds,
};
