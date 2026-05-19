# DESIGN — 产品设计文档

> 草稿版本 v0.2 | 2026-05-18

---

## 一句话定位

**个人 AI 工作人格的版本管理系统。**

你不是在管理工具，你是在蒸馏自己——把"我在不同场景下怎么思考、怎么行动"变成可复用、可切换、可分享的人格切片。

---

## 哲学基础

### 知即是行（王阳明·知行合一）

传统工具链的问题：你知道怎么做，但每次都要重新组装。
本项目的解答：知与行合一——你的"知"（怎么用工具）直接变成"行"（AI 替你执行）。

### 双钻石模型（Double Diamond）

所有知识工作只交替两种状态：

```
     发散（/um）            收敛（/aha）
    ────╱╲────          ────╱╲────
       ╱    ╲              ╱    ╲
  混乱 → 结构           进度 → 清晰
```

- **脑子比笔记多** → 发散，外化混乱
- **笔记比脑子多** → 收敛，提炼清晰

不需要思考"该用哪个命令"，只需要感知当下的状态。**状态是本能，不需要记忆。**

### 场景即人格（Context = Identity）

你写专利时的你 ≠ 写博客时的你。
不是工具变了，是你的思维模式、审美偏好、行动习惯变了。
Scene 不是"工具集合"，是"你在某个角色下的完整工作人格"。

### 组合技封装（Combo System）

借鉴格斗游戏的连招系统：
- 单个 Skill = 单个招式
- Scene = 一套连招（固定组合 + 特定时机 + 个人风格）
- 同一招式在不同连招中的用法、力道、时机完全不同

---

## 解决的问题

### 现状痛点

1. **工具散落**：Skill、MCP、Plugin 各自独立，没有"场景化组合"
2. **提示词重复劳动**：每次用同一个 skill 都要重新描述"我要什么风格"
3. **人格碎片化**：你的使用习惯存在你脑子里，无法持久化、无法分享
4. **上下文切换成本高**：从写专利切到写博客，需要重新"热身"

### 现有方案的不足

| 现有方案 | 它做了什么 | 它没做什么 |
|---------|-----------|-----------|
| Claude Plugin | 打包分发能力 | 不管你怎么用 |
| Skill | 教 AI 做某事 | 不知道你的风格 |
| MCP | 给 AI 新工具 | 不知道何时用 |
| Profile | 存你的偏好 | 不按场景区分 |

**缺失的一层 = 编排 + 蒸馏：谁在什么场景下怎么组合使用这些能力。**

---

## 产品定位

```
┌─────────────────────────────────────────┐
│         本项目（编排 + 蒸馏层）          │
│  "我在某个角色下怎么组合使用这些能力"    │
├─────────────────────────────────────────┤
│    Plugin / Skill / MCP（能力层）        │
│  "AI 能做什么"                           │
├─────────────────────────────────────────┤
│    Claude Code / LLM（执行层）           │
│  "AI 怎么执行"                           │
└─────────────────────────────────────────┘
```

我们不是替代 Plugin/Skill/MCP，而是在它们之上提供：
- **编排**：哪些能力组合使用
- **蒸馏**：用什么风格、什么提示词
- **切换**：一键进入不同工作人格

---

## 核心概念

### Scene（场景 = 工作人格包）

一个 Scene 包含：

```
scenes/patent-writing/           ← 仓库中的场景定义（可分享）
├── manifest.json                ← 依赖声明：需要哪些 skill、MCP、plugin
├── prompts.json                 ← 所有提示词：skill overlay + um/aha + _actions
└── README.md                    ← 场景说明（供分享）

{vault}/.persona/                ← vault 本地（不分享）
├── contexts/
│   └── patent-writing.md        ← 该场景的关键变量 + 背景（跨会话持久）
└── profile.md                   ← 用户全局画像
```

### prompts.json（蒸馏核心）

```json
{
  "_meta": { "description": "专利撰写", "author": "xinhai" },
  "_profile": "我是技术专利撰写者...",
  "_um": "扫描专利草稿，识别技术方案完整性...",
  "_aha": "汇总专利进度，权利要求状态...",
  "mermaid-visualizer": "专利附图风格：方框图为主，编号标注...",
  "obsidian-markdown": "专利文档结构：技术领域→背景技术→..."
}
```

- `_` 前缀 = 场景级配置（profile、um、aha）
- 其余 key = skill overlay（同一 skill 在此场景下的专属提示词）

### 三个命令

| 命令 | 情绪 | 行为 |
|------|------|------|
| `/um` | 困惑、发散 | 读取场景 `_um` + `_profile` + `contexts/{scene}.md`，执行发散 |
| `/aha` | 顿悟、收敛 | 读取场景 `_aha` + `_profile` + `contexts/{scene}.md`，执行收敛 |
| `/go` | 切换 | 切换场景，触发 on-enter hook |
| `/distill` | 沉淀 | 精炼 `_memory` → 重写 `_profile`，越用越懂你 |

**命名冲突策略：** 安装时检测 `~/.claude/commands/` 下是否已存在同名文件。若冲突，交互式询问用户：
1. 覆盖（替换已有命令）
2. 重命名为 `persona-um` / `persona-aha` / `persona-go`
3. 跳过（用户自行处理）

**只维护一套文件**，不同时存在短名和全称两套。安装脚本根据用户选择决定最终文件名。

### 场景继承

```json
{
  "_extends": "patent-writing",
  "_profile": "覆盖：所有输出用英文...",
  "mermaid-visualizer": null
}
```

`null` = 使用父场景的值。只覆盖 delta，不重复。

---

## 架构设计

### Runtime 逻辑

```
/go patent-writing:
  1. 读 manifest.json → 检查依赖（skill/MCP/plugin）
  2. 缺失依赖 → 提示安装（地址在 registry.json）
  3. 读 prompts.json → 缓存所有 overlay
  4. 读 contexts/patent-writing.md → 注入关键变量
  5. 设置当前场景标记

/um (或 /aha):
  1. 读基础命令框架
  2. 追加 prompts.json["_um"] (或 "_aha")
  3. 追加 prompts.json["_profile"]
  4. 追加 contexts/{当前场景}.md
  5. 执行

调用 skill X:
  1. 如果 prompts.json[X] 存在 → prepend 到 skill prompt
  2. 执行 skill 本体
```

### 完整项目目录结构

```
persona/                              ← 仓库根目录
│
├── commands/                          ← 核心命令（安装到 ~/.claude/commands/）
│   ├── um.md                          ← 发散命令
│   ├── aha.md                         ← 收敛命令
│   ├── go.md                          ← 场景切换命令
│   └── distill.md                     ← 画像精炼命令
│
├── scenes/                            ← 内置场景
│   ├── daily/                         ← 日常场景
│   │   ├── manifest.json              ← 依赖声明
│   │   ├── prompts.json               ← 提示词（含 skill overlay + _actions）
│   │   └── README.md                  ← 场景说明
│   ├── coding/                        ← 编码文档场景
│   │   ├── manifest.json
│   │   ├── prompts.json
│   │   └── README.md
│   └── patent-writing/                ← 专利撰写场景（示例）
│       ├── manifest.json
│       ├── prompts.json               ← 含 _actions（claim、prior-art 等）
│       └── README.md
│
├── registry.json                      ← Skill/MCP/Plugin 安装源字典
├── install.sh                         ← 安装脚本（极简，< 50 行）
├── DESIGN.md                          ← 产品设计文档（本文件）
├── README.md                          ← 用户面向的说明
├── CLAUDE.md                          ← Claude Code 系统提示
└── package.json                       ← npm 发布用

─── 安装后的用户侧目录 ───

~/.claude/
├── commands/
│   ├── um.md → persona/commands/um.md              (symlink)
│   ├── aha.md → persona/commands/aha.md            (symlink)
│   ├── go.md → persona/commands/go.md              (symlink)
│   └── distill.md → persona/commands/distill.md    (symlink)
├── skills/                                    (第三方 skill 安装在这里)
│   ├── mermaid-visualizer/
│   ├── obsidian-markdown/
│   └── ...
└── persona.json                               ← 全局配置（当前活跃 vault 列表等）

─── Vault 本地目录 ───

{vault}/.persona/
├── active-scene.json              ← 当前场景标记（终端隔离）
├── profile.md                     ← 用户全局画像（跨场景）
├── contexts/                      ← 每个场景独立的关键变量
│   ├── patent-writing.md          ← patent 场景的变量和背景
│   ├── daily.md                   ← daily 场景的变量和背景
│   └── coding.md                  ← coding 场景的变量和背景
└── scenes/                        ← 用户自定义场景（不在仓库里）
    ├── blog-writing/
    │   ├── manifest.json
    │   └── prompts.json           ← 含 _actions（outline、publish 等）
    └── my-research/
        ├── manifest.json
        └── prompts.json           ← 含 "_extends": "coding"
```

### 配置隔离（多终端安全）

```
全局共享（无冲突）：
  ~/.claude/commands/um.md, aha.md, go.md
  ~/.claude/skills/*

Vault 本地（各管各的）：
  {vault}/.persona/
  ├── active-scene.json   ← 当前场景（终端隔离）
  ├── profile.md          ← 用户全局画像
  ├── contexts/           ← 每个场景独立的关键变量
  │   └── {scene-name}.md
  └── scenes/             ← 用户自定义场景
```

四个终端各自 cd 到不同 vault，各自有各自的 `active-scene.json`，天然隔离。

---

## 该做什么 / 不该做什么

### ✅ 该做

| # | 事项 | 理由 |
|---|------|------|
| 1 | prompts.json 统一存储场景提示词 | 结构化、可检索、易分享 |
| 2 | manifest.json 声明场景依赖 | 懒加载，进场景才检查 |
| 3 | scene 继承（_extends） | 90% 相同 10% 不同的场景太常见 |
| 4 | on-enter hook（检查依赖） | 缺啥装啥，用户无感 |
| 5 | context.md（关键变量） | 场景级持久变量，每次进场景自动注入 |
| 6 | skill overlay（同 skill 不同 prompt） | 这是核心差异化价值 |
| 7 | dry-run 模式 | 调试 prompt 必须的 |
| 8 | public/private 字段分离 | 为分享做准备 |

### ❌ 不该做

| # | 事项 | 理由 |
|---|------|------|
| 1 | Graph 依赖解析 | 场景依赖是平铺列表，不是 DAG |
| 2 | 版本约束系统 | 没有实际冲突问题 |
| 3 | 复杂 Module 系统 | 4 层抽象管 4 个文件是反模式 |
| 4 | 第三方场景市场 | 先自己用爽，生态是后面的事 |
| 5 | CLI 里的 fuzzy match | 花哨但不解决核心问题 |
| 6 | SessionStart 自动检查 | 侵入性太强，on-enter 够了 |
| 7 | 复杂安装脚本 | 10 行 shell 能搞定的别写 300 行 |

---

## 需要修改的内容（Action Items）

### 砍掉（从当前仓库中删除）

- [ ] `modules/` 目录 — 合并到 scenes
- [ ] `profiles/` 目录 — 合并到 `prompts.json._profile`
- [ ] `scripts/install.js`（300 行）— 替换为 < 50 行的 `install.sh`
- [ ] `.claude-plugin/plugin.json` — 不再作为 Claude Plugin 打包
- [ ] `scenes/*/config.json` — 替换为 `manifest.json`
- [ ] `scenes/*/profile.md` — 合并到 `prompts.json._profile`
- [ ] `Architecture.md` — 内容已合并到本 DESIGN.md
- [ ] `Roadmap.md` — 内容已合并到本 DESIGN.md

### 新建

- [ ] `commands/um.md` — 发散命令，读取当前场景 prompts.json 执行
- [ ] `commands/aha.md` — 收敛命令，读取当前场景 prompts.json 执行
- [ ] `commands/go.md` — 场景切换，执行 on-enter hook
- [ ] `commands/distill.md` — 画像精炼命令
- [ ] `scenes/daily/manifest.json` — 日常场景依赖声明
- [ ] `scenes/daily/prompts.json` — 日常场景提示词（含实际内容）
- [ ] `scenes/coding/manifest.json` — 编码场景依赖声明
- [ ] `scenes/coding/prompts.json` — 编码场景提示词（含实际内容）
- [ ] `scenes/patent-writing/manifest.json` — 专利场景依赖声明
- [ ] `scenes/patent-writing/prompts.json` — 专利场景提示词（含实际内容）
- [ ] `install.sh` — 极简安装脚本（检测冲突 + symlink）
- [ ] `registry.json` — 重写，增加 MCP、Plugin 类型支持

### 重写

- [ ] `README.md` — 按 persona 新定位重写
- [ ] `CLAUDE.md` — 按新命令体系（um/aha/go/distill + _actions 路由）重写
- [ ] `package.json` — name 改为 persona，更新 bin 入口

---

## 仓库命名：**persona**

荣格心理学的"人格面具"（Persona）——你在不同场景展示的不同面。

- 精准描述产品本质——不同场景切换不同人格面具
- `persona switch patent` 读起来自然
- 足够短，好打字
- 哲学有深度，但词本身大众能理解

---

## 场景继承设计

### 为什么需要继承

现实中场景之间 90% 相同、10% 不同：

```
patent-writing        → 中文专利，技术方案偏 AI
patent-writing-en     → 英文专利，其余一样
patent-writing-hw     → 华为格式的中文专利，多一些格式要求
```

不用继承 = 复制 3 份 prompts.json，改 2 行。维护噩梦。

### 继承机制

```json
// scenes/patent-writing-en/prompts.json
{
  "_extends": "patent-writing",
  "_meta": { "description": "英文专利撰写" },
  "_profile": "All output in English. Use USPTO claim format...",
  "_um": null,
  "_aha": null,
  "mermaid-visualizer": "Use English labels in all diagrams..."
}
```

**规则：**

| 字段值 | 含义 |
|--------|------|
| 有值 | 覆盖父场景的对应字段 |
| `null` | 显式使用父场景的值（不覆盖） |
| 不写这个 key | 同 `null`，继承父场景 |
| `""` (空字符串) | 显式清除，不使用父场景也不使用任何值 |

**继承链解析（Runtime 伪代码）：**

```
function resolvePrompts(sceneName):
  scene = loadScene(sceneName)
  if scene.prompts._extends:
    parent = resolvePrompts(scene.prompts._extends)  // 递归
    return merge(parent, scene.prompts)              // 子覆盖父
  return scene.prompts
```

**限制：**
- 最多 3 层继承（防止无限递归和可读性崩坏）
- `context.md` 不继承（运行时状态是 vault 实例级的）

### `_extends` 的统一来源

**`_extends` 只定义在 `prompts.json` 中**，是场景继承的唯一声明位置。manifest.json 通过读取 prompts.json 的 `_extends` 来确定父场景的依赖。

```
resolveScene("patent-writing-hw"):
  1. 读 patent-writing-hw/prompts.json → 发现 _extends: "patent-writing"
  2. 递归读 patent-writing/prompts.json → 合并 prompts
  3. 读 patent-writing-hw/manifest.json → 检查 requires 中的 "+" 前缀
  4. 若有 "+" 前缀项 → 去 parent 的 manifest.json 读依赖列表 → 合并
```

manifest.json 本身**不声明** `_extends`，而是通过 `+` 前缀语法隐式引用父场景的依赖。

### manifest.json 的依赖追加

子场景可以追加依赖：

```json
// scenes/patent-writing/manifest.json（父场景）
{
  "requires": {
    "skills": ["mermaid-visualizer", "obsidian-markdown", "vault-organize"],
    "mcp": [],
    "plugins": []
  }
}

// scenes/patent-writing-hw/manifest.json（子场景）
{
  "requires": {
    "skills": ["+hw-template-skill"],
    "mcp": ["+hw-doc-server"]
  }
}
```

**规则：**
- `+` 前缀 = 追加到父场景（由 prompts.json 的 `_extends` 确定）的依赖列表
- 无 `+` 前缀 = 完整替换该类别的依赖列表（不参考父场景）
- 子场景的最终依赖 = 父场景依赖 + 子场景追加项（去重）
- 如果 prompts.json 没有 `_extends`，则 `+` 前缀无效（无父可追加），等同于无前缀

---

## 场景分享设计

### 分享的核心矛盾

场景里既有"通用最佳实践"也有"个人隐私偏好"。分享时必须分离。

### Public / Private 字段约定

```json
// prompts.json 字段分类
{
  // ─── Private 字段（不分享）───
  "_profile": "我的个人习惯...",          // 个人画像
  "_memory": ["偏好1", "偏好2"],          // 个人记忆

  // ─── Public 字段（可分享）───
  "_meta": { "description": "..." },       // 场景描述
  "_um": "发散 prompt...",                  // 场景通用 um
  "_aha": "收敛 prompt...",                // 场景通用 aha
  "_actions": { "claim": {...} },          // 场景专属动作
  "_loop_template": {...},                 // 自主循环模板
  "mermaid-visualizer": "...",             // skill overlay
  "obsidian-markdown": "..."               // skill overlay
}
```

**约定：**
- `_profile`、`_memory` → Private，永远不分享
- `context.md` → 不在 prompts.json 中，由用户 vault 本地维护，不分享
- 其余所有字段 → Public，可分享

### Export / Import 流程

**Export（分享给别人）：**

```
persona export patent-writing --output ./patent-writing-scene.json
```

产出：
```json
{
  "_format": "persona-scene-v1",
  "_exported_at": "2026-05-18T20:00:00Z",
  "manifest": { /* 完整 manifest.json */ },
  "prompts": { /* prompts.json 去掉 private 字段 */ },
  "readme": "# 专利撰写场景\n\n适用于..."
}
```

**Import（从别人那里导入）：**

```
persona import ./patent-writing-scene.json
```

行为：
1. 创建 `scenes/patent-writing/` 目录
2. 写入 `manifest.json` 和 `prompts.json`（public 部分）
3. 生成空的 `_profile` 占位，提示用户填写个人偏好
4. 提示用户：「场景已导入。建议你填写 `_profile` 来添加你的个人风格。」

### 分享格式版本控制

```json
{
  "_format": "persona-scene-v1"
}
```

`_format` 字段确保未来格式变更时，旧版本的导入文件仍可被识别和迁移。

### 分享渠道（未来）

| 渠道 | 形式 | 适用场景 |
|------|------|---------|
| 文件 | `.json` 单文件 | 1v1 分享 |
| Git | 场景目录直接 push | 团队协作 |
| Registry | 社区场景索引 | 公开分享 |

近期只做文件级 export/import，其余是远期。

---

## contexts/{scene}.md 设计

### 存储位置

每个场景在 vault 本地有自己独立的 context 文件：

```
{vault}/.persona/contexts/
├── patent-writing.md    ← 专利场景的关键变量
├── daily.md             ← 日常场景的关键变量
└── coding.md            ← 编码场景的关键变量
```

场景隔离——切换场景时读取对应文件，不会互相污染。

### 是否需要自动保存/恢复？

**结论：不需要自动保存。** 理由：

1. Claude Code 已有 `/resume` 命令恢复上次会话，上下文天然保留
2. 用户习惯是每个 vault 开一个终端长驻，很少频繁切场景
3. 自动 aha 保存是"看起来酷但实际打扰用户"的功能
4. 过度自动化 = 不可控 = 用户不信任

### contexts/{scene}.md 的真正价值：关键变量 + 长期状态

context 文件不是"上次做到哪了"（那是 `/resume` 的事），而是 **跨会话持久的场景变量**——那些不会变的、每次进场景都需要知道的背景信息。

```markdown
# Context — Patent Writing

## 关键变量
- patent_id: CN2026XXXXX
- tech_field: 大语言模型提示词优化
- applicant: 阿里巴巴集团
- attorney: 张三（代理人编号 XXXXX）

## 场景背景
- 本专利是 AI Prompt 优化方向的第 3 篇系列专利
- 前 2 篇已授权：CN2025AAAAA、CN2025BBBBB
- 本篇重点：场景化提示词管理方法及系统

## 约束与规范
- 权利要求不超过 20 项
- 附图编号从 FIG.1 开始
- 必须包含至少一个方法权利要求和一个系统权利要求
```

### 谁来维护 context 文件？

| 方式 | 说明 |
|------|------|
| 用户手写 | 项目启动时自己填 |
| AI 辅助 | `/um` 时如果发现对应 context 文件为空或不存在，主动问用户关键变量 |
| 渐进积累 | 用户在对话中提到的关键信息，AI 建议"要不要存到 context？" |

**不做自动保存。context 文件是用户主动维护的"场景说明书"，不是自动生成的日志。**

---

## 场景专属动作（Scene Actions）

### 问题

某些场景需要超出 um/aha/go 三板斧的专属能力。比如：

- 专利场景：写权利要求、检索现有技术
- 博客场景：生成大纲、发布前检查
- 研究场景：添加引用、发现研究空白

### 为什么不用 Claude Commands？

Claude Code 的 `/commands` 是**静态文件**——安装后就一直存在，无法按场景动态激活/失活。如果每个场景都注册自己的命令：

- 5 个场景 × 3 个专属命令 = 15 个命令文件堆在 `~/.claude/commands/` 里
- 用户 tab 补全时看到一堆不相关的命令
- 切场景时频繁 symlink/unlink 又脆又慢

**结论：场景专属动作不用 commands 实现，而是通过 prompts.json 的 `_actions` 字段内联定义，由 `/um` 和 `/aha` 路由触发。**

### 设计：Actions 内联到 prompts.json

```jsonc
{
  "_actions": {
    "claim": {
      "description": "生成或优化权利要求书",
      "trigger": ["写权利要求", "claim", "权利要求"],
      "prompt": "读取 context.md 中的 patent_id。按专利局规范生成权利要求..."
    },
    "prior-art": {
      "description": "检索现有技术",
      "trigger": ["检索现有技术", "prior art", "现有技术"],
      "prompt": "在 vault 中搜索相关技术方案，对比当前发明点..."
    }
  }
}
```

### 触发方式

用户不需要记住命令名。三种触发路径：

| 方式 | 示例 | 行为 |
|------|------|------|
| 自然语言 | "帮我写权利要求" | intent match → `_actions.claim.prompt` |
| /um + 关键词 | `/um claim` | 发散模式 + action prompt |
| 直接说 action 名 | "claim" | 如果匹配到 trigger，执行 action |

### 为什么这样更好

1. **零额外文件** — actions 就在 prompts.json 里，一个场景一个文件
2. **天然跟场景走** — 切场景 = 换 prompts.json = actions 自动跟着换
3. **无需动态注册** — 不碰文件系统，不 symlink，不 unlink
4. **用户可自由扩展** — 在自己的 prompts.json 里加 `_actions` 字段即可

### /go 时展示可用 actions

`/go` 命令执行 on-enter hook 时，最后一步读取 `_actions` 并展示：

```
/go patent-writing:
  1. 读 manifest.json → 检查依赖
  2. 缺失依赖 → 提示安装
  3. 读 prompts.json → 缓存 overlay
  4. 读 contexts/patent-writing.md → 注入关键变量
  5. 读 prompts.json["_actions"] → 展示可用动作列表
  6. 设置 active-scene.json → 切换完成
  输出："当前场景：patent-writing。可用动作：claim（写权利要求）、prior-art（检索现有技术）"
```

用户看一眼就知道能干什么，但不需要记住任何新命令。

---

## 自主循环设计（/loop）

### 问题

用户想要持续迭代式创作：设定一个目标，AI 循环执行 发散→行动→收敛 直到完成。

> 注：不用 `/goal` 命名——Claude Code 已有同名概念，会冲突。用 `/loop` 表达"循环迭代"语义。

### 我们的立场：**预留接口，不急实现**

理由：

1. **Claude Code 本身的 agent loop 已经够用** — 给一个复杂指令，它会自己拆解执行
2. **真正的瓶颈不是循环，是判断** — AI 什么时候该停？什么算"完成"？这需要人类反馈
3. **无人值守的风险** — 写 30 页垃圾专利不如写 3 页好专利
4. **token 成本** — 一个 loop 跑 10 轮可能烧掉 $5-10

### 当前阶段的替代方案

不用 /loop，用户用自然语言就能做到类似效果：

```
用户："帮我写完这个专利的全部权利要求，独立3条从属7条。写完一条给我看一条。"
```

Claude Code 的 agent loop 天然支持这种迭代。我们不需要再包一层。

### 在 prompts.json 中预留字段

```jsonc
{
  "_loop_template": {
    "description": "完成专利全部权利要求",
    "steps": ["分析技术方案", "写独立权利要求", "写从属权利要求", "一致性检查"],
    "check": "每条权利要求都有技术特征递进",
    "max_rounds": 5
  }
}
```

字段现在可以定义在 prompts.json 里（方便场景设计者规划），但 runtime 暂不读取。等以下条件成熟再激活：

1. 有可靠的自动评估机制（不只是 AI 自己判断完成）
2. token 成本可预估且可控
3. 用户明确表达"我愿意放弃实时控制权"的场景确实存在

---

## 渐进蒸馏机制（Progressive Distillation）

### 问题

用户不会一次性把自己的画像写完美。好的画像是"用出来的"——在反复使用过程中，逐渐积累、修正、精炼。

### 蒸馏的三个层次

```
Layer 1: 全局画像（profile.md）     ← 跨场景的"我是谁"
Layer 2: 场景画像（prompts._profile）← 我在这个场景下的风格
Layer 3: 行为记忆（prompts._memory）← 具体的偏好指令
```

### 蒸馏触发时机

| 时机 | 行为 | 存到哪 |
|------|------|--------|
| 用户说"记住" | 立即保存 | `_memory` 数组 |
| 用户纠正 AI 输出 | 提示"要不要记住这个偏好？" | `_memory` 数组 |
| `/aha` 执行时 | 回顾本次会话，提取可沉淀的偏好 | 建议写入 `_profile` |
| 手动 `/distill` | 主动触发画像精炼 | 重写 `_profile` |

### `/distill` — 画像精炼命令

用户主动触发，AI 执行以下流程：

```
/distill:
  1. 读取当前 _memory 列表（可能有 20+ 条零散记忆）
  2. 读取当前 _profile
  3. 分析 _memory 中的模式：
     - 重复出现的偏好 → 提升到 _profile
     - 互相矛盾的 → 询问用户以哪个为准
     - 过时的 → 建议删除
  4. 输出重写后的 _profile 草稿
  5. 用户确认后写入
```

**类比：** _memory 是草稿纸上的便签条，_profile 是正式的自我介绍。`/distill` 是定期把便签条整理成正式文档的过程。

### _memory 的数据结构

```jsonc
{
  "_memory": [
    {
      "content": "我喜欢权利要求用「其特征在于」而不是「其中」",
      "source": "user_explicit",       // 用户明确说的
      "created": "2026-05-18",
      "scene": "patent-writing",
      "confidence": "high"
    },
    {
      "content": "画架构图时节点之间间距大一些",
      "source": "correction",          // 从纠正中推断
      "created": "2026-05-17",
      "scene": "patent-writing",
      "confidence": "medium"
    }
  ]
}
```

**简化版（v0.2 先用这个）：**

```jsonc
{
  "_memory": [
    "权利要求用「其特征在于」而不是「其中」",
    "画架构图时节点间距大一些",
    "独立权利要求不超过 150 字"
  ]
}
```

先用字符串数组，等量大了再升级为结构化格式。

### 全局画像 vs 场景画像

```
{vault}/.persona/profile.md      ← 全局："我是谁、我的通用习惯"
scenes/patent/prompts._profile   ← 场景："我写专利时的特殊风格"
```

**Runtime 合并顺序：**
```
最终画像 = 全局 profile.md + 场景 _profile + _memory
```

全局画像提供基础人设，场景画像覆盖场景特定部分，_memory 补充细节。

### 蒸馏的正向循环

```
使用 → AI 输出 → 用户纠正/确认 → 存入 _memory
                                         ↓
                              定期 /distill → 精炼 _profile
                                         ↓
                              下次使用时 AI 更懂你
```

**越用越懂你，但不是黑箱**——用户随时可以打开 prompts.json 看到"AI 记住了什么关于我的"，可以编辑、删除、重写。完全透明。

---

## 模拟真实使用场景 & 问题预判

### 场景 1：新用户首次安装

```
用户：npx persona init --vault ~/my-vault
```

**可能的问题：**
- prompts.json 全是空的，AI 不知道用户风格 → **解法：首次 /um 时主动问 3 个基础问题，写入 _profile**
- 用户不知道该用什么场景 → **解法：默认 daily，/go 时展示所有可用场景的一句话描述**

### 场景 2：用户想增加新场景

```
用户："我要加一个写书场景"
```

**流程：**
1. 在 `{vault}/.persona/scenes/book-writing/` 下创建 `prompts.json`
2. 可以从零写，也可以 `_extends: "blog-writing"` 继承一个
3. `/go book-writing` 即可使用

**可能的问题：**
- 用户不知道 prompts.json 怎么写 → **解法：`/um 帮我创建一个新场景` 引导式创建**
- 新场景缺少 skill overlay → **解法：先用着，AI 会用默认行为，用户纠正后存入 _memory，积累后 /distill**

### 场景 3：用户觉得 AI "不够懂我"

```
用户："你画的图风格不对，我说过很多次了"
```

**问题根因：** _memory 里可能有，但 AI 没读到（prompt 太长被截断）或格式不对

**解法：**
- `_memory` 超过 20 条时，`/distill` 提示用户精炼
- skill overlay 比 _memory 优先级高——如果某个偏好反复出现，应该提升到 overlay 里
- prompt 拼接时，skill overlay 放最前面（离 AI 最近 = 最不容易被忽略）

### 场景 4：多终端并发，同一场景

```
终端 1: ~/vault-a → /go patent-writing（专利 A）
终端 2: ~/vault-b → /go patent-writing（专利 B）
```

**无冲突：** 每个 vault 有自己的 `.persona/contexts/patent-writing.md`，里面的关键变量不同。场景相同，上下文不同。天然隔离。

### 场景 5：用户想给朋友分享场景

```
用户："把我的专利场景导出给同事"
```

**Export 时自动剥离：**
- `_profile`（个人风格）
- `_memory`（个人记忆）
- `context.md`（vault 本地关键变量，不在 prompts.json 中）

**保留：**
- `_meta`（场景描述）
- `_um` / `_aha`（场景通用行为）
- `_actions`（场景动作）
- `_loop_template`（循环模板）
- skill overlays（最佳实践）
- `manifest.json`（依赖）

### 场景 6：skill 更新后 overlay 失效

```
mermaid-visualizer 升级了，新增了 timeline 图类型
用户的 overlay 里没提到 timeline
```

**不是问题：** overlay 是"追加指导"不是"限制"。旧 overlay 不会阻止新功能。只有当 skill 的接口发生 breaking change 时才会有问题——但这种情况下任何方案都挡不住。

---

## 设计自检：还有什么问题？

### 已解决

| 问题 | 解法 |
|------|------|
| 全称/短名双文件维护 | 只维护一套，安装时询问 |
| 场景命令动态激活 | 不用 commands，用 _actions 内联 |
| /goal 命名冲突 | 改为 /loop，且暂不实现 |
| 画像如何越来越好 | 渐进蒸馏：_memory → /distill → _profile |
| context.md 是否自动保存 | 不自动，/resume 已够用 |

### 待验证（需要真实使用后回答）

| 问题 | 担忧 | 验证方式 |
|------|------|---------|
| prompts.json 会不会太长 | 20+ skill overlay + _memory 可能超 token | 真实场景测试 |
| _actions trigger 准确度 | 自然语言匹配可能误触发 | 真实场景测试 |
| 继承链可读性 | 3 层继承后人看不懂最终 prompt | 限制深度 + /go --dry-run |
| 首次使用引导体验 | 空 profile 时 AI 表现太通用 | 设计 onboarding flow |

### 边界问题（明确不解决）

| 问题 | 为什么不解决 |
|------|-------------|
| 多人同时编辑同一 vault 的 prompts.json | 这不是我们的场景，Obsidian vault 是个人工具 |
| 跨设备同步 | 用户用 git/iCloud 同步 vault 即可 |
| Skill 之间的执行顺序 | Skill 是独立的，不是 pipeline |
| prompt.json 的加密 | 文件在本地，无需加密 |

---

## Roadmap（修订版）

### v0.2 — 核心重构（当前目标）

- [ ] 砍掉 Module/Profile 系统，统一为 Scene
- [ ] 实现 `prompts.json` 统一存储 + skill overlay 注入
- [ ] 实现 `manifest.json` 依赖声明 + on-enter 检查
- [ ] 重写 3 个命令（um.md / aha.md / go.md），安装时检测冲突
- [ ] `_memory` 基础实现（字符串数组，"记住"触发）
- [ ] 手搓 2 个真实场景验证：daily + patent-writing
- [ ] 精简 install 脚本至 < 50 行
- [ ] README 按新定位重写
- [ ] 仓库更名为 `persona`

### v0.3 — 继承 + Actions + 蒸馏

- [ ] `_extends` 继承解析（prompts 合并、manifest 追加）
- [ ] `_actions` 内联动作 + intent 路由
- [ ] `/distill` 画像精炼命令
- [ ] `/go --dry-run` 调试模式
- [ ] 继承链深度限制 + 循环检测

### v0.4 — 分享

- [ ] `persona export` / `persona import` 命令
- [ ] Public/Private 字段自动分离
- [ ] `_format: persona-scene-v1` 版本标记
- [ ] 导入时的依赖检查 + 安装引导

### v0.5 — 打磨

- [ ] 5+ 个高质量内置场景（daily、coding、patent、blog、research）
- [ ] 场景 README.md 标准化
- [ ] 社区场景索引格式定义
- [ ] npm 发布

### v1.0 — 开放

- [ ] 社区场景 registry（类似 awesome-list）
- [ ] 场景推荐（根据 vault 内容 + 用户行为）
- [ ] 团队场景协作（共享 public，各自维护 private）
- [ ] `/loop` 自主循环（评估是否激活 `_loop_template`）
- [ ] 场景版本升级迁移

---

## prompts.json 完整字段规范

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

  // ─── 场景级 Prompt ───
  "_profile": "...",              // [Private] 我的个人画像和风格
  "_um": "...",                   // 此场景的发散行为定义
  "_aha": "...",                  // 此场景的收敛行为定义

  // ─── 用户记忆 ───
  "_memory": [                    // [Private] 用户告诉 AI 记住的东西
    "我喜欢用中文写专利",
    "权利要求书先写独立权利要求再写从属"
  ],

  // ─── 场景专属动作 ───
  "_actions": {
    "claim": {
      "description": "生成或优化权利要求书",
      "trigger": ["写权利要求", "claim", "权利要求"],
      "prompt": "读取 context.md 中的 patent_id。按专利局规范生成权利要求..."
    },
    "prior-art": {
      "description": "检索现有技术",
      "trigger": ["检索现有技术", "prior art", "现有技术"],
      "prompt": "在 vault 中搜索相关技术方案，对比当前发明点..."
    }
  },

  // ─── 自主循环模板（预留，暂不激活） ───
  "_loop_template": {
    "description": "完成专利全部权利要求",
    "steps": ["分析技术方案", "写独立权利要求", "写从属权利要求", "一致性检查"],
    "check": "每条权利要求都有技术特征递进",
    "max_rounds": 5
  },

  // ─── Skill Overlays ───
  "mermaid-visualizer": "专利附图风格：方框图为主...",
  "obsidian-markdown": "专利文档结构：技术领域→背景技术→...",
  "vault-organize": "按专利号分目录，每个专利一个 index note..."
}
```

**关键变量存储位置说明：** 场景级的关键变量（如 patent_id、tech_field）统一存储在 `{vault}/.persona/contexts/{scene-name}.md` 中（每个场景一个文件），不在 prompts.json 内。prompts.json 只存提示词和行为定义，contexts/*.md 存运行时状态数据。两者职责分明：
- `prompts.json` = "怎么做"（prompt、style、actions）
- `contexts/{scene}.md` = "在做什么"（当前项目、变量、背景）
```

---

## manifest.json 完整字段规范

```jsonc
{
  // ─── 元信息 ───
  "scene": "patent-writing",
  "description": "专利撰写场景依赖",

  // ─── 继承 ───
  "_extends": null,              // 父场景名（依赖追加用）

  // ─── 依赖声明 ───
  "requires": {
    "skills": [
      "mermaid-visualizer",
      "obsidian-markdown",
      "vault-organize"
    ],
    "mcp": [],                   // MCP server 名称
    "plugins": []                // Claude Plugin 名称
  },

  // ─── 安装源映射（覆盖 registry.json 的默认值）───
  "sources": {
    "hw-template-skill": {
      "install": "npx skills add git@github.com:corp/hw-skills.git",
      "url": "https://github.com/corp/hw-skills"
    }
  }
}
```

---

## active-scene.json 规范

存储在 `{vault}/.persona/active-scene.json`，标记当前 vault 激活的场景。

```jsonc
{
  "scene": "patent-writing",          // 当前激活的场景名
  "source": "builtin",                // "builtin"（内置场景）或 "local"（用户自建）
  "activated_at": "2026-05-18T20:00:00Z"
}
```

**读取优先级：** 当 `/um` 或 `/aha` 执行时，按以下顺序定位当前场景：
1. 读 `{cwd}/.persona/active-scene.json`（vault 本地）
2. 若不存在，默认使用 `daily` 场景
3. 若 scene 字段指向不存在的场景，报错并回退到 `daily`

**场景查找路径：**
1. `{vault}/.persona/scenes/{name}/` — 用户自建场景优先
2. `{persona-repo}/scenes/{name}/` — 内置场景兜底

---

## persona.json 规范

存储在 `~/.claude/persona.json`，全局配置文件。

```jsonc
{
  "version": "0.2.0",
  "installed_at": "2026-05-18T20:00:00Z",
  "repo_path": "/Users/xinhai/Desktop/project/persona",  // persona 仓库的绝对路径
  "vaults": [                                             // 已注册的 vault 列表
    {
      "path": "/Users/xinhai/vaults/daily",
      "scene": "daily"
    },
    {
      "path": "/Users/xinhai/vaults/patent",
      "scene": "patent-writing"
    }
  ],
  "command_names": {                                      // 实际安装的命令名（处理冲突后）
    "um": "um",
    "aha": "aha",
    "go": "go",
    "distill": "distill"
  }
}
```

**用途：**
- `repo_path`：命令执行时定位内置场景和 registry.json
- `vaults`：记录哪些 vault 使用了 persona（信息性，非强制）
- `command_names`：记录安装时实际使用的命令名（短名或全称）

---

## install.sh 设计

### 职责

安装脚本只做三件事：
1. 检测命令冲突并询问用户
2. 创建 symlink
3. 写入 `persona.json` 配置

### 完整逻辑

```bash
#!/bin/bash
# persona install script

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
CLAUDE_DIR="$HOME/.claude"
COMMANDS_DIR="$CLAUDE_DIR/commands"
CONFIG_FILE="$CLAUDE_DIR/persona.json"

mkdir -p "$COMMANDS_DIR"

# 定义要安装的命令
COMMANDS=("um" "aha" "go" "distill")

echo "persona — installing commands..."

for cmd in "${COMMANDS[@]}"; do
  TARGET="$COMMANDS_DIR/$cmd.md"
  SOURCE="$REPO_DIR/commands/$cmd.md"

  if [ -e "$TARGET" ] && [ ! -L "$TARGET" ]; then
    # 文件已存在且不是 symlink（用户自己的命令）
    echo ""
    echo "  ⚠ /$cmd already exists at $TARGET"
    echo "  Choose: [o]verwrite / [r]ename to persona-$cmd / [s]kip"
    read -r -p "  > " choice
    case "$choice" in
      o|O) rm -f "$TARGET" ;;
      r|R) TARGET="$COMMANDS_DIR/persona-$cmd.md" ;;
      s|S) echo "  Skipped /$cmd"; continue ;;
      *)   echo "  Skipped /$cmd"; continue ;;
    esac
  fi

  ln -sf "$SOURCE" "$TARGET"
  echo "  ✓ /$cmd → $TARGET"
done

# 写入全局配置
cat > "$CONFIG_FILE" << EOF
{
  "version": "0.2.0",
  "installed_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "repo_path": "$REPO_DIR",
  "vaults": [],
  "command_names": {
    "um": "um",
    "aha": "aha",
    "go": "go",
    "distill": "distill"
  }
}
EOF

echo ""
echo "  Config: $CONFIG_FILE"
echo ""
echo "Done! Restart Claude Code to activate."
echo "Then: cd <your-vault> && type /go daily"
```

### 不做什么

- 不安装 skill（进场景时按需安装）
- 不复制模板/规则到 vault（不需要了）
- 不做 dependency resolution（on-enter hook 做）
- 不做 fuzzy match（不需要了）

---

## on-enter Hook 设计

### 触发时机

`/go <scene-name>` 执行时，在切换完成前运行。

### 检查流程

```
on-enter(sceneName):
  1. manifest = loadManifest(sceneName)
  2. missing = checkDependencies(manifest.requires)
  3. if missing.length > 0:
       展示缺失列表
       询问："是否一键安装？(Y/n)"
       if Y: installFromRegistry(missing)
       if N: 提示手动安装命令，但仍切换场景
  4. context = loadContext(sceneName)  // 从 {vault}/.persona/contexts/{sceneName}.md 读取
  5. if context exists:
       将关键变量注入会话上下文
  6. actions = loadActions(sceneName)  // 从 prompts.json["_actions"] 读取
  7. if actions exists:
       输出可用动作列表
  8. 切换完成，设置 active-scene.json
```

### 检查内容

| 类型 | 检查方式 |
|------|---------|
| Skill | `~/.claude/skills/{name}/` 目录是否存在 |
| MCP | `~/.claude/mcp.json` 中是否有该 server 配置 |
| Plugin | `~/.claude/plugins/{name}/` 或对应配置是否存在 |

---

## 总结

这个产品的本质不是"管理工具"，而是 **"管理你自己的不同面"**。

每个场景都是你的一个工作人格——包含你用什么工具、怎么用、什么风格、什么习惯。切换场景就是切换人格面具。

**你不是在配置 AI，你是在蒸馏自己。**
