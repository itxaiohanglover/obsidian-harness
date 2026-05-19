# Persona — 问题审查与优化建议

> 版本：v0.5.0 | 审查时间：2026-05-19

---

## 审查方法

从三个维度进行审查：
1. **架构层面** — 代码结构、信息重复、维护成本
2. **用户体验层面** — 真实使用场景模拟、边界情况
3. **性能层面** — Token 消耗、响应速度

---

## 一、架构层面问题

### 问题 1：um.md 和 aha.md 大量重复逻辑

**现状**：两个文件的 Execution Flow（步骤 1-8）几乎一模一样，只有第 4 步 extract 的字段不同（`_um` vs `_aha`）。

**影响**：
- 修改继承解析逻辑时需要同步改两个文件
- 已经发生过改一个忘改另一个的情况

**建议方案**：
- 方案 A：将公共逻辑抽到 CLAUDE.md 中，命令文件只保留行为差异部分
- 方案 B：保持现状但在注释中标注"与 aha.md/um.md 同步"
- **推荐方案 A** — 减少维护负担，CLAUDE.md 作为 system prompt 本就常驻

### 问题 2：CLAUDE.md 与命令文件信息重复

**现状**：CLAUDE.md 详细解释了继承规则、_actions 路由、prompt 组合顺序。go.md/um.md 里也各自完整写了。

**影响**：
- AI 读两遍相同信息 = 浪费约 500 tokens
- 修改规则时需要同步三个地方

**建议方案**：
- CLAUDE.md 保留规则的**概要**（当前已是概要），命令文件保留**执行细节**
- 明确分工：CLAUDE.md = "是什么"，commands/*.md = "怎么做"

### 问题 3：go.md 职责过重（159 行 / 14 步）

**现状**：go.md 包含 onboarding + 继承解析 + 依赖检查 + dry-run + fuzzy match + 场景列表。

**影响**：
- 单个命令文件过长增加 AI 误读风险
- 但实际执行时 AI 只走其中一条路径（不会同时执行 dry-run 和正常切换）

**建议**：暂不拆分。14 步是线性的，AI 按顺序执行即可。但输出格式应保持极简（当前已满足）。

---

## 二、用户体验层面问题

### 问题 4：首次 /um 时 AI 行为不可预测

**场景**：用户装完 persona，直接在 vault 中打 `/um`，没先执行 `/go`。

**现状**：
- um.md 步骤 2 说"If active-scene.json not found → default to daily"
- 但此时 `.persona/` 目录不存在 → profile.md 不存在 → contexts/ 不存在
- AI 需要处理 3+ 个"文件不存在"的情况

**影响**：AI 可能每次都输出文件不存在的提示，体验割裂。

**建议方案**：
- um.md 和 aha.md 增加与 go.md 相同的 first-run check
- 检测到 `.persona/` 不存在时，先执行 onboarding（创建目录 + profile.md），再继续执行
- 或者：直接在步骤 2 之前加一句"If `.persona/` does not exist → run same onboarding as /go step 3"

### 问题 5："记住"的触发太隐晦

**场景**：用户说"以后都用这个格式"、"下次别这样了"。

**现状**：
- CLAUDE.md 自然语言路由表有："记住"、"我的习惯是" → 存入 _memory
- aha.md 的 Distillation Check："user corrected AI output → ask: 要记住这个偏好吗？"
- 但 AI 怎么判断"纠正"？这依赖 AI 的判断力，非确定性行为

**影响**：有些纠正会被漏掉，用户感觉"AI 没记住"。

**建议方案**：
- 降低预期：不追求 100% 自动捕获
- 在 README 或首次使用时告知用户：想让 AI 记住什么，直接说"记住：..."
- aha.md 的 Distillation Check 简化为：只在 AI 被**明确**纠正（用户说"不是"、"错了"、"别这样"）时才提示

### 问题 6：/um 无输入时扫描过重

**场景**：大 vault（1000+ 文件），用户只是想随便聊聊。

**现状**：无输入时要扫描孤儿笔记、未打标签、过期笔记、断链、未完成任务——5 项全量扫描。

**影响**：
- 大 vault 中 AI 需要遍历大量文件，响应慢
- 用户可能只是想看变更，不需要全量审计

**建议方案**：
- 调整优先级：变更检测（轻量）→ 如果有变更就停在这里
- 只有用户选择"探索新方向"时才做全量扫描
- 全量扫描也改为"选一项最突出的问题"而非全部列出

### 问题 7：不在 vault 中时的降级策略

**场景**：用户在 home 目录或代码仓库（非 Obsidian vault）中打 `/um`。

**现状**：
- go.md 检测 `.obsidian/` 不存在 → 报错退出
- um.md/aha.md 没有 vault 检测逻辑！直接读 active-scene.json（不存在）→ default to daily → 继续执行但所有文件路径都无效

**影响**：AI 会尝试读一堆不存在的文件，输出错误或困惑的响应。

**建议方案**：
- um.md/aha.md 步骤 1 之前增加 vault 检测
- 不在 vault 时降级为通用发散/收敛助手（不加载场景上下文，不做 vault 扫描）
- 提示："当前不在 Obsidian vault 中，我会作为通用助手工作。如需完整功能，请 cd 到你的 vault。"

### 问题 8：/new 交互过重

**场景**：用户想快速基于 daily 创建一个变体，被 7 个问题卡住。

**现状**：Q1-Q7 每个都要等回复，即使选择了继承也要走 Q4-Q7。

**影响**：创建场景的摩擦力高，用户可能放弃转而手动复制文件。

**建议方案**：
- 支持快速模式：`/new my-scene --from daily "基于 daily，加上论文阅读相关的动作"`
- 一行搞定：名称 + 继承源 + 一句话差异描述 → AI 自动推断其余
- 保留完整交互作为 fallback（无参数时）

### 问题 9：没有独立的"快速记住"方式

**场景**：用户想快速存个偏好，不想走 /um 或 /aha 的完整流程。

**现状**：CLAUDE.md 有"用户说'记住' → 存入 _memory"的路由，但这依赖 AI 的自然语言理解和 CLAUDE.md 的加载。

**影响**：不确定性高。CLAUDE.md 是 project-level prompt，只在该项目目录下生效。

**建议方案**：
- 当前设计可接受——"记住"是高频词，AI 大概率会正确处理
- 如果未来发现问题，可考虑增加 `/remember` 命令（但增加了命令记忆负担）
- 暂不改动，观察实际使用效果

### 问题 10：prompts.json 中 _um/_aha 是大段转义文本

**场景**：用户想微调场景的发散/收敛 prompt。

**现状**：打开 prompts.json 看到 `\n` 转义的数百字长文本，可读性极差。

**影响**：编辑体验糟糕，容易改坏 JSON 格式。

**建议方案（远期）**：
- 支持外部 markdown 文件引用：`"_um": "@file:um.md"`
- prompts.json 中只存引用路径，实际 prompt 内容在独立 .md 文件中
- 当前优先级低——大部分用户通过 /new 创建，不直接编辑 prompts.json

---

## 三、优化优先级排序

| 优先级 | 问题 | 建议动作 | 预估工作量 |
|--------|------|----------|-----------|
| **P0** | #4 首次 /um 无 onboarding | um.md/aha.md 加 first-run check | 小 |
| **P0** | #7 不在 vault 时无降级 | um.md/aha.md 加 vault 检测 + 降级 | 小 |
| **P1** | #6 扫描过重 | 调整无输入逻辑优先级 | 小 |
| **P1** | #5 蒸馏触发隐晦 | 简化 Distillation Check 为显式触发 | 小 |
| **P2** | #8 /new 交互过重 | 支持 --from 快速模式 | 中 |
| **P2** | #1 命令文件逻辑重复 | 公共逻辑迁到 CLAUDE.md | 中 |
| **P3** | #10 prompts.json 可读性 | 支持 @file 引用（远期） | 大 |
| **P3** | #9 独立记住命令 | 暂不改动，观察 | 无 |

---

## 四、已修复的历史问题（v0.3-v0.5）

以下问题已在之前的迭代中修复，记录备查：

| 版本 | 问题 | 修复方式 |
|------|------|----------|
| v0.3 | 无继承系统 | 实现 _extends + key-level merge |
| v0.4 | 多终端覆盖 active-scene.json | 明确为 by-design，文档说明 |
| v0.4 | 贴想法不加载场景上下文 | CLAUDE.md 补充无命令输入时的行为 |
| v0.4 | "看看改了什么"走错分支 | um.md With Input 增加变更关键词匹配 |
| v0.4 | 首次使用无画像 | go.md onboarding 创建 profile.md 模板 |
| v0.5 | 渐进深入缺失 | um.md Focus/Dive 模式 |
| v0.5 | Obsidian 原生未整合 | canvas-map + dashboard actions |
| v0.5 | 场景间无流转 | CLAUDE.md 跨场景建议规则 |
| v0.5 | daily manifest 缺 obsidian-bases | 补充依赖 |
| v0.5 | go.md 步骤编号错误 | 修复为 1-14 连续 |
| v0.5 | active-scene.json 覆盖 last_aha_at | 改为 merge 写入 |

---

## 五、下一版本方向

### v0.6 — 体验打磨

聚焦本文档 P0/P1 问题：
- um.md/aha.md 增加 first-run check 和 vault 检测降级
- /um 无输入扫描简化
- Distillation Check 改为显式触发
- /new 支持快速模式

### v0.7 — 分享

- `persona export` / `persona import`
- Public/Private 字段自动分离
- 导入时依赖检查 + 安装引导

### v1.0 — 生态

- _loop_template 自主循环
- MCP server 支持
- 社区场景市场
