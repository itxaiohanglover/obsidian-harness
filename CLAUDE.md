# obsidian-harness

Obsidian workflow layer for Claude Code. Brand: **oh-my-god**.

## Core philosophy

Knowledge work alternates between two states:

- **Divergence** (发散) — brain is ahead of notes, messy, needs structure → `/fuck`
- **Convergence** (收敛) — notes are ahead of brain, needs summary and clarity → `/ok`

Users don't need to memorize commands. They feel their state and type one word.

## Prerequisites

This harness extends [kepano/obsidian-skills](https://github.com/kepano/obsidian-skills). Official skills are auto-installed during `init`.

## User behavior profile — MUST READ FIRST

Read `~/.claude/obsidian-harness/active-profile/profile.md` before using any skill. It contains the user's habits, preferences, and workflow patterns. Every skill must respect these settings.

If the profile doesn't exist or is incomplete, ask the user to fill it in.

## Scene-specific prompts (prompt.json)

Check `~/.claude/obsidian-harness/active-profile/prompt.json` before executing any skill. If a skill name has an entry, prepend that prompt to the skill's default instructions.

The `_memory` key stores user preferences and phrases. Respect it.

## Vault path

Stored in `~/.claude/obsidian-harness.json`. If cwd contains `.obsidian/`, vault is auto-detected.

## Organization principles

- Flat structure at vault root — use `[[wikilinks]]` and index notes, not folders
- Title Case for all filenames
- Standard frontmatter: `created`, `tags`, `aliases`
- Tasks use `- [ ]` / `- [x]` checkbox syntax

## Skill modules

| Module | Skills | When to include |
|--------|--------|----------------|
| daily (always) | vault-organize, knowledge-manage, daily-workflow | Default. Daily notes, vault health, organization |
| project (optional) | project-notes | Coding scenario. Project notes, meetings, dev logs |

## Atomic commands

Only 3 commands. Everything else is natural language.

| Command | State | What to do |
|---------|-------|------------|
| `/ok` | Convergence — notes ahead of brain | Summarize progress, detect changes, suggest next steps. Health check silently. |
| `/fuck` | Divergence — brain ahead of notes | Scan for problems, organize chaos, structure messy input. Ask before acting when no target. |
| `/gun <name>` | Switch scene | Switch profile via `npx obsidian-harness switch <name>`. Fuzzy matching enabled. |

### Input = scope modifier

- `/ok` (no input) → personal standup: recent changes + next step
- `/ok 最近一周` → weekly review
- `/ok 项目A` → project status
- `/fuck` (no input) → vault scan, present 2-3 problem directions
- `/fuck 项目A` → restructure project A's notes
- `/fuck 最近一周` → organize this week's messy output

## Natural language intent routing

Users should NOT need to memorize commands. Match intent:

| User might say | Route to |
|---------------|----------|
| "我改好了", "继续", "我回来了", "好了" | `/ok` |
| "这什么鬼", "帮我整理", "太乱了", "搞一下" | `/fuck` |
| "滚到xxx", "切到xxx", "换个场景" | `/gun xxx` |
| "今天的日记", "日记" | Create daily note via daily-workflow skill |
| "帮我记一下会议" | Create meeting note via project-notes skill |
| "记住", "我的习惯是" | Save to prompt.json `_memory` |
| "周报", "月报" | `/ok 最近一周` / `/ok 最近一月` |

If intent doesn't match any command, just help directly.

## Proactive suggestions

After completing any action, one short sentence suggestion max. Don't be pushy.
