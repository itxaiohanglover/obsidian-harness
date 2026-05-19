Create a new scene — guided interactive setup.

## Quick Mode

When user provides `--from`: `/new <name> --from <parent> "<description>"`

Example: `/new patent-cn --from patent-writing "中文专利，使用国知局格式"`

In quick mode:
1. Read `~/.claude/persona.json` → get `repo_path`
2. Validate name (lowercase, hyphens, no conflict)
3. Locate parent scene → read its prompts.json and manifest.json
4. Auto-generate child scene:
   - `_extends`: parent name
   - `_profile`: generated from description (e.g. "所有输出使用国知局格式...")
   - `_um`: null (inherit)
   - `_aha`: null (inherit)
   - `_memory`: []
   - `_actions`: {} (inherit all from parent)
   - manifest: `"skills": []` (inherit parent's via +)
5. Create files in `{cwd}/.persona/scenes/{name}/`
6. Create context template `{cwd}/.persona/contexts/{name}.md`
7. Output: "✓ 场景 {name} 已创建（继承自 {parent}）！用 `/go {name} --dry-run` 查看完整组合。"

Quick mode skips all interactive questions — one command, done.

---

## Full Interactive Mode

When no `--from` provided: `/new`

### Execution Flow

1. Read `~/.claude/persona.json` → get `repo_path`
2. Read `{repo_path}/registry.json` → get available skills/mcp/plugins
3. Ask user a series of questions (interactively, one at a time):

### Question Flow

**Q1: 场景名称**
"你想叫这个场景什么？（英文短横线命名，如 blog-writing、research）"
- Validate: lowercase, hyphens only, no spaces
- Check: name doesn't already exist in `{repo_path}/scenes/` or `{cwd}/.persona/scenes/`

**Q2: 一句话描述**
"用一句话描述这个场景做什么？"

**Q3: 是否继承**
"要基于已有场景扩展吗？（列出可用场景，或输入 n 从零开始）"
- If yes → set `_extends`, skip Q4-Q6 for inherited fields
- If no → continue

**Q4: 需要哪些 Skills**
Show available skills from registry.json:
```
可用 Skills:
  1. obsidian-markdown — Obsidian Markdown 语法
  2. obsidian-cli — Obsidian CLI 操作
  3. json-canvas — Canvas 可视化
  4. mermaid-visualizer — Mermaid 图表
  5. defuddle — 网页内容提取
  ...
选择需要的（输入编号，逗号分隔，如 1,2,4）：
```

**Q5: 你的使用习惯**
"在这个场景下，你通常怎么工作？描述你的典型流程、偏好、风格。"
- This becomes `_profile` initial content

**Q6: 每个 Skill 怎么用**
For each selected skill, ask:
"在这个场景下，{skill-name} 你一般怎么用？有什么特殊风格或要求？（回车跳过用默认）"
- Non-empty answers become skill overlays in prompts.json

**Q7: 需要什么专属动作？**
"这个场景需要什么快捷动作？（如：写大纲、发布检查、生成摘要）"
"每个动作给出：名称、触发词、具体做什么"
- If user provides → generate `_actions`
- If user skips → `_actions: {}`

### Output

4. Generate files in `{cwd}/.persona/scenes/{name}/`:

**manifest.json:**
```json
{
  "scene": "{name}",
  "description": "{Q2 answer}",
  "requires": {
    "skills": ["{selected skills}"],
    "mcp": [],
    "plugins": []
  }
}
```

**prompts.json:**
```json
{
  "_meta": { "name": "{name}", "description": "{Q2}", "author": "user", "version": "0.1.0", "tags": [] },
  "_extends": "{Q3 answer or null}",
  "_profile": "{Q5 answer}",
  "_um": "{auto-generate based on scene description}",
  "_aha": "{auto-generate based on scene description}",
  "_memory": [],
  "_actions": { "{Q7 answers}" },
  "_loop_template": null,
  "{skill-overlays from Q6}"
}
```

5. Auto-generate `_um` and `_aha` based on scene description:
   - `_um`: "发散模式 — 面向{description}的探索。\n\n## 无输入时\n扫描 vault 中与{name}相关的内容，发现方向...\n\n## 有输入时\n输入视为目标，进入{description}的分析..."
   - `_aha`: "收敛模式 — 面向{description}的汇总。\n\n## 无输入时\n总结{name}相关的近期进度...\n\n## 有输入时\n按范围总结{description}的产出..."

6. Create `{cwd}/.persona/contexts/{name}.md` with template:
```markdown
# Context — {Name}

## 关键变量
- (在此填写你的项目关键信息)

## 场景背景
- (在此描述当前项目的背景)
```

7. Output confirmation:
```
✓ 场景 {name} 已创建！
  位置：{cwd}/.persona/scenes/{name}/
  依赖：{skills list}
  动作：{actions list or "无"}

  下一步：/go {name} 切换到新场景
  调试：/go {name} --dry-run 查看完整 prompt 组合
```

## Rules

- Store in `{cwd}/.persona/scenes/` (user-local, not in repo)
- If inheriting, only ask for delta (what's different from parent)
- Auto-generated _um/_aha should be sensible defaults, user can later refine
- Keep the conversation flowing — don't dump all questions at once
