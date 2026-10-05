# 人生决策指南

把复杂的选择，拆成清晰的下一步。

线上站点：<https://life.neko233.com>

React 19 + Vite 8 构建的中文文档站，发布至 Cloudflare Pages。温和的米白与深绿配色、中文衬线标题、山径影像、响应式阅读界面。

## 已有功能

- 六个主题、12 篇原创 HTML 指南。
- 全文搜索（支持 Ctrl / ⌘ + K）、主题筛选与本机收藏。
- 文档侧栏、本篇目录、阅读进度、上一篇与下一篇。
- 决策工作台：问题、目标与底线、最多五个选项、三项可编辑比较标准及权重、小实验与复盘安排。
- 本机自动保存、Markdown 导出。记录与收藏不会发送到服务器。
- 22 个预渲染页面、独立标题与描述、canonical、Open Graph、sitemap 和真正的 404 页面。
- 键盘导航、减少动态效果偏好、打印样式与移动端适配。

## 本地使用

需要 Node.js 22.12+ 或 24+。

```sh
npm ci
npm run dev
npm run build
npm run preview
```

## 主要使用 HTML 编写正文

正文在 `content/*.html`，使用原生 HTML，无需 Markdown 或 MDX。页面导航与交互由 React 组件负责。

```html
<article data-slug="your-guide" data-category="thinking" data-order="13">
  <h1>指南标题</h1>
  <p class="lead">简介，同时作为列表摘要与页面描述。</p>
  <h2 id="first-step">第一步</h2>
  <p>正文，可以使用列表、引用、表格和链接。</p>
  <aside class="callout"><strong>提示</strong><p>补充说明。</p></aside>
</article>
```

主题 ID：`career`、`learning`、`relationships`、`living`、`energy`、`thinking`。`data-slug` 应唯一，使用英文字母、数字和连字符；`data-order` 决定排列顺序。构建脚本自动提取目录、搜索内容与阅读时间，将 React 页面预渲染为完整 HTML。

## 部署

Cloudflare Pages 项目名：`life-decision-guide`。生产分支：`main`。构建命令：`npm run build`。输出目录：`dist`。自定义域名：`life.neko233.com`。

已登录 Wrangler 时可以直接发布：

```sh
npm run deploy
```

认证信息只存在本地或 Cloudflare / GitHub 配置中，不应提交到仓库。若环境中的 `CLOUDFLARE_API_TOKEN` 缺少 Pages 权限，请使用有 Pages 权限的登录或令牌。

## 内容与图片来源

用户给出的参考地址为 `https://raw.githubusercontent.com/SKILL-CH/life-decision-guide`。截至 2026-10-05，该地址及对应 GitHub 仓库均返回 404；本版没有复制无法访问的参考内容，12 篇指南为原创思考与实践材料。

`public/images/mountain-path.webp` 由内置 Image Gen 生成并压缩为 WebP。图片提示词：薄雾中的青绿山脊与蜿蜒小径，自然克制的旅行摄影风格，无人物、文字与商标。首页视觉设计以同一主题的编辑式网页概念为依据，使用原生 HTML、CSS 与 React 重建，概念图不作为页面截图使用。

工作台的加权分用于梳理当前偏好，不能代替事实核实、责任与底线检查。

## 目录

```text
content/                 原生 HTML 正文
src/App.jsx              首页、指南列表、文档与搜索
src/Workbench.jsx        本地决策记录与比较
src/styles.css           全站样式与响应式规则
scripts/build-content.mjs HTML 内容编译
scripts/prerender.jsx    静态 HTML、SEO 与 sitemap
public/                  图片、图标与 Pages 响应头
wrangler.jsonc           Cloudflare Pages 配置
```
