# obsidian-harness

Obsidian skill collection for Claude Code.

## Prerequisites

This harness extends [kepano/obsidian-skills](https://github.com/kepano/obsidian-skills). Official skills are auto-installed during `init`, no manual step needed.

## User behavior profile — MUST READ FIRST

**Before using any Obsidian skill, read the user's behavior profile.**

The active profile is stored at `~/.claude/obsidian-harness/active-profile/profile.md`. It contains the user's Obsidian habits, preferences, naming conventions, and workflow patterns. Every skill must respect these settings.

If the profile does not exist or is incomplete, ask the user to fill it in. You can find profile templates in `profiles/<name>/profile.md`.

Users can switch profiles at any time:
```bash
npx obsidian-harness switch blogging   # seconds, no reinstall
```

## Vault path

The vault path is stored in `~/.claude/obsidian-harness.json`. After `init`, vault path is remembered — no need to pass `--vault` again. If cwd contains `.obsidian/`, vault is auto-detected.

## Organization principles

- Flat structure at vault root — use `[[wikilinks]]` and index notes, not folders
- Title Case for all filenames
- Standard frontmatter: `created`, `tags`, `aliases`
- Tasks use `- [ ]` / `- [x]` checkbox syntax

## Skill modules

| Module | Skills | Description |
|--------|--------|-------------|
| core | vault-organize, knowledge-manage | Vault organization and knowledge management |
| daily | daily-workflow | Daily notes, task rollover, reviews |
| project | project-notes | Project notes, dev logs, meeting minutes |

## Commands

| Command | Module | Description |
|---------|--------|-------------|
| `/organize` | core | Audit and organize vault structure |
| `/daily` | daily | Create or open today's daily note |
| `/review` | daily | Generate weekly/monthly review |
| `/project` | project | Create a project note |
| `/profile` | core | Switch active profile (no restart needed) |
