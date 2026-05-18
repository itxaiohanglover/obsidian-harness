Converge — summarize progress, clarify the big picture, suggest next steps.

## Philosophy

The user said `/ok` because their notes are ahead of them — they've been working and need to see where they stand. This is convergence: crystallizing scattered progress into clarity.

## Vault path

Read from `~/.claude/obsidian-harness.json`. If missing, ask the user.

## Behavior

### No input — "where am I?"

The user wants a personal standup. Do three things:

1. **Detect recent changes** — scan vault for `.md` files modified in the last 24 hours (exclude `.obsidian/`, `.agents/`)
2. **Summarize in one sentence** — "你这周写了 5 篇笔记，完成了 3 个任务，项目X的文档还差 API 部分"
3. **Suggest one next step** — based on what's incomplete or what was in progress

Silently check environment health (symlinks intact, dependencies present). Only mention if something is broken.

### With input — scope the convergence

The input is a **scope modifier**, not a new command:

| Input | Behavior |
|-------|----------|
| `最近一周` | Summarize this week's output: notes written, tasks completed, tasks carried over. Generate weekly review. |
| `项目A` | Project A status: what's done, what's pending, what's at risk. |
| `今天的日记` | Review today's daily note, surface unfinished tasks and follow-ups. |
| Any other text | Treat as a topic — summarize everything in the vault related to it. |

### In coding scenario

When active profile includes `project` module, `/ok` also detects:
- Code changes that might need documentation updates
- Project notes that are stale or incomplete
- Unfinished action items from meeting notes

## Rules

- One scan, one response. Fast.
- Brief. Like picking up a conversation.
- Use the user's language.
- If the user was mid-task, continue it — don't just summarize.
