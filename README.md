# oh-my-god

> 你的笔记库太乱了？**ok, fuck, gun.** 就这三个词。

npm 包名 `obsidian-harness`，品牌名 **oh-my-god**。

和 [oh-my-zsh](https://github.com/ohmyzsh/ohmyzsh) 一个套路，但管的是你的 Obsidian 笔记库。

---

## 三个词，够了

你和 Claude 之间只需要三种情绪：

| 你心里想的 | 输入 | Claude 干什么 |
|-----------|------|-------------|
| 我改好了，你继续 | `/ok` | 检测 Obsidian 变更，接着上次的活干 |
| 这什么鬼，帮我搞 | `/fuck` | 自动判断：整理 / 理思路 / 结构化 |
| 滚到别的场景去 | `/gun xxx` | 切换 profile，加载专属命令 |

不用记更多了。别的自然说就行：
- "今天的日记" → 创建日记
- "记住我喜欢用中文" → 存到记忆
- "这周干了啥" → 生成周报

---

## 安装

打开 Claude Code，进入你的 vault 目录，粘贴：

```
帮我安装 obsidian-harness，执行 npx obsidian-harness init
```

装完。然后 `/ok` `/fuck` `/gun` 三连走起。

---

## 这是什么？

oh-my-god 补的是 [kepano/obsidian-skills](https://github.com/kepano/obsidian-skills) 不管的那一层：

```
kepano/obsidian-skills  →  格式层（怎么写 markdown、canvas、bases）
oh-my-god               →  工作流层（怎么整理 vault、管理日记、跟踪项目）
```

---

## 场景

每个场景有自己的命令和风格，`/gun xxx` 切换：

| 场景 | 说明 | 额外命令 |
|------|------|---------|
| `default` | 全能型 | `/organize` `/daily` `/review` `/project` |
| `blogging` | 写博客 | `/organize` `/daily` `/review` |
| `project` | 写代码 | `/organize` `/project` `/dashboard` |
| `learning` | 写笔记 | `/organize` `/daily` `/review` |

打错了也行，`/gun blog` 自动匹配到 `blogging`。

### 自建场景

```
profiles/
└── my-writing/
    ├── config.json      # { "modules": ["core", "daily"] }
    ├── profile.md       # 你的习惯、风格、偏好
    └── prompt.json      # skill → 专属 prompt
```

`/gun my-writing` 搞定。

---

## 推荐玩法：一个 Vault 一件事

同时写书、写博客、写专利？别混在一起：

```
终端 1: cd ~/vaults/my-book && claude    → /gun book
终端 2: cd ~/vaults/my-blog && claude    → /gun blog
终端 3: cd ~/vaults/my-patent && claude  → /gun patent
```

每个终端只干一件事，每个 Vault 独立进化，越用越懂你。

---

## 越用越好

```
记住我喜欢用中文写笔记，技术术语用英文
记住"搞一下"的意思是深度分析和整理
记住我的流程是：收集素材 → 整理大纲 → 写作 → 画图
```

说一次，以后每次都记着。

---

## 技能

### 自研

| 技能 | 说明 |
|------|------|
| `vault-organize` | 审计笔记库，生成 MOC，规范化命名 |
| `knowledge-manage` | 整理标签，检测孤儿笔记与断链 |
| `daily-workflow` | 日记、任务转办、周/月报 |
| `project-notes` | 项目笔记、开发日志、会议纪要 |

### 自动安装

- **obsidian-cli** — 对运行中的 Obsidian 执行操作
- **obsidian-markdown** — Obsidian 风格 Markdown
- **obsidian-bases** — Bases 数据库系统
- **json-canvas** — Canvas 可视化画板
- **defuddle** — 从网页提取干净 Markdown

### 按需安装

- [可视化](https://github.com/axtonliu/axton-obsidian-visual-skills) — Mermaid / Excalidraw / Canvas
- [学习](https://github.com/bevibing/tutor-skills) — 学习资料整理、交互式测验

---

## 许可证

MIT
