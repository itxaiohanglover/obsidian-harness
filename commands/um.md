Diverge — externalize chaos, discover directions.

## Execution Flow

1. Read `~/.claude/persona.json` → get `repo_path`
2. Read `{cwd}/.persona/active-scene.json` → get current scene name
   - If not found → default to `daily`
3. Locate scene directory:
   - First: `{cwd}/.persona/scenes/{name}/`
   - Fallback: `{repo_path}/scenes/{name}/`
4. Read `prompts.json` → check `_extends` field
   - If `_extends` is not null:
     a. Locate parent scene (local > builtin)
     b. Recursively resolve (if parent also has `_extends`)
     c. Depth check: chain > 3 → error "继承链过深（最多 3 层）"
     d. Cycle check: name repeats → error "继承循环"
     e. Merge — scalars: child wins / null inherits / "" clears;
        _actions: key-level merge `{...parent, ...child}` (null removes);
        _memory: concat + dedupe
     f. Use merged result
   - Extract `_um`, `_profile`, `_memory`, `_actions` from (merged) result
5. Read `{cwd}/.persona/contexts/{scene}.md` → inject context variables
6. Read `{cwd}/.persona/profile.md` → inject global persona
7. Compose: global profile + scene `_profile` + `_um` prompt + context + `_memory`
8. If user input matches any `_actions` trigger → execute that action's prompt instead

## Behavior — No Input

User doesn't know where to start. Detect changes first, then explore:

1. **Change detection** — read `{cwd}/.persona/active-scene.json` → get `activated_at` timestamp
   - Find `.md` files modified since `activated_at` (exclude `.obsidian/`, `.persona/`)
   - If changes found → prioritize these: "自上次切换后，你改了 N 个文件：[[A]]、[[B]]..."
   - Ask: "要从这些变更继续，还是探索新方向？"
2. If no changes (or user picks "探索") → scan vault for signals:
   - Orphan notes (no backlinks)
   - Untagged notes
   - Stale notes (not modified in 30+ days)
   - Broken wikilinks
   - Unchecked tasks (`- [ ]`)
3. Present 2-3 directional questions (not solutions):
   - "你有 N 个未打标签的笔记，要整理吗？"
   - "项目X的笔记上次更新是N天前，要跟进吗？"
   - "最近写了 N 篇零散想法，要合并成一篇？"
4. Wait for user to pick — do NOT act without their choice

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
