# obsidian-harness

Obsidian skill collection for Claude Code.

## Prerequisites

This harness extends [kepano/obsidian-skills](https://github.com/kepano/obsidian-skills). Official skills are auto-installed during `init`, no manual step needed.

## User behavior profile — MUST READ FIRST

**Before using any Obsidian skill, read the user's behavior profile.**

The active profile is stored at `~/.claude/obsidian-harness/active-profile/profile.md`. It contains the user's Obsidian habits, preferences, naming conventions, and workflow patterns. Every skill must respect these settings.

If the profile does not exist or is incomplete, ask the user to fill it in. You can find profile templates in `profiles/<name>/profile.md`.

## Scene-specific prompts (prompt.json)

**After reading the profile, check if there are scene-specific prompts for the skill you're about to use.**

The file `~/.claude/obsidian-harness/active-profile/prompt.json` maps skill names to custom prompts. Before executing any skill:

1. Read `prompt.json`
2. If the skill name has an entry, prepend that prompt to the skill's default instructions
3. If no entry exists, use the skill's default behavior

Users can edit `prompt.json` to customize how each skill behaves in their current scene.

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

## Atomic commands (always available)

| Command | What user means | What to do |
|---------|----------------|------------|
| `/ok` | "I'm back, continue" | Detect vault changes since last interaction, continue working |
| `/fuck` | "This is a mess, fix it" | Auto-diagnose: organize / untangle / restructure / split |
| `/gun <name>` | "Switch to scene" | Switch profile, load scene-specific commands |

## Profile-loaded commands (available when module is included)

| Command | Module | Description |
|---------|--------|-------------|
| `/organize` | core | Audit and organize vault structure |
| `/daily` | daily | Create or open today's daily note |
| `/review` | daily | Generate weekly/monthly review |
| `/project` | project | Create a project note |

## Natural language intent routing

**Users should NOT need to memorize commands.** When the user speaks naturally, match their intent:

| User might say | Route to |
|---------------|----------|
| "我改好了", "继续", "我回来了", "好了" | `/ok` |
| "这什么鬼", "帮我整理", "太乱了", "搞一下" | `/fuck` |
| "滚到xxx", "切到xxx", "换个场景" | `/gun xxx` |
| "记住", "我的习惯是" | Save to prompt.json `_memory` |

If the user's intent doesn't match any command, just help them directly — don't force a command.

## Proactive suggestions

After completing any action, briefly consider if a follow-up would be helpful. Keep suggestions to one short sentence. Don't be pushy.
