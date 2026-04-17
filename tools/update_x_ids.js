/* eslint-disable @typescript-eslint/no-require-imports */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const X_TS_PATH = path.resolve(__dirname, '../src/api/x.ts');

// 映射关系：OperationName -> 变量名
const ID_MAPPING = {
    'HomeTimeline': 'X_HOME_TIMELINE_QUERY_ID',
    'TweetDetail': 'X_TWEET_DETAIL_QUERY_ID',
    'SearchTimeline': 'X_SEARCH_TIMELINE_QUERY_ID',
    'UserByScreenName': 'X_USER_BY_SCREEN_NAME_QUERY_ID',
    'UserTweets': 'X_USER_TWEETS_QUERY_ID',
    'CreateTweet': 'X_CREATE_TWEET_QUERY_ID',
    'HomeLatestTimeline': 'X_HOME_LATEST_TIMELINE_QUERY_ID'
};

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

        let content = fs.readFileSync(X_TS_PATH, 'utf8');
        let updatedCount = 0;

        for (const [opName, queryId] of results) {
            const varName = ID_MAPPING[opName];
            if (varName) {
                const regex = new RegExp(`(export (?:let|const) ${varName} = ")[^"]+("; )`, 'g');
                if (regex.test(content)) {
                    content = content.replace(regex, `$1${queryId}$2`);
                    console.log(`📝 更新 ${varName} -> ${queryId}`);
                    updatedCount++;
                }
            }
        }

        if (updatedCount > 0) {
            fs.writeFileSync(X_TS_PATH, content, 'utf8');
            console.log(`🎉 完成！共更新了 ${updatedCount} 个 Query ID。`);
        } else {
            console.log('⚠️ 未匹配到需要更新的变量，请检查 x.ts 中的变量名定义。');
        }

    } catch (error) {
        console.error('❌ 出错了:', error.message);
    } finally {
        await browser.close();
    }
}

updateIds();
