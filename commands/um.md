Diverge — externalize chaos, discover directions.

## Execution Flow

0. **Environment check:**
   - If `{cwd}/.obsidian/` does not exist → **degraded mode**: skip vault-specific steps (no scene loading, no vault scan). Act as a general divergent assistant using only the user's input. Output: "（当前不在 Obsidian vault 中，通用模式）"
   - If `{cwd}/.persona/` does not exist → run onboarding (same as /go step 3: create `.persona/`, `contexts/`, `scenes/`, `profile.md` template). Output: "🎉 首次使用！已创建 .persona/ 目录。"
1. Read `~/.claude/persona.json` → get `repo_path`
2. Read `{cwd}/.persona/active-scene.json` → get current scene name
   - If not found → default to `daily`
3. Locate scene directory:
   - First: `{cwd}/.persona/scenes/{name}/`
   - Fallback: `{repo_path}/scenes/{name}/`
4. Read `prompts.json` → resolve inheritance if `_extends` is set (rules in CLAUDE.md "场景继承" section)
   - Resolve `@file:` references: if any string field starts with `@file:`, read the referenced file (path relative to scene dir) and use its content as the field value. If file not found → error: "@file 引用找不到：{path}"
   - Extract `_um`, `_profile`, `_memory`, `_actions` from resolved/merged result
5. Read `{cwd}/.persona/contexts/{scene}.md` → inject context variables
6. Read `{cwd}/.persona/profile.md` → inject global persona
7. Compose: global profile + scene `_profile` + `_um` prompt + context + `_memory`
8. If user input matches any `_actions` trigger → execute that action's prompt instead

## Behavior — No Input

User doesn't know where to start. Lightweight detection first:

1. **Change detection** (lightweight, always first) — read `{cwd}/.persona/active-scene.json` → get `activated_at`
   - Find `.md` files modified since `activated_at` (exclude `.obsidian/`, `.persona/`)
   - If changes found → show them and stop here:
     "自上次切换后，你改了 N 个文件：[[A]]、[[B]]..."
     "要从这些变更继续，还是探索新方向？"
   - Wait for user choice. Do NOT proceed to step 2 automatically.
2. **Quick signal** (only if no changes, or user picks "探索") — pick ONE most actionable signal:
   - Priority: unchecked tasks (`- [ ]`) > stale project notes (>14 days) > orphan notes
   - Present ONE directional question, not a list of 5:
     "你有 3 个未完成任务在 [[项目X]] 中，要跟进吗？"
   - If nothing found → "vault 状态良好，想探索什么新方向？"
3. Wait for user to pick — do NOT act without their choice

## Behavior — With Input

Input is a target, not a command:

| Input type | Behavior |
|-----------|----------|
| Change-related ("看看改了什么", "变更", "diff", "改了啥") | Run change detection (same as No Input step 1), show changes regardless |
| Wikilink (`[[Note Name]]`) or file path | **Focus/Dive mode** — see below |
| Project name | Analyze project notes, find gaps, suggest restructure |
| Time range | Collect content from that period, find themes |
| Topic name | New exploration — build framework, list key concepts |
| Text block | Brain dump — extract ideas, ask 2-3 questions, then organize |
| Large text block (>500 chars) | Treat as brain dump — split into themes, create linked notes |

## Focus / Dive Mode

When input is a wikilink or an existing note name — enter progressive deepening:

1. Read the target note
2. Identify sections/themes that could be sub-notes (## headings, bullet clusters, long paragraphs)
3. Present structure map:
   ```
   📄 {Note Name}
   ├── 主题A (已有子笔记 [[A]])
   ├── 主题B (建议拆分 → 可创建 [[B]])
   └── 主题C (内容较少，保留)
   ```
4. Ask: "要深入哪个主题？我可以帮你展开成独立笔记。"
5. When user picks a topic:
   a. Create sub-note with backlink to parent
   b. In parent, replace section with `[[sub-note]]` link + one-line summary
   c. In sub-note, scaffold structure for deeper exploration
   d. Ask: "继续深入 [[sub-note]] 的某个部分，还是回到 [[parent]]？"

This creates the pattern: **宏观笔记 → 拆子文件 → 链接 → 聚焦 → 继续深入**

Rules for Focus mode:
- Never delete content — move it to sub-notes
- Always maintain bidirectional links (parent ↔ child)
- Sub-note naming: `{Topic}.md` (same convention as split-note, keep vault clean)
- In parent, link as `[[Topic]]` with context: `→ [[Topic]] — 一句话描述`
- If sub-note already exists, open and analyze it instead of recreating

## Diagnosis Before Acting

Classify the mess:
- **Disorganized** — has structure but messy → clean up
- **Brain dump** — no structure → ask questions FIRST, then restructure
- **Mixed topics** — multiple themes in one file → split into separate notes with links
- **Almost there** — just needs polish → quick fix

Always tell user what you found in one sentence before acting.

## Rules

- Diagnose before acting (one sentence about what you found)
- Don't over-organize — keep user's voice
- Brain dumps: ask questions FIRST, don't assume
- After fixing: one sentence confirm ("Done. Split into 3 notes: [[A]], [[B]], [[C]].")
- If `_actions` trigger matches user input, execute that action prompt
