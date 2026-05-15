---
name: knowledge-manage
description: Manage knowledge base health — generate indexes, audit tags, detect orphans and broken links. Use when user says "知识管理", "标签整理", "孤儿笔记", "断链检查", "审计知识库", or wants to assess vault health.
depends: ["obsidian-markdown", "obsidian-cli"]
---

# Knowledge Manage

## Overview

Maintain the health of an Obsidian vault as a knowledge base. Generate auto-indexes, audit tags, find orphan notes, and detect broken links.

## Vault path

Read from `~/.claude/obsidian-harness.json`. If missing, ask the user.

## Workflows

### Vault health report

Run all checks and produce a summary:

```
Vault Health Report
===================
Total notes: 142
Total tags: 38
Orphan notes (no backlinks): 12
Broken links: 3
Duplicate/similar tags: 4 pairs
Average links per note: 2.3
```

### Auto-index generation

1. Scan all notes, extract tags and content keywords
2. Cluster notes by shared tags/topics
3. For each cluster with 3+ notes, generate an index note:
   - Filename: `{Topic} Index.md`
   - Content: grouped list of `[[wikilinks]]`
4. Skip if index already exists (update instead)

### Tag audit

1. Extract all tags from frontmatter and inline `#tag` usage
2. Count frequency per tag
3. Detect:
   - Similar tags that should merge (e.g. `#react` vs `#reactjs`)
   - Unused tags (only 1 note, no clear purpose)
   - Inconsistent casing (e.g. `#JavaScript` vs `#javascript`)
4. Suggest merge actions

### Orphan detection

1. For each `.md` note, check if any other note contains `[[Note Name]]`
2. Notes with zero backlinks are orphans
3. Group orphans by topic and suggest:
   - Link them to existing index notes
   - Create new index notes for orphan clusters
   - Archive if no longer relevant

### Broken link detection

1. Find all `[[link targets]]` across vault
2. Check if target `.md` file exists
3. Report broken links with source file and intended target
4. Offer to create stub notes for valid topics or fix typos

### Knowledge graph summary

1. Count notes, links, tags
2. Calculate link density (links per note)
3. Identify hub notes (most backlinks)
4. Identify isolated clusters (groups of notes that link to each other but not to the rest)
