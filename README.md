# obsidian-harness

> 为 Claude Code 精心整理的 Obsidian 技能集 — 工作流、笔记库整理与知识管理。

自研工作流 skills + 一键安装器 + 第三方技能依赖管理器。补充 [kepano/obsidian-skills](https://github.com/kepano/obsidian-skills) 未覆盖的工作流、组织与知识管理层。

## 为什么需要 obsidian-harness？

Obsidian + Claude Code 的组合很强大，但存在三层断裂：

**技能碎片化** — kepano 官方只管"格式"（markdown 语法、canvas 格式、CLI 命令），不管"工作流"。装了官方 skills 后，Claude 知道怎么写 wikilink，但不知道怎么整理一个乱糟糟的 vault、怎么自动生成日记、怎么管理项目笔记。

**安装门槛高** — 用户要自己找到各个 skill 仓库（官方的、可视化的、学习的），逐个安装，手动处理依赖关系。新手完全不知道从哪下手。

**无法进化** — 社区不断涌现新 skill（可视化、学习、记忆），但没有一个统一的地方去发现、集成、按需加载。

obsidian-harness 的定位：

```
kepano/obsidian-skills  →  格式层（怎么写 markdown、canvas、bases）
obsidian-harness        →  工作流层（怎么整理 vault、管理日记、跟踪项目）
```

三个核心设计理念：

- **一条命令，全部就绪** — `npx obsidian-harness init --vault ~/Vault` 自动安装自研 skill + 检测并安装官方依赖，无需理解底层机制
- **按需加载，不臃肿** — Profile 场景切换（默认 / 博客 / 项目 / 自定义），官方技能自动装，第三方技能按 `depends` 声明按需装
- **可进化的精选集** — `skill-registry.json` 是依赖字典，发现新的好 skill 加一条注册表项即可，安装器自动处理

## 快速开始

**首次安装**（自动安装官方技能 + 自研 skills + 部署行为画像）：

```bash
npx obsidian-harness init --vault ~/MyObsidianVault
```

如果在 vault 目录下运行，`--vault` 可以省略：

```bash
cd ~/MyObsidianVault && npx obsidian-harness init
```

**秒切场景**（不重装依赖，不覆盖行为画像）：

```bash
npx obsidian-harness switch blogging
npx obsidian-harness switch project
npx obsidian-harness switch learning
```

**在 Claude Code 内切换**（不退出终端）：

```
/profile
```

查看所有可用场景：

```bash
npx obsidian-harness profiles
```

跳过自动安装依赖（高级用户）：

```bash
npx obsidian-harness init --vault ~/MyObsidianVault --no-auto-deps
```

## 场景配置（Profiles）

每个场景是一个 `profiles/` 下的目录，包含：

- **`config.json`** — 加载哪些模块（技能动态组合）
- **`profile.md`** — 用户行为画像（Obsidian 使用习惯、命名风格、偏好语言等）

安装后，行为画像会部署到 `~/.claude/obsidian-harness/active-profile/profile.md`。Claude Code 每次使用 Obsidian 技能时会先读取此文件，确保操作符合你的习惯。

### 内置场景

| 场景 | 包含模块 | 说明 |
|------|---------|------|
| `default` | core + daily + project | 全能型笔记库管理 |
| `blogging` | core + daily | 博客写作、素材收集、文章草稿 |
| `project` | core + project | 软件开发项目、dev log、会议纪要 |
| `learning` | core + daily | 学习备考、知识整理、复习测验 |

### 自定义场景

在 `profiles/` 下新建目录，添加 `config.json` 和 `profile.md`：

```
profiles/
└── my-custom/
    ├── config.json      # { "modules": ["core", "daily"] }
    └── profile.md       # 你的使用习惯描述
```

然后安装：

```bash
npx obsidian-harness init --vault ~/Vault --profile my-custom
```

### 切换场景

```bash
npx obsidian-harness switch <name>   # 秒切，不重装依赖，不覆盖行为画像
```

## 技能列表

### core 模块

| 技能 | 说明 | 依赖 |
|------|------|------|
| `vault-organize` | 审计笔记库结构，生成 MOC（内容地图），规范化命名 | obsidian-markdown |
| `knowledge-manage` | 生成索引，整理标签体系，检测孤儿笔记与断链 | obsidian-markdown, obsidian-cli |

### daily 模块

| 技能 | 说明 | 依赖 |
|------|------|------|
| `daily-workflow` | 从模板创建日记，继承未完成任务，生成周报/月报 | obsidian-cli, obsidian-markdown |

### project 模块

| 技能 | 说明 | 依赖 |
|------|------|------|
| `project-notes` | 创建项目笔记，从 git 历史生成开发日志，记录会议纪要 | obsidian-markdown |

## 命令

| 命令 | 所属模块 | 说明 |
|------|---------|------|
| `/organize` | core | 审计并整理笔记库结构 |
| `/daily` | daily | 创建或打开今日日记 |
| `/review` | daily | 生成周报/月报回顾 |
| `/project` | project | 创建结构化项目笔记 |
| `/profile` | core | 切换场景（不退出终端） |

## 技能注册表

`skill-registry.json` 是依赖解析的字典，记录了每个技能的来源和安装方式：

- **official 类** — 首次安装时自动检测并安装，无需手动操作
- **其他类** — 当技能的 `depends` 声明需要时，按需自动安装

### 官方技能 (kepano/obsidian-skills)

自动安装，无需手动操作：

- **obsidian-cli** — 对运行中的 Obsidian 实例执行操作（搜索、读取、写入、属性、反向链接）
- **obsidian-markdown** — Obsidian 风格的 Markdown 语法（双向链接、嵌入、标注、属性）
- **obsidian-bases** — Obsidian Bases 数据库/查询系统（.base 文件）
- **json-canvas** — JSON Canvas 可视化画板（.canvas 文件）
- **defuddle** — 从网页中提取干净的 Markdown

### 可视化技能 (axtonliu/axton-obsidian-visual-skills)

按需安装 — 当技能声明依赖时自动安装：

```bash
npx skills add git@github.com:axtonliu/axton-obsidian-visual-skills.git
```

- **obsidian-canvas-creator** — 自动布局生成 .canvas 白板
- **mermaid-visualizer** — 安全语法生成 Mermaid 图表
- **excalidraw-diagram** — 生成手绘风格的 Excalidraw 图表

### 学习技能 (bevibing/tutor-skills)

按需安装 — 当技能声明依赖时自动安装：

```bash
npx skills add git@github.com:bevibing/tutor-skills.git
```

- **tutor-setup** — 将学习资料转为结构化笔记库
- **tutor** — 交互式测验与进度跟踪

## 开发

本项目本身就是一个 Obsidian 笔记库，开发文档遵循技能所要求的相同规范 — 吃自己的狗粮。

## 许可证

MIT
