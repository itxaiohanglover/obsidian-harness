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
│  ├── scenes/research/      ← 原子场景                     │
│  │   ├── manifest.json     ← 依赖声明                    │
│  │   └── prompts.json      ← 提示词 + actions            │
│  ├── scenes/coding/                                      │
│  ├── scenes/learning/                                    │
│  ├── scenes/patent-writing/     ← 继承示例               │
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
| research prompts.json | ~1800 tokens | 场景 prompt |
| coding prompts.json | ~1213 tokens | 场景 prompt |

**典型负载**：`/um` + research 场景 + CLAUDE.md ≈ **4700 tokens**（占 200k 上下文的 **2%**）

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
| `research` | explore, collect, compare, synthesize, visualize | obsidian-markdown, obsidian-cli, defuddle, mermaid-visualizer |
| `coding` | project-note, dev-log, meeting, architecture, canvas-map, **visualize**, **excalidraw** | obsidian-markdown, obsidian-cli, json-canvas, mermaid-visualizer, excalidraw-diagram, obsidian-canvas-creator |
| `learning` | **setup-vault, quiz, progress, explain, flashcard** | obsidian-markdown, obsidian-cli, tutor-setup, tutor, mermaid-visualizer |
| `patent-writing` | claim, prior-art, specification, patent-figure (inherits: research) | +obsidian-markdown, +mermaid-visualizer |

---

## 完整字段规范

### prompts.json

```jsonc
{
  // ─── 元信息 ───
  "_meta": {
    "name": "patent-writing",
    "description": "专利撰写场景",
    "author": "xinhai",
    "version": "1.0.0",
    "tags": ["专利", "技术写作", "知识产权"]
  },

  // ─── 继承 ───
  "_extends": null,               // 父场景名，null = 无继承

  // ─── 场景级 Prompt（支持 @file 引用）───
  "_profile": "...",              // 我的个人画像和风格
  "_um": "@file:um-prompt.md",   // 发散行为定义（可内联或 @file）
  "_aha": "@file:aha-prompt.md", // 收敛行为定义（可内联或 @file）

  // ─── 用户记忆 ───
  "_memory": [                    // 用户告诉 AI 记住的东西
    "我喜欢用中文写专利",
    "权利要求书先写独立权利要求再写从属"
  ],

  // ─── 场景专属动作 ───
  "_actions": {
    "claim": {
      "description": "生成或优化权利要求书",
      "trigger": ["写权利要求", "claim", "权利要求"],
      "prompt": "读取 context.md 中的 patent_id..."
    }
  },

  // ─── 自主循环模板（预留，暂不激活） ───
  "_loop_template": null,

  // ─── Skill Overlays ───
  "mermaid-visualizer": "专利附图风格：方框图为主...",
  "obsidian-markdown": "专利文档结构：技术领域→背景技术→..."
}
```

**职责分界：**
- `prompts.json` = "怎么做"（prompt、style、actions）
- `contexts/{scene}.md` = "在做什么"（当前项目、变量、背景）

### manifest.json

```jsonc
{
  "scene": "patent-writing",
  "description": "专利撰写场景依赖",
  "requires": {
    "skills": ["mermaid-visualizer", "obsidian-markdown"],
    "mcp": [],
    "plugins": []
  },
  "sources": {                   // 覆盖 registry.json 的默认安装源
    "hw-template-skill": {
      "install": "npx skills add git@github.com:corp/hw-skills.git"
    }
  }
}
```

继承场景的 manifest 中，`+` 前缀表示追加到父列表：
```jsonc
{ "requires": { "skills": ["+defuddle"] } }  // 在父的基础上追加
```

### active-scene.json

存储在 `{vault}/.persona/active-scene.json`：

```jsonc
{
  "scene": "patent-writing",
  "source": "builtin",                // "builtin" 或 "local"
  "activated_at": "2026-05-18T20:00:00Z",
  "last_aha_at": "2026-05-18T22:30:00Z"  // /aha 更新
}
```

### persona.json

存储在 `~/.claude/persona.json`：

```jsonc
{
  "version": "0.5.0",
  "installed_at": "2026-05-18T20:00:00Z",
  "repo_path": "/Users/xinhai/.claude/persona",
  "vaults": [],
  "command_names": { "um": "um", "aha": "aha", "go": "go", "distill": "distill", "new": "new" }
}
```

### _memory 数据结构

当前使用简化版（字符串数组）：

```jsonc
{ "_memory": ["权利要求用「其特征在于」", "架构图节点间距大一些"] }
```

未来可升级为结构化格式（向后兼容）：

```jsonc
{
  "_memory": [
    { "content": "权利要求用「其特征在于」", "source": "user_explicit", "created": "2026-05-18" }
  ]
}
```

---

## 设计边界

### 明确不解决的问题

| 问题 | 原因 |
|------|------|
| 多人同时编辑同一 vault 的 prompts.json | Obsidian vault 是个人工具，非协作场景 |
| 跨设备同步 | 用户用 git/iCloud 同步 vault 即可 |
| Skill 之间的执行顺序 | Skill 是独立的，不是 pipeline |
| prompts.json 加密 | 文件在本地，无需加密 |
| 多终端并发场景隔离 | by design: 一个 vault 同一时刻只有一个活跃场景，多场景用多 vault |

### 已验证的设计决策

| 决策 | 理由 |
|------|------|
| _memory 先用字符串数组 | 简单够用，量大了再升级 |
| Skill overlay 放在 prompts.json 里而非独立文件 | 与场景绑定，切换即生效 |
| context.md 不自动保存 | 用户手动 + /aha 时间戳已够用 |
| _actions 用 trigger 关键词而非正则 | 降低配置门槛，精确匹配足够 |
| 最多 3 层继承 | 超过 3 层人类无法理解合并结果 |
