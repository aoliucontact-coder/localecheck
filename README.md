# LocaleCheck 项目工作区

本项目用于继续开发 **LocaleCheck**：面向中国出海独立开发者和小团队的中英产品文案本地化审校工具。

后续开始产品设计、开发或评测前，请先阅读 [项目背景与当前共识](docs/PROJECT_BACKGROUND.md)。该文档记录了用户背景、产品定位、第一版范围、验证情况、风险与下一步优先级。

项目未来两个月的阶段目标、验收门槛、评测指标和开发流程见 [产品发展路线图](docs/ROADMAP.md)。路线图中的内容均为待实现目标，不能作为已经完成的成果对外表述。

## 当前功能

- 导入 UTF-8 CSV，支持 `id`、`source`、`target` 和可选的 `context` 列；
- 检查空译文、数字、占位符和术语一致性；
- 逐条编辑译文，并明确接受修改或保留原译文；
- 导出标准 CSV 或降低电子表格公式注入风险的安全版 CSV；
- 在配置兼容 Chat Completions 的模型服务后运行 AI 语义审校；
- 未配置模型服务时保留规则检查、人工编辑和导出能力。

当前版本仅在浏览器页面内保存工作状态，刷新页面会清空未导出的内容。仓库中的示例数据是合成数据，不代表真实用户材料或产品效果。

## 本地运行

要求 Node.js 22.13 或更高版本，并使用仓库锁文件对应的 pnpm。

```bash
pnpm install --frozen-lockfile
pnpm dev
```

开发服务器启动后，打开终端中显示的本地地址。可以点击“体验示例”，也可以导入 [示例 CSV](examples/ui-copy.csv)。

## 验证

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

以上命令分别运行核心逻辑测试、TypeScript 类型检查、静态检查和生产构建。功能或依赖发生变化后，应重新运行全部四项检查。

## CSV 格式

```csv
id,source,target,context
welcome_title,欢迎回来,Welcome back,登录后的首页标题
```

导入限制：

- 必须包含 `id`、`source` 和 `target` 列；
- 只允许额外使用 `context` 列；
- `id` 必须非空且唯一，`source` 不能为空；
- 每次导入 1—100 条，文件不超过 1 MB；
- 导入失败不会覆盖当前已经载入的数据。

## 可选 AI 审校配置

复制 `.env.example` 中的变量到本地环境配置，并填写兼容 Chat Completions 的 HTTPS 接口地址、模型名称和密钥：

```text
LLM_API_URL=
LLM_MODEL=
LLM_API_KEY=
```

不要把真实密钥提交到仓库。只有用户主动点击“AI 语义审校”后，当前文案、产品背景和术语表才会发送到所配置的模型服务。所有 AI 建议都必须经过人工确认才会进入导出文件。

## 项目文档

- [产品需求](docs/PRD.md)
- [产品决策](docs/DECISIONS.md)
- [验证记录](docs/VALIDATION.md)
- [评测计划](docs/EVALUATION.md)
- [用户访谈提纲](docs/USER-INTERVIEW.md)
- [项目背景与当前共识](docs/PROJECT_BACKGROUND.md)
- [产品发展路线图](docs/ROADMAP.md)
- [第一周工程基线记录](docs/WEEK1-ENGINEERING-BASELINE.md)
- [用户研究执行目录](docs/research/README.md)
