# API Registry 重构指南

## 重构完成 ✅

### 完成状态
- ✅ 所有 15 个平台的 183 个端点已成功迁移
- ✅ `apiRegistry.js` 从 2852 行缩减到仅保留系统端点和辅助函数
- ✅ 所有 21 个测试通过
- ✅ 新架构支持渐进式迁移和模块化维护

### 迁移统计
| 平台 | 端点数 | 状态 |
|------|--------|------|
| 知乎 | 20 | ✅ 已迁移 |
| 微博 | 16 | ✅ 已迁移 |
| B站 | 21 | ✅ 已迁移 |
| QQ音乐 | 18 | ✅ 已迁移 |
| 小宇宙 | 14 | ✅ 已迁移 |
| 微信读书 | 45 | ✅ 已迁移 |
| 小红书 | 18 | ✅ 已迁移 |
| X平台 | 19 | ✅ 已迁移 |
| IT之家 | 2 | ✅ 已迁移 |
| Chiphell | 2 | ✅ 已迁移 |
| V2EX | 2 | ✅ 已迁移 |
| 虎扑 | 2 | ✅ 已迁移 |
| NGA | 2 | ✅ 已迁移 |
| Linux.do | 2 | ✅ 已迁移 |
| 系统 | 3 | ✅ 保留在 apiRegistry.js |

**总计: 183 个端点**

## 当前状态 (重构前)
- `apiRegistry.js` 有 2852 行代码
- 包含 15 个平台的端点定义
- 需要拆分到 `api/platforms/` 目录

## 目标结构

```
src/api/
├── index.js          # 入口文件，整合所有端点
├── platforms/
│   ├── index.js      # 导出所有平台端点
│   ├── system.js     # 系统端点
│   ├── ithome.js     # IT之家
│   ├── chiphell.js   # Chiphell
│   ├── v2ex.js       # V2EX
│   ├── hupu.js       # 虎扑
│   ├── nga.js        # NGA
│   ├── linuxdo.js    # Linux.do
│   ├── zhihu.js      # 知乎
│   ├── weibo.js      # 微博
│   ├── bilibili.js   # B站
│   ├── qqmusic.js    # QQ音乐
│   ├── xiaoyuzhou.js # 小宇宙
│   ├── weread.js     # 微信读书
│   ├── xhs.js        # 小红书
│   └── x.js          # X平台
```

## 每个平台文件模板

```javascript
const { commonHeaders, fetchJson, readUpstreamJson } = require("../upstream");
const { getZhihuSignature } = require("../signers");
const { endpoint, getQuery, requireQuery, cookie } = require("../utils");

// 平台端点定义
const zhihuEndpoints = [
  endpoint({
    id: "zhihu-hot",
    platformId: "zhihu",
    name: "热榜",
    path: "/api/zhihu/hot",
    // ...
  }),
  // ...
];

module.exports = { zhihuEndpoints };
```

## 重构步骤

1. **创建平台文件**
   - 从 `apiRegistry.js` 复制每个平台的端点代码
   - 添加到对应的 `platforms/{platform}.js` 文件

2. **更新 `platforms/index.js`**
   ```javascript
   const { systemEndpoints } = require("./system");
   const { zhihuEndpoints } = require("./zhihu");
   // ... 其他平台

   const allEndpoints = [
     ...systemEndpoints,
     ...zhihuEndpoints,
     // ... 其他平台
   ];

   module.exports = { endpoints: allEndpoints };
   ```

3. **更新 `api/index.js`**
   ```javascript
   const { platforms } = require("./platforms");
   const { endpoints } = require("./platforms");
   const { listEndpoints, executeApiEndpoint } = require("./helpers");

   module.exports = {
     platforms,
     endpoints,
     listEndpoints,
     executeApiEndpoint,
   };
   ```

4. **更新导入**
   - 修改 `app.js` 中的导入路径
   - 从 `require("./apiRegistry")` 改为 `require("./api")`

5. **测试**
   - 运行 `npm test` 确保所有测试通过

## 注意事项

- 保持 `endpointNameOverrides` 在 `utils.js` 中
- 共享的辅助函数（如 `jsonHandler`, `zhihuSignedGet`）放到 `helpers.js`
- 确保所有导入路径正确
