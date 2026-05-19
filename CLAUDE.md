# Persona — AI 工作人格管理

你正在一个使用 persona 管理工作人格的 Obsidian vault 中工作。
用户通过 /um、/aha、/go、/distill、/new 五个命令与你交互。

## 核心命令

### /um — 发散

读取当前场景的 `prompts.json._um`，执行发散行为。
无输入时先检测 vault 变更（自上次场景切换后），再扫描 vault 发现方向；有输入时视为目标进入分析。

### /aha — 收敛

读取当前场景的 `prompts.json._aha`，执行收敛行为。
无输入时做个人站会（基于场景切换以来的变更）；有输入时视为范围修饰。
每次执行后更新 `active-scene.json` 的 `last_aha_at` 时间戳。

### /go <scene> — 切换场景

执行 on-enter hook：首次使用自动创建 `.persona/` → 检查依赖 → 读 context → 展示可用 actions。
无参数时列出所有可用场景。支持 `--dry-run` 调试模式。

### /distill — 画像精炼

从 `_memory` 中提取模式，精炼 `_profile`。必须展示 diff 并获得用户确认后才能写入。

### /new — 创建场景

引导式交互创建新场景。询问名称、描述、继承、依赖、使用习惯、专属动作，自动生成 manifest.json + prompts.json + context 模板。

## 场景系统

当前场景由 `{cwd}/.persona/active-scene.json` 决定。
场景查找顺序：
1. `{cwd}/.persona/scenes/{name}/` — 用户自建场景优先
2. `{repo}/scenes/{name}/` — 内置场景兜底

每个场景包含：
- `manifest.json` — 依赖声明（skills、mcp、plugins）
- `prompts.json` — 提示词（`_um`、`_aha`、`_profile`、`_memory`、`_actions`、skill overlays）

## 场景继承

如果 `prompts.json._extends` 不为 null，按以下规则解析：

1. 定位父场景（同优先级：local > builtin）
2. 递归解析（父可能也有 `_extends`）
3. 深度限制：最多 3 层，超过报错
4. 循环检测：场景名不能重复出现
5. 合并规则：
   - **标量字段**（`_um`, `_aha`, `_profile`, skill overlays）：有值=子覆盖；`null`/缺失=继承父；`""`=清除
   - **对象字段**（`_actions`）：key-level merge — `{...parent, ...child}`；子 key 为 `null` 则删除
   - **数组字段**（`_memory`）：concat + 去重
6. manifest 依赖：`+` 前缀 = 追加到父列表；无前缀 = 替换

### /go --dry-run

`/go <scene> --dry-run` 展示合并后的完整 prompt 组合，不实际切换。用于调试继承链。

## _actions 路由

当用户输入匹配某个 `_actions` 的 trigger 时，执行该 action 的 prompt。
匹配规则：精确匹配 trigger 数组中的任一关键词（大小写不敏感）。

触发路径：
- 自然语言输入匹配 trigger → 直接执行 action prompt
- `/um <keyword>` 匹配 trigger → 发散模式 + action prompt
- 无匹配 → 正常执行 `_um` 或 `_aha` 行为

## 渐进蒸馏

- 用户说"记住..." → 立即存入 `prompts.json._memory` 数组
- 用户纠正 AI 输出 → 提示"要记住这个偏好吗？"
- 用户确认 → 追加到 `_memory`
- `/distill` → 分析 `_memory` 模式，精炼为 `_profile`

## Prompt 组合顺序（优先级从高到低）

执行 /um 或 /aha 时，按以下顺序组合 prompt：

1. **Skill overlay** — `prompts.json` 中对应 skill name 的值（如 `"obsidian-markdown": "..."`）
2. **场景 `_profile`** — `prompts.json._profile`
3. **全局 profile** — `{cwd}/.persona/profile.md`
4. **`_memory` 条目** — `prompts.json._memory` 数组
5. **Context 变量** — `{cwd}/.persona/contexts/{scene-name}.md`

Skill overlay 距离 AI 最近，优先级最高，不易被截断忽略。

## 文件路径约定

| 用途 | 路径 |
|------|------|
| persona 仓库位置 | `~/.claude/persona.json` → `repo_path` 字段 |
| 当前激活场景 | `{cwd}/.persona/active-scene.json` |
| 场景 context | `{cwd}/.persona/contexts/{scene-name}.md` |
| 全局画像 | `{cwd}/.persona/profile.md` |
| 内置场景 | `{repo_path}/scenes/{name}/` |
| 用户自建场景 | `{cwd}/.persona/scenes/{name}/` |
| 依赖安装源 | `{repo_path}/registry.json` |

## Vault 检测

如果 cwd 下存在 `.obsidian/` 目录，则当前目录是 Obsidian vault。
如果不存在，/go 和 /um 应提示用户："当前目录不是 Obsidian vault，请 cd 到你的 vault 目录。"

## 自然语言意图路由

用户不需要记住命令名。匹配意图：

| 用户可能说 | 路由到 |
|-----------|--------|
| "帮我整理"、"太乱了"、"搞一下" | /um |
| "进度"、"总结一下"、"现在到哪了" | /aha |
| "切到xxx"、"换个场景" | /go xxx |
| "记住"、"我的习惯是" | 存入 _memory |
| 匹配 _actions trigger 的关键词 | 执行对应 action |

如果意图不匹配任何命令但用户在 Obsidian vault 中工作（`.persona/active-scene.json` 存在），
仍然加载当前场景的 `_profile`、`_memory`、context 和 skill overlays 作为行为参考。
即：贴一段文本给 AI 时，AI 仍然带有当前场景的人格和偏好，不会退化为通用助手。

**多终端并发说明：** `active-scene.json` 是 vault 级别的单文件。多终端共用同一 vault 时，
最后一次 `/go` 会覆盖前者。这是有意为之——一个 vault 同一时刻只有一个活跃场景。
如果需要并行不同场景，使用不同 vault 或在终端内用 `/go` 临时切换。

## 场景间流转

当用户在当前场景中的工作自然涉及另一个场景时，AI 应主动建议切换：

| 当前场景 | 触发信号 | 建议 |
|---------|---------|------|
| daily | 用户提到具体项目代码/架构 | "这看起来是编码相关的，要 `/go coding` 切换吗？" |
| daily | 用户开始讨论发明点/技术方案 | "要切到 `/go patent-writing` 写专利吗？" |
| coding | 用户想做今日回顾/非项目整理 | "这更像日常整理，要 `/go daily` 吗？" |
| patent-writing | 用户转向代码实现 | "要 `/go coding` 记录实现细节吗？" |

**规则：**
- 只建议，不自动切换。用户说"好"或"切"时才执行 `/go`
- 建议时机：当用户输入连续 2+ 轮偏离当前场景定位时
- 不要频繁建议——只在明显跨界时提一次
- 如果用户忽略建议，不再重复

### 跨场景笔记链接

当在一个场景中创建的笔记与另一个场景相关时：
- 在笔记 frontmatter 中标注 `related-scene: coding`（或其他场景名）
- 这样 /um 扫描时可以发现跨场景关联
- 例：在 daily 中记录了一个想法，标注 `related-scene: patent-writing`，下次 `/go patent-writing` 后 `/um` 会提示"daily 中有一个和专利相关的想法"
