# Patent Writing — 专利撰写场景

技术方案文档化、权利要求书生成、现有技术对比、专利附图。

## 包含能力

- 权利要求书生成（独立 + 从属，自动检查递进关系）
- 现有技术检索对比（在 vault 内搜索已收集资料）
- 说明书章节生成（标准五段结构）
- 专利附图（Mermaid 方框图 + 流程图）

## 可用动作

- `claim` — 生成或优化权利要求书
- `prior-art` — 检索对比现有技术
- `specification` — 生成说明书章节
- `patent-figure` — 生成专利附图（Mermaid）

## 使用前提

建议先在 `.persona/contexts/patent-writing.md` 中填写关键变量：

- patent_id、tech_field、applicant、attorney 等
