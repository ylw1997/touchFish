/* eslint-disable @typescript-eslint/no-require-imports */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const X_TS_PATH = path.resolve(__dirname, '../src/api/x.ts');

// 从 x.ts 文件解析出 OperationName -> 变量名 的映射
// 格式: // @operation: OperationName
//       export let|const VAR_NAME = "...";
function parseOperationMappings(content) {
    const mappings = {};
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // 匹配 // @operation: OperationName 注释
        const opMatch = line.match(/\/\/\s*@operation:\s*(\w+)/);
        if (opMatch) {
            const operationName = opMatch[1];
            // 查找下一行的 export let|const VAR_NAME = "..."
            for (let j = i + 1; j < lines.length && j < i + 5; j++) {
                const varMatch = lines[j].match(/export\s+(?:let|const)\s+(X_\w+_QUERY_ID)\s*=/);
                if (varMatch) {
                    const varName = varMatch[1];
                    mappings[operationName] = varName;
                    break;
                }
            }
        }
    }

    console.log('📋 从 x.ts 解析到的 Query ID 映射:');
    for (const [op, varName] of Object.entries(mappings)) {
        console.log(`   ${op} -> ${varName}`);
    }

    return mappings;
}

const INJECTION_SCRIPT = `
(async () => {
    // 等待 webpack 模块加载并注入获取缓存的逻辑
    if (typeof webpackChunk_twitter_responsive_web !== 'undefined') {
        webpackChunk_twitter_responsive_web.push([[''], {}, e => {
            window.moduleCache = [];
            for (let c in e.c) {
                window.moduleCache.push(e.c[c]);
            }
        }]);
    }

    // 提取 queryId
    if (window.moduleCache) {
        return window.moduleCache
            .filter(x => typeof x.exports == "object" && x.exports && "queryId" in x.exports)
            .map(x => [x.exports.operationName, x.exports.queryId]);
    }
    return [];
})()
`;

async function updateIds() {
    console.log('🚀 正在启动浏览器访问 X.com...');

    // 读取 x.ts 文件
    let content = fs.readFileSync(X_TS_PATH, 'utf8');

    // 从注释解析映射关系
    const ID_MAPPING = parseOperationMappings(content);

    // 自动识别系统环境变量中的代理设置
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
        // 设置较长的超时，并改用 commit/domcontentloaded 减少网络波动导致的中断
        console.log('📡 正在导航至 X.com...');
        await page.goto('https://x.com', { waitUntil: 'domcontentloaded', timeout: 90000 });

        console.log('🔍 正在注入脚本提取 Query IDs...');
        // 给页面较多时间确保 webpack 核心加载完成
        await page.waitForTimeout(10000);

        const results = await page.evaluate(INJECTION_SCRIPT);

        if (!results || results.length === 0) {
            throw new Error('未能从页面提取到任何 Query ID，请检查 X.com 是否可访问或脚本是否失效。');
        }

        console.log(`✅ 成功提取到 ${results.length} 个协议定义。`);

        let updatedCount = 0;

        for (const [opName, queryId] of results) {
            const varName = ID_MAPPING[opName];
            if (varName) {
                // 支持 let 和 const，并确保匹配整行
                const regex = new RegExp(`(export (?:let|const) ${varName} = ")[^"]+(";)`, 'g');
                if (regex.test(content)) {
                    content = content.replace(regex, `$1${queryId}$2`);
                    console.log(`📝 更新 ${varName} (${opName}) -> ${queryId}`);
                    updatedCount++;
                } else {
                    console.log(`⚠️ 变量 ${varName} 在文件中未找到或格式不匹配`);
                }
            } else {
                console.log(`ℹ️  跳过未知的 Operation: ${opName} (未在 x.ts 中找到 @operation: ${opName} 注释)`);
            }
        }

        if (updatedCount > 0) {
            fs.writeFileSync(X_TS_PATH, content, 'utf8');
            console.log(`🎉 完成！共更新了 ${updatedCount} 个 Query ID。`);
        } else {
            console.log('⚠️ 未匹配到需要更新的变量，所有 Query ID 可能已是最新。');
        }

    } catch (error) {
        console.error('❌ 出错了:', error.message);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

updateIds();
