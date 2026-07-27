const assert = require('assert');

const {
  extractQueryIdsFromSource,
  replaceQueryIdInContent,
} = require('./update_x_ids');

const originalContent = `// @operation: HomeTimeline
export let X_HOME_TIMELINE_QUERY_ID = "Yf4WJo0fW46TnqrHUw_1Ow";
// @operation: TweetDetail
export let X_TWEET_DETAIL_QUERY_ID = "QrLp7AR-eMyamw8D1N9l6A";
`;

const result = replaceQueryIdInContent(
  originalContent,
  'X_HOME_TIMELINE_QUERY_ID',
  '3tb-_5Lf7kdCZ1cFHmsEfg',
);

const updatedContent = result.content;

assert.equal(result.updated, true, '当 query id 变化时应该标记为已更新');

assert.ok(
  updatedContent.includes('export let X_HOME_TIMELINE_QUERY_ID = "3tb-_5Lf7kdCZ1cFHmsEfg";'),
  '应该只替换 HomeTimeline 的 query id，且保留结束引号和分号',
);

assert.ok(
  updatedContent.includes('export let X_TWEET_DETAIL_QUERY_ID = "QrLp7AR-eMyamw8D1N9l6A";'),
  '不应该影响其它 query id',
);

assert.ok(
  !updatedContent.includes('3tb-_5Lf7kdCZ1cFHmsEfgYf4WJo0fW46TnqrHUw_1Ow'),
  '不应该把新旧 query id 拼接在一起',
);

const sourceResults = extractQueryIdsFromSource(`
  123(e){e.exports={queryId:"home-id",operationName:"HomeTimeline",operationType:"query"}}
  456(e){e.exports={operationName:'TweetDetail',queryId:'tweet-id',operationType:'query'}}
`);

assert.deepEqual(
  sourceResults,
  [
    ['HomeTimeline', 'home-id'],
    ['TweetDetail', 'tweet-id'],
  ],
  '应该支持从压缩后的脚本源码提取两种字段顺序',
);

console.log('update_x_ids replace test passed');
