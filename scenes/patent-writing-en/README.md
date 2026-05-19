# Patent Writing (English) — USPTO 专利撰写

继承 `patent-writing` 场景，所有输出改为英文，使用 USPTO 格式。

## 继承关系

patent-writing-en → patent-writing

## 与父场景的差异

- `_profile`: 强制英文输出 + USPTO 格式
- `_actions.claim`: 覆盖为 USPTO claim 格式
- `mermaid-visualizer` overlay: 英文标签
- 新增依赖: defuddle（用于抓取英文专利文档）
- `_um`, `_aha`: null（继承父场景）

## 最终合并结果（/go patent-writing-en --dry-run 可查看）

- `_um` → 来自 patent-writing（父）
- `_aha` → 来自 patent-writing（父）
- `_profile` → "All output must be in English..."（子覆盖）
- `_actions.claim` → USPTO 格式（子覆盖）
- `_actions.prior-art` → 来自 patent-writing（父，子未覆盖）
- `_actions.specification` → 来自 patent-writing（父）
- `_actions.patent-figure` → 来自 patent-writing（父）
- `mermaid-visualizer` → 英文标签（子覆盖）
- 依赖 → obsidian-markdown + mermaid-visualizer（父）+ defuddle（子追加）
