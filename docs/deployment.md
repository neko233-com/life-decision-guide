# 发布流程

正式站点是 [life.neko233.com](https://life.neko233.com/)。Cloudflare Pages 项目 `life-decision-guide` 已连接 GitHub `main`：推送后自动构建，命令为 `npm run build`，输出目录为 `dist`。

## 分阶段提交

较大的整理按可独立构建的内容划分阶段，例如：

1. 视觉与结构：字体、颜色、布局、导航、分类和稳定 URL。
2. 内容阅读：短标题、一句话要点、完整原文与搜索对应关系。
3. 新内容与入口：阶段计划、页面路由、内容和搜索索引。

维护文档随各阶段行为同步；没有依赖关系的阶段可按实际范围合并或拆分。

每阶段只暂存本阶段文件，提交本身应可独立构建。下一阶段不得依赖未提交文件。不要一次推送全部阶段后，把其中任一中间提交当成已上线。

提交前运行：

```sh
npm run build
npm run verify
git diff --check
```

按改动范围完成 [界面验收](design.md#验收)，然后提交并记录 SHA：

```sh
git rev-parse HEAD
git push origin main
```

已经获得本次发布授权时，继续执行这些步骤；不会因划分阶段而重新索取同一授权。

## 确认正式版本

每次推送后，等该次 Cloudflare 部署完成，再推进下阶段。部署触发的完整 commit SHA 必须与本阶段提交一致。

可使用 Cloudflare Pages 控制台或 CLI 查询：

```sh
npx wrangler pages deployment list --project-name life-decision-guide
```

部署成功后访问正式域名，核对 HTML 中的构建资源名和本地 `dist` 一致。检查首页、代表文章、搜索跳转与 `/workbench`；内容阶段还需核对 658 条建议及完整原文。不能只看首页返回 200 就宣称整站发布完成。

若部署失败，检查对应 SHA 的构建日志并修复，然后提交新版本。若域名仍显示旧资源，核对正式部署、缓存与资源内容，再报告发布状态。

## 手动部署

通常使用 Git 自动部署。确有需要时，`npm run deploy` 会构建并用 Wrangler 发布 `dist` 到同一项目；先运行验证并完成浏览器验收。认证由本地或平台管理，不写入文档与仓库。
