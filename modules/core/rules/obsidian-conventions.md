# Obsidian Conventions

## Naming
- Title Case for all filenames (e.g. `React Server Components.md`)
- No special characters except hyphens in compound terms
- Index/MOC notes: `{Topic} Index.md`
- Daily notes: `YYYY-MM-DD.md`
- Meeting notes: `YYYY-MM-DD {Topic}.md`

## Frontmatter
Every note should have:
```yaml
---
created: YYYY-MM-DD
tags: [tag1, tag2]
---
```
Project notes additionally: `status: active|paused|completed`, `aliases`

## Structure
- Flat at vault root — use `[[wikilinks]]` and index notes for organization
- Only exception: `Daily/` folder for daily notes (optional)

## Links
- Wikilinks: `[[Note Title]]`
- Embeds: `![[Note Title]]`
- Heading links: `[[Note Title#Section]]`
- Block references: `[[Note Title#^block-id]]`

## Tasks
- `- [ ]` unchecked, `- [x]` checked
- Tasks in daily notes are tracked by the daily-workflow skill

## Tags
- Use lowercase with hyphens: `#machine-learning`, `#react`
- Avoid creating near-duplicate tags — merge when spotted
