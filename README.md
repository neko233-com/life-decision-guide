# 人生决策指南

网站：[life.neko233.com](https://life.neko233.com/)

React 19 + Vite，正文以 HTML 保存。白色、系统字体与蓝色交互，先读一句要点，再看完整依据。

## 内容

- 完整导入《高性价比人生指南》34 章、658 条建议、9 篇补充文档及阅读帮助。
- 6 个主题、144 个章内问题分组。每条先看短标题和一句话，按需展开完整原文六字段。
- 全站搜索覆盖全部正文，关键词高亮，支持 Ctrl / ⌘ + K、方向键及 Enter。命中后展开对应条目。
- 方案对比：评分尺度、权重占比、100 分结果及各项贡献；自动保存及 Markdown 导出。权重 0 不参与计算。
- 原有 12 篇决策练习保留短版和完整说明。收藏与决策记录仅存于本机。

## 来源与许可

参考作品：[高性价比人生指南](https://github.com/eternity4719/HowToLiveBetter)，作者 eternity4719。

同步日期：2026-10-05；版本：`bc149af3a02e721f0e3d03a673a0ec64fca765c4`。

导入正文遵循 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，完整许可在 `reference/LICENSE-CC-BY-4.0.txt`，文件清单在 `reference/manifest.json`。本站转换为 HTML，添加短简介、折叠阅读和本地导航；原条目的成本、收益、证据和引用保持原样。核实记录保留在上游仓库，本站保留导入正文已有的来源链接。

## 开发与发布

需要 Node.js 22.12+ 或 24+。

```sh
npm ci
npm run dev
npm run build
npm run preview
```

`content/*.html` 是可直接编辑的正文。构建自动生成目录、搜索索引及静态页面；全文搜索仅在使用时加载，首页不下载整本书。

维护入口：[AGENTS.md](AGENTS.md) · [docs/](docs/README.md)。阅读映射、架构、设计及分阶段发布方法都在文档中。

重新导入本地上游快照：

```sh
npm run import:reference -- --source=/path/to/HowToLiveBetter
```

提交前运行 `npm run build`、`npm run verify`，界面改动还需浏览器验收。验证覆盖原文、搜索、页面、锚点和文档链接。

Cloudflare Pages 已连接本仓库：推送 `main` 自动部署，构建命令 `npm run build`，输出目录 `dist`。
