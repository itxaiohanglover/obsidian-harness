# 开发计划 — persona v0.2

> 基于 DESIGN.md，对照当前代码，分步实施。
> 每步完成后测试验证，再进入下一步。

---

## 当前仓库状态（现状）

```
需删除：
├── modules/                       ← 整个目录（内容已提取，迁移到 scenes prompts.json）
├── scenes/coding/{config.json, profile.md, prompt.json}  ← 旧格式
├── scenes/daily/{config.json, profile.md, prompt.json}   ← 旧格式
├── scripts/install.js             ← 300行，替换为 <50 行的 install.sh
├── .claude-plugin/plugin.json     ← 不再作为 plugin 打包
├── skill-registry.json            ← 重写为 registry.json
├── skills-lock.json               ← 不再需要
├── Architecture.md                ← 已合并到 DESIGN.md
└── Roadmap.md                     ← 已合并到 DESIGN.md

保留不动：
├── .agents/skills/*               ← obsidian 官方 skills（仓库自带，不动）
├── .claude/settings.local.json    ← IDE 本地配置
├── .github/*                      ← CI/issue 模板
├── .obsidian/plugins/.gitkeep     ← vault 占位
├── docs/.gitkeep                  ← 文档占位
└── DESIGN.md                      ← 设计文档

modules/ 内容迁移去向：
├── modules/daily/commands/um.md       → 提取 prompt 逻辑到 scenes/daily/prompts.json._um
├── modules/daily/commands/aha.md      → 提取到 scenes/daily/prompts.json._aha
├── modules/daily/commands/go.md       → 逻辑重写到 commands/go.md（新架构）
├── modules/daily/skills/vault-organize    → 提取到 scenes/daily/prompts.json["vault-organize"]
├── modules/daily/skills/daily-workflow    → 提取到 scenes/daily/prompts.json["daily-workflow"] + _actions
├── modules/daily/skills/knowledge-manage  → 提取到 scenes/daily/prompts.json["knowledge-manage"]
├── modules/daily/rules/obsidian-conventions.md → 融入 scenes/daily/prompts.json._um/_aha
├── modules/daily/templates/{daily,weekly-review}.md → 融入 daily-workflow 的 _actions prompt
├── modules/project/skills/project-notes   → 提取到 scenes/coding/prompts.json["project-notes"]
└── modules/project/templates/{meeting,project}.md → 融入 project-notes 的 _actions prompt
```

---

## 实施步骤

### Step 1：清理旧结构

删除不再需要的文件和目录：

```bash
rm -f Architecture.md Roadmap.md skills-lock.json
rm -rf .claude-plugin/
rm -f scripts/install.js && rmdir scripts/
rm -f scenes/coding/config.json scenes/coding/profile.md scenes/coding/prompt.json
rm -f scenes/daily/config.json scenes/daily/profile.md scenes/daily/prompt.json
```

**验证：**
```bash
# 以下命令应无输出
find . -name "config.json" -path "*/scenes/*"
find . -name "profile.md" -path "*/scenes/*"
ls .claude-plugin 2>&1 | grep "No such"
ls scripts 2>&1 | grep "No such"
```

---

### Step 2：创建核心命令

创建 `commands/` 目录，编写 4 个命令文件。每个命令是一个 Claude Code custom command（markdown 格式的 system prompt）。

#### commands/um.md 结构

```markdown
# 核心职责
发散模式 — 外化混乱，发现方向。

# 执行流程
1. 读 ~/.claude/persona.json → 获取 repo_path
2. 读 {cwd}/.persona/active-scene.json → 获取当前场景名
   - 不存在则默认 daily
3. 定位场景目录（先查 {cwd}/.persona/scenes/{name}/ 再查 {repo}/scenes/{name}/）
4. 读 prompts.json → 提取 _um、_profile、_memory、_actions
5. 读 {cwd}/.persona/contexts/{scene}.md → 注入关键变量
6. 读 {cwd}/.persona/profile.md → 注入全局画像
7. 组合执行：全局画像 + 场景画像 + _um prompt + context 变量 + _memory
8. 如果用户输入匹配 _actions 的 trigger → 执行对应 action prompt

# 行为定义（无输入时）
扫描 vault，发现方向：孤儿笔记、未完成任务、过期内容。
呈现 2-3 个选项让用户选择，不主动行动。

# 行为定义（有输入时）
输入视为目标，进入发散分析：
- 项目名 → 分析笔记缺口，重构结构
- 时间范围 → 收集该时段内容，发现主题
- 文本块 → 提取关键想法，追问 2-3 个问题后组织

# 规则
- 先诊断再行动（一句话说发现了什么）
- 不过度组织，保留用户原始表达
- 脑暴类输入先追问，不假设
- 完成后一句话确认结果
```

#### commands/aha.md 结构

```markdown
# 核心职责
收敛模式 — 汇总进度，提炼清晰，建议下一步。

# 执行流程
（同 um.md 的 1-7 步，读取 _aha 而非 _um）

# 行为定义（无输入时）
个人站会：
1. 扫描最近 24h 修改的 .md 文件
2. 一句话总结进度
3. 建议一个下一步行动

# 行为定义（有输入时）
输入视为范围修饰：
- 时间范围 → 总结该时段产出
- 项目名 → 项目状态报告
- "今天的日记" → 检查未完成任务和跟进事项

# 蒸馏检查（每次执行末尾）
回顾本次会话，如果发现用户纠正了 AI 输出或表达了偏好：
- 提示："要记住这个偏好吗？"
- 若用户确认 → 追加到 prompts.json._memory 数组

# 规则
- 一次扫描，一次回复，快速
- 简短，像接续对话
- 使用用户的语言
- 如果用户在做某事中途调用，续做而非只总结
```

#### commands/go.md 结构

```markdown
# 核心职责
切换场景，执行 on-enter hook。

# 执行流程
1. 解析参数：/go <scene-name>（无参数则列出可用场景）
2. 检测 vault：cwd 下是否有 .obsidian/（不是则报错）
3. 定位场景（先 {cwd}/.persona/scenes/ 再 {repo}/scenes/）
4. 读 manifest.json → 检查 requires
5. 对每个依赖：
   - skill → 检查 ~/.claude/skills/{name}/ 是否存在
   - mcp → 检查 ~/.claude/mcp.json 中是否有配置
   - 缺失 → 从 registry.json 找安装命令，提示用户
6. 读 prompts.json → 缓存（确认格式正确）
7. 读 {cwd}/.persona/contexts/{scene}.md
   - 不存在 → 提示用户创建，给出模板
8. 读 prompts.json._actions → 提取动作列表
9. 写入 {cwd}/.persona/active-scene.json
10. 输出确认：
    "✓ 已切换到 {name}。"
    "可用动作：{action1}（描述）、{action2}（描述）"
    如果 context 为空："💡 建议填写 .persona/contexts/{name}.md 添加关键变量"

# 无参数时
列出所有可用场景（内置 + 用户自建），每个一句话描述。

# 模糊匹配
精确 > 前缀 > 编辑距离 ≤ 2。如 "code" 匹配 "coding"。
```

#### commands/distill.md 结构

```markdown
# 核心职责
精炼用户画像 — 从零散记忆中提炼结构化偏好。

# 执行流程
1. 读 active-scene.json → 获取当前场景
2. 读 prompts.json._memory → 获取记忆列表
3. 读 prompts.json._profile → 获取当前画像
4. 分析 _memory 中的模式：
   - 重复出现 3+ 次的偏好 → 建议提升到 _profile
   - 互相矛盾的 → 列出并询问用户
   - 过时的（> 30 天且仅出现 1 次）→ 建议删除
5. 生成重写后的 _profile 草稿
6. 展示 diff（旧 vs 新），等待用户确认
7. 用户确认 → 写入 prompts.json._profile，清理已提升的 _memory 条目

# 无 _memory 时
提示："当前没有积累的记忆。使用 /um 或 /aha 时，AI 会逐渐记住你的偏好。"

# 规则
- 必须展示变更并获得确认才能写入
- 不删除用户未同意删除的记忆
- _profile 重写后保持简洁（不超过 500 字）
```

**验证：** 每个文件包含完整的"执行流程"和"行为定义"，无占位符

---

### Step 3：编写内置场景 — daily

#### scenes/daily/manifest.json

```json
{
  "scene": "daily",
  "description": "日常笔记管理 — 日记、知识库维护、vault 整理",
  "requires": {
    "skills": ["obsidian-markdown", "obsidian-cli"],
    "mcp": [],
    "plugins": []
  }
}
```

#### scenes/daily/prompts.json

```jsonc
{
  "_meta": {
    "name": "daily",
    "description": "日常笔记管理：日记、知识库健康、vault 组织",
    "author": "persona",
    "version": "0.2.0",
    "tags": ["日常", "笔记", "知识管理"]
  },
  "_extends": null,
  "_profile": "",
  "_um": "发散模式 — 外化混乱，发现方向。\n\n## 无输入时\n扫描 vault 发现方向：\n1. 找孤儿笔记（无反向链接）、未打标签笔记、超过 30 天未更新的笔记、断链\n2. 呈现 2-3 个方向性问题（不是解决方案）：\n   - \"你有 N 个未打标签的笔记，要整理吗？\"\n   - \"项目X的笔记上次更新是N天前，要跟进吗？\"\n   - \"最近写了 N 篇零散想法，要合并？\"\n3. 等用户选择，不主动行动\n\n## 有输入时\n输入视为目标：\n- 项目名 → 分析该项目笔记缺口，重构结构\n- 时间范围 → 收集该时段内容，发现主题\n- 主题名 → 新探索，构建初始框架，列核心概念\n- 文本块 → 脑暴外化，提取关键想法，追问 2-3 个问题后组织\n\n## 诊断分类\n- 无组织 → 有结构但格式乱，清理\n- 脑暴 → 无结构，先追问再重构\n- 混合主题 → 拆分为独立笔记并互链\n- 接近完成 → 快速修缮\n\n## 规则\n- 先诊断再行动（一句话说发现了什么）\n- 不过度组织，保留用户原始表达\n- 脑暴类先追问，不假设\n- 完成后一句话确认：\"Done. Split into 3 notes: [[A]], [[B]], [[C]].\"",
  "_aha": "收敛模式 — 汇总进度，提炼清晰，建议下一步。\n\n## 无输入时（个人站会）\n1. 扫描最近 24h 修改的 .md 文件（排除 .obsidian/、.agents/）\n2. 一句话总结：\"你这周写了 N 篇笔记，完成了 N 个任务，项目X还差Y部分\"\n3. 建议一个下一步行动\n\n## 有输入时\n输入视为范围修饰：\n- \"最近一周\" → 总结本周产出，生成周报\n- 项目名 → 项目状态：已完成/进行中/风险项\n- \"今天的日记\" → 检查未完成任务和跟进事项\n- 其他文本 → 总结 vault 中与该主题相关的一切\n\n## 规则\n- 一次扫描，一次回复，快速\n- 简短，像接续对话\n- 使用用户的语言\n- 如果用户在做某事中途调用，续做而非只总结",
  "_memory": [],
  "_actions": {
    "daily-note": {
      "description": "创建或打开今日日记",
      "trigger": ["日记", "daily", "今天", "daily note"],
      "prompt": "创建今日日记：\n1. 检查 {YYYY-MM-DD}.md 是否存在\n2. 不存在则用模板创建：frontmatter(created, tags:[daily-log]) + ## Tasks + ## Notes + ## Highlights + 导航链接\n3. 替换模板变量：{{date}}, {{weekday}}, {{prev_day}}, {{next_day}}\n4. 查找昨日未完成任务（- [ ]），填入 {{yesterday_unfinished}}\n5. 存在则直接打开"
    },
    "weekly-review": {
      "description": "生成周报/周回顾",
      "trigger": ["周报", "weekly review", "本周总结", "weekly"],
      "prompt": "生成周报：\n1. 收集过去 7 天的 daily notes\n2. 提取：已完成任务(- [x])、未完成任务(- [ ])、Highlights、Notes\n3. 生成 Weekly Review {YYYY}-W{WW}.md：Summary + Accomplishments + Carry-over Tasks + Key Insights + Highlights\n4. 链接到所有被引用的 daily notes"
    },
    "health-check": {
      "description": "vault 健康检查",
      "trigger": ["健康检查", "health", "审计", "audit", "知识管理"],
      "prompt": "执行 vault 健康报告：\n1. 统计：总笔记数、总标签数、孤儿笔记数、断链数、每笔记平均链接数\n2. 检测：相似标签（如 #react vs #reactjs）、未使用标签、大小写不一致\n3. 发现：hub 笔记（最多反向链接）、孤立簇\n4. 输出一页报告，给出 top 3 改善建议"
    },
    "generate-moc": {
      "description": "生成主题索引（Map of Content）",
      "trigger": ["索引", "MOC", "目录", "index", "生成索引"],
      "prompt": "生成 MOC：\n1. 询问用户主题（或从输入推断）\n2. 搜索 vault 中相关笔记（按标签、内容关键词、文件名）\n3. 创建或更新 {Topic} Index.md：## Core Concepts + ## Related\n4. 使用 [[wikilinks]] 链接所有相关笔记\n5. 命名规范：Title Case，后缀 Index"
    }
  },
  "_loop_template": null,
  "obsidian-markdown": "笔记命名：Title Case。Frontmatter 必含 created + tags。用 [[wikilinks]] 组织而非文件夹。Index/MOC 用 {Topic} Index.md 命名。日记用 YYYY-MM-DD.md。",
  "obsidian-cli": "优先用 obsidian-cli 操作 vault（search、read、write）。Obsidian 未运行时回退到直接文件操作。Daily note 路径检测：先找 Daily/ 文件夹，再找 vault 根目录。"
}
```

#### scenes/daily/README.md

```markdown
# Daily — 日常笔记管理场景

日记创建、任务流转、知识库维护、vault 健康检查。

## 包含能力
- 日记工作流（创建、任务滚动、周报）
- 知识库健康（孤儿检测、断链修复、标签审计）
- Vault 组织（MOC 生成、命名规范化）

## 可用动作
- `daily-note` — 创建/打开今日日记
- `weekly-review` — 生成周回顾
- `health-check` — vault 健康检查
- `generate-moc` — 生成主题索引
```

**验证：** `python3 -c "import json; json.load(open('scenes/daily/prompts.json'))"` 无报错

---

### Step 4：编写内置场景 — coding

#### scenes/coding/manifest.json

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

#### scenes/coding/prompts.json

```jsonc
{
  "_meta": {
    "name": "coding",
    "description": "编码文档场景：项目笔记、开发日志、代码文档、会议纪要",
    "author": "persona",
    "version": "0.2.0",
    "tags": ["编码", "项目", "文档"]
  },
  "_extends": null,
  "_profile": "",
  "_um": "发散模式 — 面向编码项目的混乱外化。\n\n## 无输入时\n扫描 vault + 当前 git 仓库，发现方向：\n1. 检查最近 git commits 是否有对应的文档更新\n2. 找过时的项目笔记（status: active 但 > 14 天未更新）\n3. 检查未归档的会议纪要中的 action items\n4. 呈现 2-3 个方向让用户选择\n\n## 有输入时\n- 项目名 → 分析项目笔记完整性（README、API docs、changelog）\n- \"文档\" → 扫描代码变更，建议需要更新的文档\n- 代码模块名 → 创建或更新该模块的技术文档\n- 文本块 → 结构化为技术方案文档\n\n## 规则\n- 代码文档优先用 Mermaid 画架构图\n- 项目笔记按 module/component 组织\n- 会议纪要的 action items 用 - [ ] 追踪\n- 先诊断再行动",
  "_aha": "收敛模式 — 面向编码项目的进度汇总。\n\n## 无输入时\n1. 扫描最近 24h 修改的项目笔记和 daily notes\n2. 读取 git log（如果在 git 仓库中）\n3. 一句话总结：代码进展 + 文档状态\n4. 建议下一步：缺什么文档、哪个 action item 该跟进\n\n## 有输入时\n- 项目名 → 项目状态报告（done/pending/risk）\n- \"dev log\" → 从 git history 生成开发日志\n- 时间范围 → 总结该时段的编码产出和文档变更\n\n## 规则\n- 如果检测到代码变更无对应文档更新，主动提醒\n- 未完成的 action items 高亮展示\n- 快速简洁，像 standup meeting",
  "_memory": [],
  "_actions": {
    "project-note": {
      "description": "创建结构化项目笔记",
      "trigger": ["项目笔记", "project", "project note", "新项目"],
      "prompt": "创建项目笔记：\n1. 询问项目名（或从 context 推断）\n2. 创建 {Project Name}.md，含 frontmatter(status: active, created, tags:[project])\n3. 结构：## Goals + ## Architecture + ## Tasks + ## Resources\n4. 如果在 git 仓库中，自动填充基础信息（remote url、最近 commits）\n5. 链接到相关 index note"
    },
    "dev-log": {
      "description": "从 git 历史生成开发日志",
      "trigger": ["dev log", "开发日志", "git log", "提交记录"],
      "prompt": "生成开发日志：\n1. 运行 git log --since='yesterday' --oneline（或用户指定时间范围）\n2. 按主题聚类 commits\n3. 生成 {Project} Dev Log.md 或追加到已有文件\n4. 格式：日期段 + commit 摘要 + 主题归类\n5. 链接到对应项目笔记 [[Project Name]]"
    },
    "meeting": {
      "description": "创建会议纪要",
      "trigger": ["会议", "meeting", "会议纪要", "meeting notes"],
      "prompt": "创建会议纪要：\n1. 文件名：{YYYY-MM-DD} {Meeting Topic}.md\n2. Frontmatter: created, tags:[meeting], project\n3. 结构：## Attendees + ## Agenda + ## Decisions（用 > [!decision] callout）+ ## Action Items（- [ ] owner: due）+ ## Next Meeting\n4. Action items 链接到对应项目笔记"
    },
    "architecture": {
      "description": "生成架构文档（含 Mermaid 图）",
      "trigger": ["架构", "architecture", "架构图", "系统设计"],
      "prompt": "生成架构文档：\n1. 分析项目结构（目录树、入口文件、核心模块）\n2. 用 Mermaid 画模块关系图（flowchart 或 classDiagram）\n3. 每个模块一段说明：职责、对外接口、依赖\n4. 输出为 {Project} Architecture.md"
    }
  },
  "_loop_template": null,
  "obsidian-markdown": "项目文档用 Title Case 命名。Decisions 用 > [!decision] callout。代码块标注语言。链接用 [[wikilinks]]。",
  "obsidian-cli": "优先用 obsidian-cli 操作 vault。项目笔记用 properties 追踪 status 字段。",
  "json-canvas": "用 canvas 画项目关系图、模块依赖图。节点颜色：active=绿色、paused=黄色、completed=灰色。"
}
```

#### scenes/coding/README.md

```markdown
# Coding — 编码文档场景

项目笔记、开发日志、会议纪要、架构文档。

## 包含能力
- 项目笔记管理（创建、状态追踪、dashboard）
- 开发日志（从 git history 自动生成）
- 会议纪要（结构化模板 + action items 追踪）
- 架构文档（Mermaid 图 + 模块说明）

## 可用动作
- `project-note` — 创建结构化项目笔记
- `dev-log` — 从 git 历史生成开发日志
- `meeting` — 创建会议纪要
- `architecture` — 生成架构文档（含 Mermaid 图）
```

**验证：** `python3 -c "import json; json.load(open('scenes/coding/prompts.json'))"` 无报错

---

### Step 5：编写内置场景 — patent-writing（示例场景）

#### scenes/patent-writing/manifest.json

```json
{
  "scene": "patent-writing",
  "description": "专利撰写 — 技术方案文档化、权利要求书、现有技术检索",
  "requires": {
    "skills": ["obsidian-markdown", "mermaid-visualizer"],
    "mcp": [],
    "plugins": []
  }
}
```

#### scenes/patent-writing/prompts.json

```jsonc
{
  "_meta": {
    "name": "patent-writing",
    "description": "专利撰写场景：技术方案→权利要求→说明书→附图",
    "author": "persona",
    "version": "0.2.0",
    "tags": ["专利", "技术写作", "知识产权"]
  },
  "_extends": null,
  "_profile": "",
  "_um": "发散模式 — 面向专利撰写的探索与展开。\n\n## 无输入时\n1. 读取 context 中的 patent_id 和 tech_field\n2. 扫描 vault 中与当前专利相关的笔记\n3. 呈现方向：\n   - 技术方案是否完整？缺少哪些模块？\n   - 权利要求覆盖面是否足够？\n   - 是否需要补充现有技术对比？\n\n## 有输入时\n- 技术方案描述 → 拆解为发明点，识别技术特征\n- \"权利要求\" → 分析当前权利要求的保护范围，建议扩展\n- 竞品/论文 → 对比分析，找差异化发明点\n- 文本块 → 提取技术特征，结构化为专利语言\n\n## 规则\n- 使用专利领域术语（技术特征、发明点、保护范围）\n- 区分方法权利要求和系统权利要求\n- 先识别发明点再展开，不盲目补充",
  "_aha": "收敛模式 — 面向专利撰写的进度汇总。\n\n## 无输入时\n1. 汇总当前专利各部分完成度：\n   - 技术领域 ✓/✗\n   - 背景技术 ✓/✗\n   - 技术方案 ✓/✗\n   - 权利要求（独立N条/从属N条）\n   - 附图（N张）\n2. 建议下一步：最关键的未完成部分\n\n## 有输入时\n- \"权利要求\" → 列出所有已写权利要求，检查逻辑递进\n- \"说明书\" → 检查说明书与权利要求的一致性\n- 时间范围 → 总结该时段的撰写进度\n\n## 规则\n- 输出结构化状态表\n- 权利要求必须检查：独立/从属关系、技术特征递进、引用正确性",
  "_memory": [],
  "_actions": {
    "claim": {
      "description": "生成或优化权利要求书",
      "trigger": ["写权利要求", "claim", "权利要求", "claims"],
      "prompt": "生成权利要求书：\n1. 读取 context 中的 patent_id、tech_field\n2. 分析当前技术方案的核心发明点\n3. 生成独立权利要求（方法类 + 系统类各至少 1 条）\n4. 为每条独立权利要求生成 2-3 条从属权利要求\n5. 格式要求：\n   - 独立权利要求用「其特征在于」引出技术特征\n   - 从属权利要求用「根据权利要求N所述的...」开头\n   - 每条权利要求一个技术特征递进\n6. 输出后检查：总数不超过 20 条，无循环引用"
    },
    "prior-art": {
      "description": "检索和对比现有技术",
      "trigger": ["检索现有技术", "prior art", "现有技术", "对比"],
      "prompt": "现有技术检索与对比：\n1. 读取当前技术方案的核心发明点\n2. 在 vault 中搜索已收集的相关论文、专利笔记\n3. 列出每个现有技术的技术方案概要\n4. 与本发明逐点对比：\n   - 相同点（不可作为发明点）\n   - 差异点（潜在发明点）\n5. 输出对比表格 + 建议的差异化方向"
    },
    "specification": {
      "description": "生成专利说明书章节",
      "trigger": ["说明书", "specification", "技术方案", "实施例"],
      "prompt": "生成说明书章节：\n1. 读取 context 中的 tech_field 和已有权利要求\n2. 按标准结构生成：\n   - 技术领域（一句话）\n   - 背景技术（现有方案及其缺陷）\n   - 发明内容（本发明解决的技术问题 + 技术方案 + 有益效果）\n   - 具体实施方式（至少一个实施例，对应权利要求展开）\n3. 确保说明书支撑所有权利要求的技术特征"
    },
    "patent-figure": {
      "description": "生成专利附图（Mermaid）",
      "trigger": ["附图", "figure", "画图", "流程图"],
      "prompt": "生成专利附图：\n1. 分析当前技术方案，确定需要的附图类型：\n   - 方法流程 → flowchart TD\n   - 系统架构 → flowchart LR（方框图）\n   - 数据流 → sequenceDiagram\n2. 编号规范：FIG.1、FIG.2...\n3. 节点标注：编号 + 中文名称（如 101-数据采集模块）\n4. 风格：方框图为主，线条简洁，无装饰"
    }
  },
  "_loop_template": null,
  "mermaid-visualizer": "专利附图风格：方框图为主，编号标注（101、102...），中文标签，线条简洁无装饰。方法流程用 flowchart TD，系统架构用 flowchart LR。每张图对应一条权利要求。"
}
```

#### scenes/patent-writing/README.md

```markdown
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
```

**验证：** `python3 -c "import json; json.load(open('scenes/patent-writing/prompts.json'))"` 无报错

---

### Step 6：重写 registry.json

删除旧 `skill-registry.json`，创建新 `registry.json`：

```json
[
  {
    "name": "obsidian-cli",
    "type": "skill",
    "source": "kepano/obsidian-skills",
    "description": "CLI operations on a running Obsidian instance (search, read, write, properties, backlinks, daily notes)",
    "install": "npx skills add git@github.com:kepano/obsidian-skills.git",
    "url": "https://github.com/kepano/obsidian-skills"
  },
  {
    "name": "obsidian-markdown",
    "type": "skill",
    "source": "kepano/obsidian-skills",
    "description": "Obsidian Flavored Markdown syntax (wikilinks, embeds, callouts, properties, tags, math, mermaid)",
    "install": "npx skills add git@github.com:kepano/obsidian-skills.git",
    "url": "https://github.com/kepano/obsidian-skills"
  },
  {
    "name": "obsidian-bases",
    "type": "skill",
    "source": "kepano/obsidian-skills",
    "description": "Obsidian Bases database/query system (.base files with filters, formulas, views)",
    "install": "npx skills add git@github.com:kepano/obsidian-skills.git",
    "url": "https://github.com/kepano/obsidian-skills"
  },
  {
    "name": "json-canvas",
    "type": "skill",
    "source": "kepano/obsidian-skills",
    "description": "JSON Canvas visual boards (.canvas files with nodes, edges, groups)",
    "install": "npx skills add git@github.com:kepano/obsidian-skills.git",
    "url": "https://github.com/kepano/obsidian-skills"
  },
  {
    "name": "defuddle",
    "type": "skill",
    "source": "kepano/obsidian-skills",
    "description": "Clean markdown extraction from web pages, reducing token usage",
    "install": "npx skills add git@github.com:kepano/obsidian-skills.git",
    "url": "https://github.com/kepano/obsidian-skills"
  },
  {
    "name": "mermaid-visualizer",
    "type": "skill",
    "source": "axtonliu/axton-obsidian-visual-skills",
    "description": "Generate Mermaid diagrams with syntax safety and error prevention",
    "install": "npx skills add git@github.com:axtonliu/axton-obsidian-visual-skills.git",
    "url": "https://github.com/axtonliu/axton-obsidian-visual-skills"
  },
  {
    "name": "excalidraw-diagram",
    "type": "skill",
    "source": "axtonliu/axton-obsidian-visual-skills",
    "description": "Generate hand-drawn style Excalidraw diagrams (flowcharts, mindmaps, timelines)",
    "install": "npx skills add git@github.com:axtonliu/axton-obsidian-visual-skills.git",
    "url": "https://github.com/axtonliu/axton-obsidian-visual-skills"
  },
  {
    "name": "obsidian-canvas-creator",
    "type": "skill",
    "source": "axtonliu/axton-obsidian-visual-skills",
    "description": "Generate .canvas whiteboards with auto-layout and collision detection",
    "install": "npx skills add git@github.com:axtonliu/axton-obsidian-visual-skills.git",
    "url": "https://github.com/axtonliu/axton-obsidian-visual-skills"
  },
  {
    "name": "tutor-setup",
    "type": "skill",
    "source": "bevibing/tutor-skills",
    "description": "Turn study materials (PDF, Markdown, web) into a structured learning vault with quizzes",
    "install": "npx skills add git@github.com:bevibing/tutor-skills.git",
    "url": "https://github.com/bevibing/tutor-skills"
  },
  {
    "name": "tutor",
    "type": "skill",
    "source": "bevibing/tutor-skills",
    "description": "Interactive quizzes with adaptive questioning and per-concept progress tracking",
    "install": "npx skills add git@github.com:bevibing/tutor-skills.git",
    "url": "https://github.com/bevibing/tutor-skills"
  }
]
```

**格式说明：** 每条记录的 `type` 字段取值为 `"skill"` | `"mcp"` | `"plugin"`。当前所有条目均为 skill，MCP/Plugin 条目待实际需要时追加。

```bash
rm -f skill-registry.json
```

**验证：** `python3 -c "import json; d=json.load(open('registry.json')); assert all('type' in x for x in d)"`

---

### Step 7：编写 install.sh

完整脚本（直接从 DESIGN.md 提取，已验证逻辑）：

```bash
#!/bin/bash
# persona install script

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
CLAUDE_DIR="$HOME/.claude"
COMMANDS_DIR="$CLAUDE_DIR/commands"
CONFIG_FILE="$CLAUDE_DIR/persona.json"

mkdir -p "$COMMANDS_DIR"

COMMANDS=("um" "aha" "go" "distill")

echo "persona — installing commands..."

for cmd in "${COMMANDS[@]}"; do
  TARGET="$COMMANDS_DIR/$cmd.md"
  SOURCE="$REPO_DIR/commands/$cmd.md"

  if [ -e "$TARGET" ] && [ ! -L "$TARGET" ]; then
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

```bash
chmod +x install.sh
```

**验证：**
```bash
# dry-run 检查（不实际执行，只验证语法）
bash -n install.sh && echo "syntax ok"
# 行数检查
wc -l install.sh  # 应 < 50 行
```

---

### Step 8：重写 CLAUDE.md

CLAUDE.md 是 Claude Code 的 project-level system prompt。结构如下：

```markdown
# Persona — AI 工作人格管理

## 你是什么
你正在一个使用 persona 管理工作人格的 Obsidian vault 中工作。
用户通过 /um、/aha、/go、/distill 四个命令与你交互。

## 核心命令

### /um — 发散
读取当前场景的 prompts.json._um，执行发散行为。
无输入时扫描 vault 发现方向；有输入时视为目标进入分析。

### /aha — 收敛
读取当前场景的 prompts.json._aha，执行收敛行为。
无输入时做个人站会；有输入时视为范围修饰。

### /go <scene> — 切换场景
执行 on-enter hook：检查依赖 → 读 context → 展示可用 actions。

### /distill — 画像精炼
从 _memory 中提取模式，精炼 _profile。必须展示 diff 并获得确认。

## 场景系统

当前场景由 {cwd}/.persona/active-scene.json 决定。
场景查找顺序：{cwd}/.persona/scenes/{name}/ → {repo}/scenes/{name}/

每个场景包含：
- manifest.json — 依赖声明
- prompts.json — 提示词（_um、_aha、_profile、_memory、_actions、skill overlays）

## _actions 路由

当用户输入匹配某个 _actions 的 trigger 时，执行该 action 的 prompt。
匹配规则：精确匹配 trigger 数组中的任一关键词（大小写不敏感）。

## 渐进蒸馏

- 用户说"记住"→ 立即存入 prompts.json._memory
- 用户纠正 AI 输出 → 提示"要记住这个偏好吗？"
- /distill → 精炼 _memory 为 _profile

## Prompt 组合顺序（优先级从高到低）

1. Skill overlay（prompts.json 中对应 skill 的值）
2. 场景 _profile
3. 全局 profile.md（{cwd}/.persona/profile.md）
4. _memory 条目
5. contexts/{scene}.md 关键变量

## 文件路径约定

- persona 仓库：读 ~/.claude/persona.json 的 repo_path
- 当前场景：读 {cwd}/.persona/active-scene.json
- 场景 context：{cwd}/.persona/contexts/{scene-name}.md
- 全局画像：{cwd}/.persona/profile.md
```

**验证：** 包含所有 4 个命令说明、_actions 路由规则、prompt 组合顺序、文件路径约定

---

### Step 9：重写 README.md

结构如下：

```markdown
# persona

> 个人 AI 工作人格的版本管理系统。

你不是在管理工具，你是在蒸馏自己。

## 安装

git clone ... && cd persona && ./install.sh

## 三个命令

| 命令 | 情绪 | 行为 |
|------|------|------|
| /um | 困惑 | 发散 — 外化混乱，发现方向 |
| /aha | 顿悟 | 收敛 — 汇总进度，提炼清晰 |
| /go | 切换 | 切换场景，进入不同工作人格 |
| /distill | 沉淀 | 精炼画像，越用越懂你 |

## 场景

场景 = 工作人格包。每个场景定义了你在某个角色下怎么思考、行动。

内置场景：
- daily — 日常笔记管理
- coding — 编码文档
- patent-writing — 专利撰写

切换：/go daily

## 越用越懂你

使用过程中 AI 积累你的偏好（_memory），定期 /distill 精炼为画像（_profile）。
完全透明 — 打开 prompts.json 就能看到 AI 记住了什么。

## 自定义场景

在 {vault}/.persona/scenes/ 下创建目录，包含 manifest.json + prompts.json。
支持 _extends 继承已有场景。

## 设计哲学

- 知行合一 — 你的"知"直接变成 AI 的"行"
- 双钻石模型 — 只有发散和收敛两种状态
- 场景即人格 — 不是工具变了，是你的工作模式变了
- 组合技封装 — 单个 skill 是招式，scene 是连招

## License

MIT
```

**验证：** 包含安装命令、命令表格、场景列表、蒸馏说明、自定义场景、哲学

---

### Step 10：重写 package.json

目标内容：

```json
{
  "name": "persona",
  "version": "0.2.0",
  "description": "Personal AI work persona management — switch scenes, distill habits, get smarter over time",
  "bin": {
    "persona": "./install.sh"
  },
  "files": [
    "commands/",
    "scenes/",
    "registry.json",
    "install.sh",
    "CLAUDE.md"
  ],
  "keywords": [
    "persona",
    "claude",
    "claude-code",
    "obsidian",
    "ai-workflow",
    "prompt-management",
    "knowledge-management"
  ],
  "license": "MIT"
}
```

**验证：** `python3 -c "import json; json.load(open('package.json'))"` 无报错

---

### Step 11：清理 modules/ 目录

旧 skill 内容已迁移到 scenes 的 prompts.json 中：

```bash
rm -rf modules/
```

**验证：** `ls modules/ 2>&1 | grep "No such file or directory"`

---

### Step 12：端到端验证

逐步模拟完整用户流程，每步有明确的期望输出：

#### 12.1 安装验证

```bash
./install.sh
```

**期望输出：**
```
persona — installing commands...
  ✓ /um → ~/.claude/commands/um.md
  ✓ /aha → ~/.claude/commands/aha.md
  ✓ /go → ~/.claude/commands/go.md
  ✓ /distill → ~/.claude/commands/distill.md

  Config: ~/.claude/persona.json

Done! Restart Claude Code to activate.
Then: cd <your-vault> && type /go daily
```

#### 12.2 symlink 验证

```bash
ls -la ~/.claude/commands/{um,aha,go,distill}.md
```

**期望：** 每个文件都是 symlink，指向 `{repo}/commands/*.md`

#### 12.3 persona.json 验证

```bash
cat ~/.claude/persona.json | python3 -m json.tool
```

**期望：** 含 version="0.2.0"、repo_path 指向当前仓库、vaults=[]、command_names 四个命令

#### 12.4 vault 初始化验证

```bash
# 在测试 vault 中
mkdir -p .persona && echo '{"scene":"daily","source":"builtin","activated_at":"2026-05-18T22:00:00Z"}' > .persona/active-scene.json
```

#### 12.5 /go 命令测试

在 Claude Code 中执行 `/go daily`。

**期望输出包含：**
- "✓ 已切换到 daily"
- 可用动作列表：daily-note、weekly-review、health-check、generate-moc
- 如果 `.persona/contexts/daily.md` 不存在，提示创建

#### 12.6 /um 命令测试

在 Claude Code 中执行 `/um`（无输入）。

**期望行为：**
- AI 扫描 vault 中的 .md 文件
- 输出 2-3 个方向性问题（孤儿笔记数、未打标签数等）
- 等待用户选择，不主动行动

#### 12.7 /aha 命令测试

在 Claude Code 中执行 `/aha`。

**期望行为：**
- AI 扫描最近 24h 修改的文件
- 一句话总结进度
- 建议一个下一步行动

---

## 依赖关系（v0.2）

```
Step 1 (清理) → Step 2 (命令) → Step 3-5 (场景，可并行)
                                        ↓
Step 6 (registry) ──────────────→ Step 7 (install.sh)
                                        ↓
Step 8-10 (文档，可并行) ────────→ Step 11 (清理modules)
                                        ↓
                                  Step 12 (验证)
```

---

## 开发原则

1. **每步完成后验证** — 不跳步，不假设
2. **内容优先于结构** — prompts.json 里的提示词质量决定产品质量
3. **保留 .agents/skills/** — 这些是 obsidian 官方 skill，不动
4. **保留 .github/** — CI/issue 模板不动
5. **Git 分支** — 在 `refactor/persona-v0.2` 分支上操作，完成后 merge

---
---

# v0.3 — 继承 + Dry-run（当前目标）

> v0.2 已完成全部 12 步。v0.3 聚焦于场景继承系统的完整实现和调试能力。

## v0.2 已实现（v0.3 可跳过）

| 功能 | 文件 | 说明 |
|------|------|------|
| `_actions` intent 路由 | commands/um.md, aha.md | 已有路由指令 + 3 个场景各 4 个 actions |
| `/distill` 画像精炼 | commands/distill.md | 完整流程已定义 |
| `_memory` 基础存储 | scenes/*/prompts.json | 已有空 `_memory: []` 字段 |

## v0.3 需要实现

### Step 13：补充继承解析指令到核心命令

当前 `commands/go.md` 只有一句 "If scene has `_extends`, resolve inheritance chain (max 3 levels)"，
`commands/um.md` 和 `commands/aha.md` 完全没有继承解析逻辑。

需要在三个命令中补充完整的继承解析流程：

#### go.md 需追加的继承解析段落

在"Locate scene"步骤之后、"Read manifest.json"步骤之前插入：

```markdown
## Inheritance Resolution

If `prompts.json._extends` is not null:

1. Read parent scene name from `_extends`
2. Locate parent scene (same priority: local > builtin)
3. Recursively resolve parent (if parent also has `_extends`)
4. **Depth check:** if chain > 3 levels → error: "继承链过深（最多 3 层）：{chain}"
5. **Cycle check:** if scene name appears twice in chain → error: "继承循环：{cycle}"
6. Merge prompts — two levels of rules:

   **标量字段**（`_um`, `_aha`, `_profile`, `_extends`, `_loop_template`, skill overlays）：
   - Field has value → use child's value
   - Field is `null` → use parent's value
   - Field is absent → use parent's value
   - Field is `""` (empty string) → explicitly clear, use nothing

   **对象字段**（`_actions`, `_meta`）— KEY-LEVEL merge：
   - 子的 `_actions` 中存在的 key → 覆盖父的同名 key
   - 子的 `_actions` 中不存在的 key → 保留父的 key
   - 即：最终 _actions = { ...parent._actions, ...child._actions }
   - 如果子的某个 action 值为 `null` → 删除该 action（不继承父的）

   **数组字段**（`_memory`）：
   - 合并：最终 _memory = [...parent._memory, ...child._memory]（去重）

7. Merge manifest dependencies:
   - Child `requires.skills` has `+` prefix items → append to parent's list (dedupe)
   - Child `requires.skills` without `+` prefix → replace parent's list entirely
   - Same logic for `mcp` and `plugins`
8. Use merged result for all subsequent steps
```

#### um.md / aha.md 需追加的继承解析段落

在"Read prompts.json"步骤中补充：

```markdown
4. Read `prompts.json` → extract fields
   - If `_extends` is not null:
     a. Resolve inheritance chain (same rules as /go: max 3, cycle check)
     b. Merge: child overrides parent for all _ fields and skill overlays
     c. Use merged result
   - Extract `_um` (or `_aha`), `_profile`, `_memory`, `_actions` from merged result
```

**验证：** 每个命令文件包含 "inheritance" 或 "_extends" 相关的完整解析流程

---

### Step 14：在 go.md 中增加 --dry-run 模式

在 go.md 的"Execution Flow"末尾或"Rules"之前插入新段落：

```markdown
## --dry-run Mode

When user says `/go <scene> --dry-run` or `/go <scene> dry-run`:

Instead of switching, display the **resolved prompt composition** without activating:

Output format:
~~~
=== Dry Run: {scene-name} ===

继承链: {scene} → {parent} → ...
（如果无继承，显示：继承链: (无，独立场景)）

--- 合并后 _um ---
{resolved _um content, first 200 chars}...

--- 合并后 _aha ---
{resolved _aha content, first 200 chars}...

--- _profile ---
{resolved _profile, full. 如果为空显示 "(空)"}

--- _memory ({count} 条) ---
- {memory 1}
- {memory 2}
...
（如果为空显示 "(无记忆)"）

--- _actions ({count} 个) ---
- {name}: {description} [triggers: ...] {来源: 子/父}
- ...
（标注每个 action 来自子场景还是父场景）

--- Skill Overlays ---
- {skill-name}: {first 100 chars}... {来源: 子/父}
- ...

--- 依赖 (manifest) ---
skills: [...] (如果有继承，标注哪些来自父、哪些是子追加)
mcp: [...]
plugins: [...]

--- Context ({cwd}/.persona/contexts/{scene}.md) ---
{content or "(文件不存在，建议创建)"}
~~~

Do NOT write active-scene.json. Do NOT switch.
Works for both inherited and standalone scenes — standalone scenes simply skip inheritance-related annotations.
```

**验证：** go.md 中包含 "dry-run" 段落和完整输出格式定义

---

### Step 15：创建继承示例场景 patent-writing-en

创建一个子场景来验证继承系统：

#### scenes/patent-writing-en/manifest.json

```json
{
  "scene": "patent-writing-en",
  "description": "English patent writing — inherits patent-writing, all output in English",
  "requires": {
    "skills": ["+defuddle"],
    "mcp": [],
    "plugins": []
  }
}
```

#### scenes/patent-writing-en/prompts.json

```jsonc
{
  "_meta": {
    "name": "patent-writing-en",
    "description": "English patent writing (inherits patent-writing)",
    "author": "persona",
    "version": "0.3.0",
    "tags": ["patent", "english", "USPTO"]
  },
  "_extends": "patent-writing",
  "_profile": "All output must be in English. Use USPTO patent claim format. Technical terms follow US patent conventions.",
  "_um": null,
  "_aha": null,
  "_memory": [],
  "_actions": {
    "claim": {
      "description": "Generate USPTO-format patent claims",
      "trigger": ["claim", "claims", "write claims"],
      "prompt": "Generate patent claims in USPTO format:\n1. Read context for patent_id, tech_field\n2. Independent claims: 'A method comprising...' or 'A system comprising...'\n3. Dependent claims: 'The method of claim N, wherein...'\n4. Use 'comprising' (open-ended) not 'consisting of' (closed)\n5. Each claim one sentence, no period until end\n6. Number sequentially: 1, 2, 3..."
    }
  },
  "_loop_template": null,
  "mermaid-visualizer": "Patent figures: use English labels. Node format: '101 - Data Collection Module'. Flowchart TD for methods, LR for systems."
}
```

#### scenes/patent-writing-en/README.md

```markdown
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

## 最终合并结果（dry-run 可查看）
- `_um` → 来自 patent-writing（父）
- `_aha` → 来自 patent-writing（父）
- `_profile` → "All output must be in English..."（子覆盖）
- `_actions.claim` → USPTO 格式（子覆盖）
- `_actions.prior-art` → 来自 patent-writing（父，子未覆盖）
- `_actions.specification` → 来自 patent-writing（父）
- `_actions.patent-figure` → 来自 patent-writing（父）
- `mermaid-visualizer` → 英文标签（子覆盖）
- 依赖 → patent-writing 的 skills + defuddle（追加）
```

**验证：**
- `prompts.json._extends` = "patent-writing"
- manifest.json 的 skills 有 `+` 前缀
- `/go patent-writing-en --dry-run` 应展示合并后的完整 prompt

---

### Step 16：更新 CLAUDE.md 增加继承说明

在 CLAUDE.md 的"场景系统"段落中追加继承解析规则。

追加内容：

```markdown
## 场景继承

如果 `prompts.json._extends` 不为 null，按以下规则合并：

1. 定位父场景（同优先级：local > builtin）
2. 递归解析（父可能也有 `_extends`）
3. 深度限制：最多 3 层，超过报错
4. 循环检测：场景名不能重复出现
5. 合并规则：
   - 有值 → 子覆盖父
   - `null` 或字段缺失 → 继承父
   - `""` 空字符串 → 显式清除
6. manifest 依赖合并：`+` 前缀 = 追加，无前缀 = 替换
```

**验证：** CLAUDE.md 包含 "场景继承" 段落

---

### Step 17：端到端验证 v0.3

#### 17.1 继承解析验证

```bash
# 确认 patent-writing-en 的 _extends 指向 patent-writing
python3 -c "import json; d=json.load(open('scenes/patent-writing-en/prompts.json')); assert d['_extends'] == 'patent-writing'; print('extends ✓')"

# 确认 manifest 有 + 前缀
python3 -c "import json; d=json.load(open('scenes/patent-writing-en/manifest.json')); assert '+defuddle' in d['requires']['skills']; print('+ prefix ✓')"
```

#### 17.2 dry-run 验证

在 Claude Code 中执行 `/go patent-writing-en --dry-run`。

**期望行为：**
- 不写入 active-scene.json
- 显示继承链：patent-writing-en → patent-writing
- 显示合并后的 _um（来自父场景 patent-writing）
- 显示合并后的 _profile（来自子场景 patent-writing-en）
- 显示合并后的 _actions（子覆盖 claim，父保留 prior-art/specification/patent-figure）
- 显示合并后的依赖（obsidian-markdown + mermaid-visualizer + defuddle）

#### 17.3 继承场景实际切换验证

在 Claude Code 中执行 `/go patent-writing-en`。

**期望行为：**
- 检查依赖：obsidian-markdown + mermaid-visualizer（来自父）+ defuddle（来自子追加）
- 切换成功
- 展示合并后的 actions 列表（4 个：claim 是子版本，其余 3 个来自父）

#### 17.4 /um 继承验证

切换到 patent-writing-en 后执行 `/um`。

**期望行为：**
- 读取合并后的 `_um`（来自父 patent-writing 的发散 prompt）
- 应用子场景的 `_profile`（英文输出）
- AI 行为符合专利发散模式但输出英文

---

## 依赖关系（v0.3）

```
Step 13 (补充继承指令到命令) → Step 14 (dry-run)
                                      ↓
                              Step 15 (创建示例子场景)
                                      ↓
                              Step 16 (更新 CLAUDE.md)
                                      ↓
                              Step 17 (端到端验证)
```
