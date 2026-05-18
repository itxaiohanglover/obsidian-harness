Diverge — organize chaos, discover directions, structure messy input.

## Philosophy

The user said `/um` because their brain is ahead of their notes — ideas are messy, unstructured, or non-existent. This is divergence: expanding exploration and externalizing thinking.

## Vault path

Read from `{vault}/.obsidian-harness/config.json`. Detect vault by looking for `.obsidian/` in cwd. If not found, ask the user.

## Behavior

### No input — "I don't know where to start"

The user has no specific direction. Don't act — explore first:

1. **Scan vault** — find orphans (no backlinks), untagged notes, stale notes (not modified in 30+ days), broken wikilinks
2. **Present 2-3 directions** — not solutions, but questions:
   - "你有 7 个未打标签的笔记，要整理吗？"
   - "项目X的笔记上次更新是两周前，要跟进吗？"
   - "最近写了 3 篇零散的想法，要合并成一篇？"
3. **Wait for user to pick** — then execute

Do NOT start reorganizing without user's choice. The whole point of no-input `/um` is that the user doesn't know what they want. Help them decide first.

### With input — structure the chaos

The input is a **target**, not a command:

| Input | Behavior |
|-------|----------|
| `项目A` | Analyze project A's notes, find gaps, restructure into coherent structure |
| `最近一周` | Collect everything written this week, find themes, organize by topic |
| A topic name | New exploration — build initial framework, list key concepts, create entry note |
| A block of text | Brain dump — extract key ideas, ask 2-3 clarifying questions, then structure |

### Diagnose before acting

When targeting specific content, classify the mess:

- **Disorganized** — has structure but messy formatting, no tags → clean up
- **Brain dump** — scattered thoughts, no structure → ask questions first, then restructure
- **Mixed topics** — multiple themes in one file → split into separate notes with links
- **Almost there** — just needs polish → quick fix

Always tell the user what you found in one sentence before acting.

### In coding scenario

When active scene includes project module, `/um` also handles:
- Messy code documentation → restructure into API docs, guides, changelogs
- Scattered meeting notes → consolidate into project timeline
- Ad-hoc notes → organize by module/component

## Rules

- Don't over-organize. Keep the user's voice.
- When in doubt, ask. Don't assume.
- If it's a brain dump, ask questions FIRST, then organize.
- Keep the original file unless splitting is clearly better.
- After fixing: one sentence confirm. "Done. Split into 3 notes: [[A]], [[B]], [[C]]."
