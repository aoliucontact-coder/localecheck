# LocaleCheck

Context-aware Chinese-to-English localization review for indie developers and small product teams.

面向出海开发者的中英文本地化审校工作台。导入 CSV，核对问题，确认修改，再导出。

## 当前能力

- CSV 导入：支持 UTF-8、带引号的逗号和换行，最多 100 条；拒绝重复 id 和不支持的列。
- 可解释的规则检查：数字、占位符、空译文、指定术语。
- 人工逐条编辑、确认或保留原译文；只有确认修改会影响导出。
- 标准 CSV 与表格安全版导出。
- 模型审校服务端接口：需要配置后才能使用；未配置时明确提示，不伪造结果。

规则检查不能验证完整语义。未发现规则问题不等于翻译准确。示例均为合成文案，尚无真实用户测试或准确率提升数据。

## 源码与试用

[打开私人试用版](https://localecheck-aoliu.w9gcghz2g9.chatgpt.site)（仅项目所有者可访问）。

[下载完整源码](localecheck-source.zip)，解压后得到 `app/` 文件夹。当前通过浏览器上传源码包，仓库尚未展开应用目录；源码包不含依赖、密钥或本地运行数据。

## 本地启动

需要 Node.js 22.13+ 和 pnpm。

```sh
cd app
pnpm install
pnpm dev
```

```sh
pnpm test
pnpm build
```

应用位于 `app/`；运行后打开终端显示的本地地址。先点击“体验示例”，再运行规则检查、修改译文、确认并导出。

## 可选 AI 接入

服务端使用兼容 chat-completions 的 HTTPS 接口，在运行环境中配置 `LLM_API_URL`（完整接口地址）、`LLM_MODEL` 和 `LLM_API_KEY`。参考 `app/.env.example`，本地使用框架支持的运行时变量配置；托管版本通过平台密钥管理配置。不要把真实密钥放入 GitHub 或浏览器代码。

只有主动点击 AI 审校才会发送当前文案、背景与术语表到模型服务。模型输出经过结构验证，仍需人工核对。真实模型调用尚未配置和验证。当前页面不持久保存工作，刷新前请导出。

## 产品与评测

- [第一版需求](docs/PRD.md)
- [产品决策](docs/DECISIONS.md)
- [评测计划](docs/EVALUATION.md)
- [验证记录](docs/VALIDATION.md)
- [用户访谈提纲](docs/USER-INTERVIEW.md)
- [十条合成案例](examples/ui-copy.csv)

## 协作与贡献

产品负责人决定用户问题、语言标准、优先级与验收。Codex 协助实现、调试、测试和文档。记录实际结果，不编造用户量、准确率或节省时间。
