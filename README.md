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

只需要记住 3 个命令，靠情绪驱动：

| 命令 | 你心里想的 | Claude 干什么 |
|------|-----------|-------------|
| `/ok` | "我改好了，你继续" | 读取 Obsidian 变更，接着上次的活干 |
| `/fuck` | "这什么鬼，帮我搞" | 自动判断：整理 / 理思路 / 结构化 |
| `/gun xxx` | "滚到 xxx 场景去" | 切换 profile，加载专属命令 |

不用记更多了。其他的都自然说：
- "今天的日记" → 自动创建日记
- "记住我喜欢用中文写笔记" → 自动存到记忆
- "这周干了啥" → 自动生成周报

## 场景（Profiles）

每个场景有自己的命令和风格。`/gun xxx` 切换：

| 场景 | 说明 | 加载的额外命令 |
|------|------|--------------|
| `default` | 全能型笔记库 | `/organize` `/daily` `/review` `/project` |
| `blogging` | 博客写作 | `/organize` `/daily` `/review` |
| `project` | 项目开发 | `/organize` `/project` |
| `learning` | 学习备考 | `/organize` `/daily` `/review` |

### 自定义场景

在 `profiles/` 下新建目录，添加 `config.json`、`profile.md` 和 `prompt.json`：

```
profiles/
└── writing-book/
    ├── config.json      # { "modules": ["core", "daily"] }
    ├── profile.md       # 场景画像：风格、习惯、偏好
    └── prompt.json      # skill → 专属 prompt 映射
```

切过去：`/gun writing-book`

## 最佳实践：多 Vault 工作流

如果你同时进行多种写作（写书、写博客、写专利、写项目文档），推荐**一个 Vault 做一件事，一个终端只管一个 Vault**：

### 步骤 1：为每种用途创建独立 Vault

```
~/vaults/
├── my-book/          # 写书专用
├── my-blog/          # 博客专用
├── my-patent/        # 专利专用
├── my-project/       # 项目文档专用
└── my-learning/      # 学习笔记专用
```

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
/gun writing-book

# 终端 2（博客）
/gun blogging

# 终端 3（专利）
/gun patent
```

### 步骤 4：定制每个 Vault 的行为

每个 Vault 的 `prompt.json` 注入不同风格：

```json
// ~/vaults/my-book 的 prompt.json
{
  "daily-workflow": "聚焦今日写作进度，记录章节推进和思路",
  "mermaid-visualizer": "正式技术架构图，深色主题"
}
```

### 步骤 5：越用越好

告诉 Claude 你的偏好，它会记住：

```
记住我喜欢用中文写笔记，技术术语用英文
记住"搞一下"的意思是深度分析和整理
记住我的常用流程是：收集素材 → 整理大纲 → 写作 → 画图
```

### 为什么这样做？

- **互不干扰**：每个 Vault 独立进化
- **一次切换，永久生效**：每个终端只 `/gun` 一次
- **越用越懂你**：每个 Vault 的记忆独立积累

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
