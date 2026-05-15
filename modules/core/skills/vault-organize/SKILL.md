---
name: vault-organize
description: Audit and organize vault structure, generate MOCs, normalize naming conventions. Use when user says "organize vault", "整理笔记库", "生成索引", "MOC", or wants to clean up their Obsidian vault.
depends: ["obsidian-markdown"]
---

# Vault Organize

## Overview

Audit and restructure an Obsidian vault following flat-organization principles. Generate Maps of Content (MOCs), normalize naming, and maintain link integrity.

## Vault path

Read vault path from `~/.claude/obsidian-harness.json`. If missing, ask the user.

## Conventions

### Naming
- Title Case for all filenames (e.g. `React Server Components.md`)
- No special characters except hyphens in compound terms
- Index/MOC notes use suffix `Index` (e.g. `RAG Index.md`, `Skills Index.md`)

### Structure
- Flat at root level — no subdirectories for organization
- Use `[[wikilinks]]` and index notes instead of folders
- The only exception is `Daily/` for daily notes if the user prefers separation

### Frontmatter standard
```yaml
---
created: 2026-05-15
tags: [tag1, tag2]
aliases: [Alternative Name]
---
```

## Workflows

### Generate MOC (Map of Content)

1. Ask user for the MOC topic (e.g. "RAG", "React", "Productivity")
2. Search vault for all notes related to that topic (by tags, content keywords, or filename)
3. Create or update an index note at `{Topic} Index.md`:
   ```markdown
   # {Topic} Index

   ## Core Concepts
   - [[Note A]]
   - [[Note B]]

   ## Related
   - [[Note C]]
   ```
4. Use `obsidian-markdown` conventions for formatting

### Naming audit

1. Scan all `.md` files in vault
2. Report files that violate Title Case convention
3. Offer to rename, updating all `[[]]` references across vault
4. Use bash: `find "$VAULT" -name "*.md" -not -path '*/.obsidian/*'`

### Structure audit

1. Scan for subdirectories beyond `Daily/` and `.obsidian/`
2. List notes inside subdirectories
3. Suggest moving to root and replacing folder structure with index notes + wikilinks

### Batch rename

1. Accept a mapping of old → new names
2. For each rename: `mv` the file, then `sed` all `[[]]` references vault-wide
3. Verify no broken links remain
