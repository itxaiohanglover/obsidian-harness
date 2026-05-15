---
name: daily-workflow
description: Daily note workflow — create from template, rollover unfinished tasks, generate reviews. Use when user says "daily", "日记", "今天", "daily note", "周报", "weekly review", or wants daily/periodic note management.
depends: ["obsidian-cli", "obsidian-markdown"]
---

# Daily Workflow

## Overview

Manage daily and periodic notes in Obsidian. Create daily notes from templates, inherit unfinished tasks from yesterday, and generate weekly/monthly reviews.

## Vault path

Read from `~/.claude/obsidian-harness.json`. If missing, ask the user.

## Templates

Templates are stored at `{vault}/.obsidian/templates/obsidian-harness/`. If the template directory doesn't exist, create it and write default templates.

## Workflows

### Create daily note

1. Check if today's note exists: `{YYYY-MM-DD}.md` (e.g. `2026-05-15.md`)
2. If exists, open it for the user
3. If not, create from template `daily.md`:
   - Replace `{{date}}` with `YYYY-MM-DD`
   - Replace `{{weekday}}` with day name (Monday, Tuesday, etc.)
   - Replace `{{prev_day}}` and `{{next_day}}` with adjacent dates
   - Replace `{{yesterday_unfinished}}` with unfinished tasks from yesterday
4. Add navigation links at bottom: `← [[Prev Day]] | [[Next Day]] →`

### Task rollover

1. Read yesterday's daily note
2. Extract all `- [ ]` (unchecked) tasks
3. If today's note doesn't exist yet, include them in `{{yesterday_unfinished}}`
4. If today's note exists, append them under a `## Rolled Over` section
5. In yesterday's note, add `(→ [[Today]])` next to rolled-over tasks

### Weekly review

1. Collect all daily notes from the past 7 days
2. Extract:
   - Completed tasks (`- [x]`)
   - Unfinished tasks (`- [ ]`)
   - Highlights section content
   - Notes section content
3. Generate a review note at `Weekly Review {YYYY}-W{WW}.md`:
   - Summary of accomplishments
   - Carry-over tasks for next week
   - Key insights or highlights
   - Links to all daily notes reviewed
4. Use template `weekly-review.md`

### Monthly review

Same as weekly but spanning 30 days. Generate at `Monthly Review {YYYY}-{MM}.md`.

## Integration with obsidian-cli

When Obsidian is running, prefer `obsidian-cli` for operations:
- `obsidian daily:read` to read today's note
- `obsidian daily:append` to add content
- `obsidian search` to find past notes

When Obsidian is not running, fall back to direct file operations (Read/Write/Edit tools on the vault path).
