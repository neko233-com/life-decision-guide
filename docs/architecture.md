# 架构

网站使用 React 19 + Vite，先生成可直接阅读的静态 HTML，再在浏览器接上搜索、收藏和评分交互。

## 内容到页面

| 输入或步骤 | 用途 |
| --- | --- |
| `content/*.html` | 原创指南与导入参考原文 |
| `content/reading-guide.json` | 页面短标题、简介和补充文档要点 |
| `content/short-tips-01-12.json` | 第 1–12 章的一句话阅读映射 |
| `content/short-tips-13-34.json` | 第 13–34 章的一句话阅读映射 |
| `content/reading-groups.json` | 34 章的问题分组及稳定锚点 |
| `scripts/build-content.mjs` | 读取原文，组合短版、原文、目录和搜索数据 |
| `src/generated/` | 构建生成的数据，禁止手工编辑 |
| Vite + `scripts/prerender.jsx` | 编译资源，生成逐页 HTML、搜索索引和 sitemap |
| `dist/` | Cloudflare Pages 发布目录，禁止手工编辑 |

构建保留原始标题及六字段，把建议呈现为“短标题 → 一句话 → 依据与原文”。折叠改变阅读层级，完整内容仍留在页面 HTML 中。

## 浏览器交互

首屏 JavaScript 读取轻量文章元数据。文章正文来自预渲染 HTML；需要时通过 `/content/{slug}.html` 补取。

全站搜索首次打开时加载 `/search-index.json`，后续复用。索引包含原创全文、补充文档、章节附加说明、建议短版、原始标题和六字段。点击结果跳转到稳定锚点，展开命中条目和必要的原文。关键词高亮使用文本片段渲染。

`scoring.js` 计算加权平均，`Workbench.jsx` 显示评分尺度、权重占比、各项贡献和结果条。100 分制等于 5 分制乘 20；权重 0 不参与，评分 0 表示未填写。每个方案填完有效标准后显示自己的分数，全部完成后列出最高分及并列方案。仍读取 `life-guide-decision-v1` 浏览器记录；决策记录可导出为 Markdown。

## URL 与分类

六个分类在 `src/data.js` 定义。旧分类 `career`、`learning`、`relationships`、`living`、`energy`、`thinking` 映射到现有分类；`public/_redirects` 为旧分类 URL 保留 301 跳转。

文章 slug 与条目 ID 保持稳定。`prerender.jsx` 输出页面元数据、canonical、sitemap 和真实 404 页面。

## 修改后的检查

运行 `npm run build`，再运行 `npm run verify`。验证参考字段、条目、链接、搜索、元数据和文档链接。搜索或评分改动还需执行 [浏览器验收](design.md#验收)。
