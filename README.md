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

在 `profiles/` 下新建目录，添加 `config.json` 和 `profile.md`：

```
profiles/
└── my-writing/
    ├── config.json      # { "modules": ["core", "daily"] }
    └── profile.md       # 你的使用习惯描述
```

然后告诉 Claude：`帮我切换到 my-writing 场景`。

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
