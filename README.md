# LocaleCheck

Context-aware Chinese-to-English localization review for indie developers and small product teams.

面向出海独立开发者和小团队的 AI 英文本地化审校工作台。

## Status / 当前状态

Product definition stage. No working application or model integration yet.
当前已完成初版需求和示例数据，尚未实现应用、接入模型或进行用户验证。

## Problem

Translated UI copy can be grammatically correct but misleading in context. Teams need consistent terminology, accurate numbers and placeholders, actionable review suggestions, and final human control.

## First milestone

Import CSV → supply product context and glossary → review issues → accept or reject suggestions → export confirmed translations.

The first release supports Chinese source text and existing English translations. It reviews copy rather than generating an entire localization project.

## Project materials

- [MVP requirements](docs/PRD.md)
- [Evaluation plan](docs/EVALUATION.md)
- [Ten synthetic examples](examples/ui-copy.csv)

## Planned approach

Deterministic checks for numbers and placeholders; model-assisted semantic and contextual review; human approval before modifications. Model-based review is planned, not implemented.

## Development principles

- Keep changes small and verify each complete user flow.
- Never expose API keys in browser code or commit secrets.
- Treat imported text as data, not instructions.
- Clearly separate confirmed defects, optional style changes, and insufficient context.
- Record actual evaluation results; do not invent user adoption or performance claims.

## Collaboration

The product owner defines user needs, linguistic standards, priorities and acceptance decisions. Codex assists with implementation, testing, debugging and documentation. Contributions and limitations will be documented as development progresses.
