# Persona — 架构设计文档

> 版本：v0.5.0 | 更新时间：2026-05-19

---

## 设计哲学

### 核心洞察

知识工作者不需要更多工具，需要的是**人格切换**。

写代码时你是工程师——追求精确、模块化、可测试。整理笔记时你是策展人——追求关联、结构、美感。写专利时你是发明人——追求新颖性、权利边界、技术效果。

每个角色对应不同的：
- **思考方式**（发散 vs 收敛）
- **行动模式**（快速迭代 vs 深思熟虑）
- **审美偏好**（简洁代码 vs 详尽文档）
- **工具使用**（Mermaid 图 vs Canvas 看板）

Persona 把这些隐性知识显性化，存成可切换的"人格切片"。

### 双钻石模型

所有知识工作本质上只有两种状态：

```
    发散 (Diverge)              收敛 (Converge)
    ┌─────────┐               ┌─────────┐
   /           \             /           \
  /    /um      \           /    /aha     \
 /               \         /               \
/     探索、外化   \       /   汇总、提炼    \
─────────────────────────────────────────────
        混乱                      清晰
```

- `/um` — 混乱时使用，帮你外化、拆解、发现方向
- `/aha` — 清晰时使用，帮你汇总、精炼、建议下一步

### 渐进蒸馏

不预设用户是谁。从使用中逐步浮现画像：

```
使用 → 纠正 AI → 存入 _memory → /distill → 精炼 _profile → 下次更懂你
     └── 重复 3+ 次 ──────────────────────────┘
```

---

## 系统架构

### 全局视图

```
┌─────────────────────────────────────────────────────────┐
│                    用户终端 (Claude Code)                  │
│                                                           │
│  /um  /aha  /go  /distill  /new  ← slash commands        │
└───────────────────────┬───────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│              ~/.claude/commands/*.md                      │
│         (symlinks → persona repo commands/)              │
│                                                           │
│  um.md │ aha.md │ go.md │ distill.md │ new.md            │
└───────────────────────┬───────────────────────────────────┘
                        │ 读取
                        ▼
┌─────────────────────────────────────────────────────────┐
│              ~/.claude/persona/ (仓库)                     │
│                                                           │
│  ├── scenes/daily/         ← 内置场景                     │
│  │   ├── manifest.json     ← 依赖声明                    │
│  │   └── prompts.json      ← 提示词 + actions            │
│  ├── scenes/coding/                                      │
│  ├── scenes/patent-writing/                              │
│  ├── scenes/patent-writing-en/  ← 继承示例               │
│  ├── registry.json         ← skill/mcp/plugin 注册表     │
│  ├── install.sh            ← 安装脚本                    │
│  └── CLAUDE.md             ← system prompt               │
└───────────────────────┬───────────────────────────────────┘
                        │ 运行时读取
                        ▼
┌─────────────────────────────────────────────────────────┐
│           {vault}/.persona/ (每个 vault 的本地状态)        │
│                                                           │
│  ├── active-scene.json     ← 当前激活场景                 │
│  ├── profile.md            ← 用户全局画像                 │
│  ├── contexts/{scene}.md   ← 场景上下文变量               │
│  └── scenes/*/             ← 用户自建场景                 │
└───────────────────────────────────────────────────────────┘
```

### 数据流

```
用户输入 "/um 架构设计"
       │
       ▼
┌── um.md Execution Flow ──┐
│ 1. 读 persona.json       │
│ 2. 读 active-scene.json  │ → 获取当前场景名（如 "coding"）
│ 3. 定位场景目录           │
│ 4. 读 prompts.json       │ → 继承解析（如果有 _extends）
│ 5. 读 contexts/coding.md │ → 场景上下文
│ 6. 读 profile.md         │ → 用户画像
│ 7. 组合 prompt           │
│ 8. 匹配 _actions trigger │ → "架构设计" 不匹配任何 trigger
└──────────────────────────┘
       │
       ▼  输入是 wikilink/笔记名 → Focus/Dive 模式
┌── Focus/Dive ────────────┐
│ 1. 读取目标笔记           │
│ 2. 识别可拆分的主题        │
│ 3. 展示结构图             │
│ 4. 询问用户深入方向        │
└──────────────────────────┘
```

---

## 场景系统

### 场景结构

每个场景由两个文件组成：

```
scenes/{name}/
├── manifest.json    ← 声明"我需要什么"
└── prompts.json     ← 声明"我怎么工作"
```

### manifest.json

```json
{
  "scene": "coding",
  "description": "编码文档 — 项目笔记、开发日志、会议纪要、代码文档",
  "requires": {
    "skills": ["obsidian-markdown", "obsidian-cli", "json-canvas"],
    "mcp": [],
    "plugins": []
  }
}
```

### prompts.json 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `_meta` | object | 场景元信息（name, description, author, version, tags） |
| `_extends` | string\|null | 继承的父场景名 |
| `_profile` | string | 场景级画像（AI 在此场景下的行为偏好） |
| `_um` | string | 发散模式的 prompt |
| `_aha` | string | 收敛模式的 prompt |
| `_memory` | array | 用户偏好记忆列表 |
| `_actions` | object | 场景专属动作（key = 动作名） |
| `_loop_template` | object\|null | 自主循环模板（未来版本） |
| `{skill-name}` | string | Skill overlay — 该场景下如何使用某个 skill |

### 继承机制

```
patent-writing-en → patent-writing
     子场景              父场景
```

合并规则：
- **标量字段**（`_um`, `_aha`, `_profile`, skill overlays）：子有值则覆盖；`null`/缺失则继承；`""` 则清除
- **对象字段**（`_actions`）：key-level merge — `{...parent, ...child}`；子 key 为 `null` 则删除该 action
- **数组字段**（`_memory`）：concat + 去重

manifest 依赖合并：
- `+` 前缀 → 追加到父列表（如 `"+defuddle"`）
- 无 `+` 前缀 → 完整替换父列表

限制：最多 3 层继承，自动循环检测。

---

## Prompt 组合顺序

执行 /um 或 /aha 时，AI 接收的 prompt 按以下顺序组合（优先级从高到低）：

```
1. Skill overlay     ← prompts.json 中 "{skill-name}": "..."
2. 场景 _profile     ← prompts.json._profile
3. 全局 profile      ← {vault}/.persona/profile.md
4. _memory 条目      ← prompts.json._memory 数组
5. Context 变量      ← {vault}/.persona/contexts/{scene}.md
```

Skill overlay 距离 AI 最近，优先级最高，不易被上下文截断。

---

## Token 负载分析

| 组件 | 大小 | 说明 |
|------|------|------|
| CLAUDE.md | ~1666 tokens | system prompt，每次对话都加载 |
| um.md | ~1239 tokens | /um 命令执行时加载 |
| aha.md | ~728 tokens | /aha 命令执行时加载 |
| go.md | ~1501 tokens | /go 命令执行时加载 |
| daily prompts.json | ~1555 tokens | 场景 prompt |
| coding prompts.json | ~1213 tokens | 场景 prompt |

**典型负载**：`/um` + daily 场景 + CLAUDE.md ≈ **4460 tokens**（占 200k 上下文的 **2%**）

---

## 文件路径约定

| 用途 | 路径 |
|------|------|
| 全局配置 | `~/.claude/persona.json` |
| 命令文件 | `~/.claude/commands/{cmd}.md` → symlink to repo |
| 内置场景 | `~/.claude/persona/scenes/{name}/` |
| 当前场景 | `{vault}/.persona/active-scene.json` |
| 场景上下文 | `{vault}/.persona/contexts/{scene}.md` |
| 用户画像 | `{vault}/.persona/profile.md` |
| 用户自建场景 | `{vault}/.persona/scenes/{name}/` |
| 依赖注册表 | `~/.claude/persona/registry.json` |

---

## 内置场景一览

| 场景 | Actions | Skills |
|------|---------|--------|
| `daily` | daily-note, weekly-review, health-check, generate-moc, split-note, dashboard | obsidian-markdown, obsidian-cli, obsidian-bases |
| `coding` | project-note, dev-log, meeting, architecture, canvas-map | obsidian-markdown, obsidian-cli, json-canvas |
| `patent-writing` | claim, prior-art, specification, patent-figure | obsidian-markdown, mermaid-visualizer |
| `patent-writing-en` | claim (覆盖) + 继承父的 3 个 | +defuddle |
