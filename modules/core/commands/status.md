Show a quick dashboard of the current Obsidian vault status.

## Vault path

Read from `~/.claude/obsidian-harness.json`. If missing, ask the user.

## What to report

Scan the vault and display a one-line summary, then a brief breakdown:

```
📊 Vault Status: {vault_name}

📁 {total_notes} notes | {total_tags} tags | {daily_notes} daily notes
📅 Last daily note: {date}
🔧 Active profile: {profile_name}
🏗 Last organized: unknown / {date}

Quick actions:
  /daily     — Create today's note
  /organize  — Audit & clean up
  /review    — Weekly/monthly review
```

## Details to collect

1. Total `.md` files (excluding `.obsidian/`)
2. Unique tags across all notes
3. Daily notes (files matching `YYYY-MM-DD.md` or in `Daily/` folder)
4. Date of the most recent daily note
5. Active profile name from config
6. If `.obsidian-harness.json` exists in vault root, read it for version info

Use concise output. No walls of text. Adapt language to user (Chinese if they speak Chinese).
