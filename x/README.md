# TouchFish X

> [!Important]
>
> 记住这个应用：`TouchFish X` - 摸鱼，也要摸得专业！

一个专为在 VS Code 中隐秘摸鱼刷X设计的客户端，让你在编码的间隙，也能轻松掌握热点，关注动态，同时保持专业的工作姿态。

## 特性

- **多 Feed 流**: 全面支持热门、关注、本地等多种X Feed
- **完整X体验**: 点赞、评论、转发、关注/取关，功能一应俱全
- **沉浸式浏览**: 无限滚动加载，让你刷得停不下来
- **深度交互**: 查看用户主页、展开长X、浏览评论区
- **发布与分享**: 支持发布图文X，复制链接分享
- **高度集成**: 专为 VS Code 设计的暗色主题，完美融入你的开发环境
- **性能优化**: 组件懒加载、虚拟滚动，保证摸鱼体验如丝般顺滑
- **保护隐私**: 可一键隐藏/显示所有图片，避免尴尬

> [!Note]
> 本项目是 [TouchFish-vscode](https://github.com/Done-0/touchfish-vscode) 插件的前端部分，专为在 IDE 中无缝摸鱼而生。
> 所有数据交互均通过 VS Code 插件转发，保障你的冲浪体验既安全又私密。

## 安利一下

我的 AI 赛博算命网站上线啦！ [玄学工坊](https://bazi.site) - https://bazi.site

我的开源博客项目 [Jank](https://github.com/Done-0/Jank) - https://github.com/Done-0/Jank

## 安装与开发

### 1. 克隆仓库

```bash
git clone https://github.com/Done-0/touchfish-vscode.git
cd touchfish-vscode/x
```

### 2. 安装依赖

推荐使用 `pnpm` 进行依赖管理。

```bash
pnpm install
```

### 3. 启动开发环境

```bash
pnpm dev
```

## 可用脚本

| 命令           | 描述                           |
| :------------- | :----------------------------- |
| `pnpm dev`     | 启动本地开发服务器，开启热更新 |
| `pnpm build`   | 将项目打包为生产环境代码       |
| `pnpm lint`    | 使用 ESLint 检查代码规范       |
| `pnpm preview` | 在本地预览生产环境的构建结果   |

## 项目结构

```
src/
├── components/    # UI 组件 (X卡片、抽屉等)
├── data/          # 静态数据 (如 Tab 配置)
├── hooks/         # 自定义 React Hooks (核心逻辑)
├── style/         # 全局样式文件
├── types/         # TypeScript 类型定义
└── utils/         # 通用工具函数
```

## 许可证

本项目采用 MIT 许可证

## 贡献

欢迎提交 PR，为“摸鱼”事业添砖加瓦！
