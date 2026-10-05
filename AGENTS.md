# Repository guidance

人生决策指南使用 React 19 + Vite，正文以 HTML 保存，发布到 Cloudflare Pages。
维护目标：先让读者看懂一句话，再按需查看完整内容与依据。

## Setup and checks

使用 Node.js 24（最低 22.12），依赖由 `package-lock.json` 锁定。

```sh
npm ci
npm run dev
npm run build
npm run verify
npm run preview
```

`verify` 检查最近一次构建，先运行 `build`。界面改动还需浏览器验证。

## Read the relevant documentation

- 改目录、构建或搜索：读 [docs/architecture.md](docs/architecture.md)。
- 改原文、标题或一句话要点：读 [docs/content.md](docs/content.md)。
- 改界面或文案：读 [docs/design.md](docs/design.md)。
- 提交和发布：读 [docs/deployment.md](docs/deployment.md)。
- 编辑 `docs/` 时，额外读取 [docs/AGENTS.md](docs/AGENTS.md)。

普通文档不会因放进 `docs/` 而自动成为指令；按任务主动阅读。
嵌套 `AGENTS.md` 补充其目录的规则。层级说明参考 [官方文档](https://learn.chatgpt.com/docs/agent-configuration/agents-md)。

## Change rules

- 以源码、构建结果和实际行为为准；行为变化时同步对应文档。
- 原创正文编辑 `content/*.html`；参考作品短版编辑阅读映射，保留导入原文。
- 不手工修改 `src/generated/` 或 `dist/`；通过构建重新生成。
- 保持条目 ID、来源链接、作者署名、许可和已有 URL 可用。
- 保留全站搜索、方案加权评分、收藏和本机记录。
- 提交仅包含本阶段文件；每阶段均须可独立构建、验证与发布。
- 不把凭据、账户 ID、本机路径或个人决策记录写入仓库。

## Code Review Rules

- 标记删除参考条目、原文六字段或来源的改动；安全做法是只改显示层，并保留完整原文。
- 标记短文案丢失医疗禁忌、法律适用条件、期限或风险的改动；必要条件可突破文案建议长度。
- 标记把原文不确定说法改成确定结论的改动；保留条件与证据等级。
- 标记搜索漏掉原始标题或字段、锚点失效、折叠内容无法定位，以及首屏加载整本书的回归。
- 标记评分把零权重算入、产生 `NaN`、遗漏并列或损坏浏览器存档的回归。
- 标记仅凭构建成功就宣称发布完成的记录；核对部署触发 SHA 和正式域名的资源版本。

界面验收覆盖 1440px、390px、320px，键盘搜索、折叠阅读及评分；验证要求见对应文档。
