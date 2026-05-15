# obsidian-harness

> 为 Claude Code 精心整理的 Obsidian 技能集 — 工作流、笔记库整理与知识管理。

## 一键安装

打开 Claude Code，进入你的 Obsidian vault 目录，复制粘贴这段提示词：

```
请帮我安装 obsidian-harness，我的 Obsidian vault 在当前目录下。执行 npx obsidian-harness init 完成安装，安装完成后告诉我装了哪些功能、怎么用。
```

Claude 会自动完成安装并引导你上手。

## 这是什么？

补充 [kepano/obsidian-skills](https://github.com/kepano/obsidian-skills) 未覆盖的工作流层：

```
kepano/obsidian-skills  →  格式层（怎么写 markdown、canvas、bases）
obsidian-harness        →  工作流层（怎么整理 vault、管理日记、跟踪项目）
```

## 装完怎么用？

安装完成后，在 Claude Code 里直接说你想做什么：

| 你说的话 | Claude 会做什么 |
|---------|----------------|
| "今天的日记" | 创建今日日记 `/daily` |
| "整理一下笔记库" | 审计并整理 vault `/organize` |
| "建个项目笔记" | 创建结构化项目 `/project` |
| "看看这周干了啥" | 生成周报 `/review` |
| "切换场景" | 切换 profile `/profile` |
| "vault 状态" | 查看 vault 概览 `/dashboard` |

也可以直接用斜杠命令：`/daily`、`/organize`、`/project`、`/review`、`/profile`、`/dashboard`。

## 场景（Profiles）

内置 4 个场景，用 `/profile` 切换：

| 场景 | 说明 |
|------|------|
| `default` | 全能型笔记库管理 |
| `blogging` | 博客写作、素材收集 |
| `project` | 软件开发项目、开发日志 |
| `learning` | 学习备考、知识整理 |

### 自定义场景

在 `profiles/` 下新建目录，添加 `config.json`、`profile.md` 和 `prompt.json`：

```
profiles/
└── writing-book/
    ├── config.json      # { "modules": ["core", "daily"] }
    ├── profile.md       # 场景画像：风格、习惯、偏好
    └── prompt.json      # skill → 专属 prompt 映射
```

- `profile.md`：自然语言描述你的习惯，Claude 每次执行前会先读它
- `prompt.json`：给特定 skill 注入专属提示词，让同一 skill 在不同场景下表现不同

然后告诉 Claude：`帮我切换到 writing-book 场景`。

## 最佳实践：多 Vault 工作流

如果你同时进行多种写作（写书、写博客、写专利、写项目文档），推荐的做法是**一个 Vault 做一件事，一个终端只管一个 Vault**：

### 步骤 1：为每种用途创建独立 Vault

```
~/vaults/
├── my-book/          # 写书专用
├── my-blog/          # 博客专用
├── my-patent/        # 专利专用
├── my-project/       # 项目文档专用
└── my-learning/      # 学习笔记专用
```

每个目录下都有 `.obsidian/`，在 Obsidian 中分别打开。

### 步骤 2：打开多个终端，分别进入对应目录

```
终端 1: cd ~/vaults/my-book && claude
终端 2: cd ~/vaults/my-blog && claude
终端 3: cd ~/vaults/my-patent && claude
终端 4: cd ~/vaults/my-project && claude
```

### 步骤 3：每个终端安装并切换到对应场景

```
# 终端 1（写书）
请帮我安装 obsidian-harness，然后切换到 writing-book 场景

# 终端 2（博客）
请帮我安装 obsidian-harness，然后切换到 blogging 场景

# 终端 3（专利）
请帮我安装 obsidian-harness，然后切换到 patent 场景
```

### 步骤 4：定制每个 Vault 的行为

每个 Vault 的 `prompt.json` 可以注入不同的风格：

```json
// ~/vaults/my-book 的 prompt.json
{
  "daily-workflow": "聚焦今日写作进度，记录章节推进和思路",
  "project-notes": "按章节结构组织，使用学术引用风格",
  "mermaid-visualizer": "正式技术架构图，深色主题"
}
```

```json
// ~/vaults/my-blog 的 prompt.json
{
  "daily-workflow": "记录今日写作灵感和素材收集",
  "project-notes": "按文章系列组织，使用轻松的语气"
}
```

### 步骤 5：越用越好

告诉 Claude 你的偏好，它会记住：

```
记住我喜欢用中文写笔记，技术术语用英文
记住"搞一下"的意思是深度分析和整理
记住我的常用流程是：收集素材 → 整理大纲 → 写作 → 画图
```

用 `/memory` 随时查看和更新你的偏好。

### 为什么这样做？

- **互不干扰**：每个 Vault 的模板、标签、索引完全独立
- **一次切换，永久生效**：每个终端只切一次 profile，后续直接用
- **自然积累**：每个 Vault 的记忆和偏好独立进化，越用越精准
- **灵活定制**：通过 `prompt.json` 和 `profile.md` 让同一个 skill 在不同 Vault 表现不同

## 技能列表

### 自研技能

| 技能 | 模块 | 说明 |
|------|------|------|
| `vault-organize` | core | 审计笔记库结构，生成 MOC，规范化命名 |
| `knowledge-manage` | core | 生成索引，整理标签，检测孤儿笔记与断链 |
| `daily-workflow` | daily | 创建日记，继承未完成任务，生成周/月报 |
| `project-notes` | project | 创建项目笔记，生成开发日志，记录会议纪要 |

### 依赖的官方技能（自动安装）

- **obsidian-cli** — 对运行中的 Obsidian 执行操作
- **obsidian-markdown** — Obsidian 风格 Markdown 语法
- **obsidian-bases** — Obsidian Bases 数据库系统
- **json-canvas** — JSON Canvas 可视化画板
- **defuddle** — 从网页提取干净的 Markdown

### 按需安装的社区技能

- [可视化技能](https://github.com/axtonliu/axton-obsidian-visual-skills) — Mermaid 图表、Excalidraw 图、Canvas 白板
- [学习技能](https://github.com/bevibing/tutor-skills) — 学习资料整理、交互式测验

## 开发

本项目本身就是一个 Obsidian 笔记库，开发文档遵循技能所要求的相同规范。

## 许可证

MIT
