Switch scene — enter a different work persona.

## Execution Flow

1. Parse argument: `/go <scene-name>` (no argument → list available scenes)
2. Detect vault: check if `{cwd}/.obsidian/` exists (if not → error: "Not in an Obsidian vault")
3. **First-run check:** if `{cwd}/.persona/` does not exist:
   a. Create `{cwd}/.persona/` directory
   b. Create `{cwd}/.persona/contexts/` directory
   c. Create `{cwd}/.persona/scenes/` directory
   d. Create `{cwd}/.persona/profile.md` with template:
      ```markdown
      # 我的 AI 工作画像

      (在此描述你的工作风格、偏好、习惯。AI 会参考这些来调整行为。)

      ## 风格
      - 

      ## 偏好
      - 
      ```
   e. Output: "🎉 首次使用！已创建 .persona/ 目录。"
   f. Output: "📝 已创建 profile.md — 有空时写几句你的工作风格，AI 会越来越懂你。"
   g. If no argument provided, additionally show: "试试 `/go research` 开始调研模式，或 `/new` 创建自己的场景。"
4. Read `~/.claude/persona.json` → get `repo_path`
5. Locate scene:
   - First: `{cwd}/.persona/scenes/{name}/`
   - Fallback: `{repo_path}/scenes/{name}/`
   - Not found → fuzzy match (exact > prefix > edit distance ≤ 2)
   - Still not found → error with list of available scenes
6. Read `prompts.json` → resolve `@file:` references (string fields starting with `@file:` → read referenced file relative to scene dir) → check `_extends` field
7. **Inheritance Resolution** (if `_extends` is not null):
   a. Read parent scene name from `_extends`
   b. Locate parent scene (same priority: local > builtin)
   c. Recursively resolve parent (if parent also has `_extends`)
   d. **Depth check:** if chain > 3 levels → error: "继承链过深（最多 3 层）：{chain}"
   e. **Cycle check:** if scene name appears twice in chain → error: "继承循环：{cycle}"
   f. Merge prompts:
      - **Scalar fields** (`_um`, `_aha`, `_profile`, `_loop_template`, skill overlays):
        value → child wins; `null`/absent → inherit parent; `""` → clear
      - **Object fields** (`_actions`): key-level merge — `{...parent._actions, ...child._actions}`;
        child key = `null` → remove that action
      - **Array fields** (`_memory`): concat + dedupe — `[...parent._memory, ...child._memory]`
   g. Merge manifest dependencies:
      - `+` prefix items → append to parent's list (dedupe)
      - No `+` prefix → replace parent's list entirely
   h. Use merged result for all subsequent steps
8. Read merged `manifest.json` → check `requires`
9. For each dependency:
   - skill → check `~/.claude/skills/{name}/` exists
   - mcp → check `~/.claude/mcp.json` has that server configured
   - Missing → look up install command in `{repo_path}/registry.json`, show to user
10. Validate merged prompts format (must have `_meta`, `_um`, `_aha`)
11. Read `{cwd}/.persona/contexts/{scene-name}.md`:
    - If exists → confirm context loaded
    - If not exists → suggest: "💡 建议创建 .persona/contexts/{name}.md 添加关键变量"
12. Read merged `_actions` → extract action list
13. Write `{cwd}/.persona/active-scene.json` (merge, not overwrite):
    - If file exists → read existing content, preserve `last_aha_at` if present
    - Update/set: `scene`, `source`, `activated_at`
    ```json
    {"scene": "{name}", "source": "builtin|local", "activated_at": "{ISO timestamp}", "last_aha_at": "{preserved or null}"}
    ```
14. **Recommended plugins check** (first time per scene only):
    - If `.persona/contexts/{name}.md` does not contain `plugins_suggested: true`:
      - Based on scene's skills, suggest Obsidian plugins that enhance the experience:
        - obsidian-cli → "确保 Obsidian 在后台运行（CLI 需要通信）"
        - obsidian-bases → "推荐安装 Bases 插件查看 .base 文件"
        - tutor/tutor-setup → "建议安装 Templater 配合模板使用"
        - excalidraw-diagram → "建议安装 Excalidraw 插件查看 .excalidraw 文件"
        - json-canvas/obsidian-canvas-creator → "Canvas 为 Obsidian 内置功能，无需额外安装"
        - Any scene → "推荐：Homepage（首页入口）、QuickAdd（快速记录）、Obsidian Git（自动同步）"
      - Output as a collapsible tip (only shown once):
        ```
        💡 首次使用提示：
        - 确保 Obsidian 在后台运行（obsidian-cli 需要通信）
        - 推荐插件：Homepage、QuickAdd、Obsidian Git
        ```
      - Append `plugins_suggested: true` to context file (or create it)
15. Output confirmation:
    ```
    ✓ 已切换到 {name}。
    可用动作：{action1}（描述）、{action2}（描述）
    ```

## No Argument — List Scenes

Scan both directories for available scenes:
- `{repo_path}/scenes/*/prompts.json` → builtin scenes
- `{cwd}/.persona/scenes/*/prompts.json` → user-created scenes

Output each scene with one-line description from `_meta.description`:
```
可用场景：
  research   — 调研探索：信息收集、对比分析、综合报告
  coding     — 编码文档：项目笔记、开发日志、会议纪要
  patent-writing — 专利撰写：权利要求、说明书、附图
```

## Fuzzy Matching

Priority: exact match > prefix match > Levenshtein distance ≤ 2.

Examples:
- `code` → matches `coding` (prefix)
- `patent` → matches `patent-writing` (prefix)
- `resarch` → matches `research` (edit distance 1)

## Dependency Check Output

If dependencies are missing:
```
⚠ 缺少依赖：
  - mermaid-visualizer (skill)
    安装：npx skills add git@github.com:axtonliu/axton-obsidian-visual-skills.git

是否现在安装？(Y/n)
```

If user says Y → run install command. If N → continue switching anyway.

## --dry-run Mode

When user says `/go <scene> --dry-run` or `/go <scene> dry-run`:

Resolve everything (inheritance, dependencies, context) but do NOT switch. Display the resolved composition:

```
=== Dry Run: {scene-name} ===

继承链: {scene} → {parent} → ...
（如果无继承：继承链: (无，独立场景)）

--- 合并后 _um ---
{resolved _um, first 200 chars}...

--- 合并后 _aha ---
{resolved _aha, first 200 chars}...

--- _profile ---
{resolved _profile, full. 空则显示 "(空)"}

--- _memory ({count} 条) ---
- {item 1}
- {item 2}
（空则显示 "(无记忆)"）

--- _actions ({count} 个) ---
- {name}: {description} [triggers: ...] ← {来源: 子/父}
- ...

--- Skill Overlays ---
- {skill-name}: {first 100 chars}... ← {来源: 子/父}
- ...

--- 依赖 (manifest) ---
skills: [...] (标注来自父/子追加)
mcp: [...]
plugins: [...]

--- Context ({cwd}/.persona/contexts/{scene}.md) ---
{content or "(文件不存在，建议创建)"}
```

Do NOT write `active-scene.json`. Do NOT switch scene.
Works for both inherited and standalone scenes.

## Rules

- Quick and casual, one line confirm
- Always create `.persona/` directory if it doesn't exist
- Inheritance: resolve `_extends` chain before any other step (max 3 levels, cycle check)
- Show actions list only if merged `_actions` is non-empty
- If inherited, mention parent in confirmation: "✓ 已切换到 {name}（继承自 {parent}）。"
