---
created: 2026-05-15
tags: [architecture, design]
aliases: [系统架构]
---

# Architecture

## Overview

obsidian-harness is a curated collection of Obsidian skills for [[Claude Code]]. It complements the official [kepano/obsidian-skills](https://github.com/kepano/obsidian-skills) by adding workflow, organization, and knowledge management layers.

## Design Principles

1. **Flat over nested** — Skills, vault notes, and project structure all favor flat organization with links over deep hierarchies
2. **Reference, don't duplicate** — Third-party skills stay in their own repos; we declare dependencies, not copy code
3. **Dogfood everything** — This project IS an Obsidian vault; development docs use the same conventions the skills enforce
4. **Profile-based installation** — Users install only what they need via profiles (`default`, `blogging`, `project`, `learning`)
5. **One-command setup** — `npx obsidian-harness init --vault <path>` auto-installs all dependencies; no manual prerequisite steps

## Module System

See [[Roadmap]] for evolution plans.

| Module | Skills | Purpose |
|--------|--------|---------|
| core | vault-organize, knowledge-manage | Vault structure and knowledge health |
| daily | daily-workflow | Daily notes, task rollover, periodic reviews |
| project | project-notes | Project dashboards, dev logs, meeting minutes |

## Dependency Architecture

```
skill-registry.json         ← Dependency resolution dictionary (official=auto, others=on-demand)
       ↓
SKILL.md frontmatter       ← Each skill declares depends: ["name", ...]
       ↓
install.js                  ← Reads both, auto-installs official + on-demand deps by source grouping
```

## Installation Flow

1. User runs `npx obsidian-harness init --vault ~/MyVault`
2. Installer reads selected profile → determines modules
3. Scans each module for skills/commands/templates/rules
4. Symlinks skills to `~/.claude/skills/`
5. Symlinks commands to `~/.claude/commands/`
6. Copies templates to `vault/.obsidian/templates/obsidian-harness/`
7. Copies rules to `vault/.obsidian/rules/obsidian-harness/`
8. Writes `~/.claude/obsidian-harness.json` with config + vault marker `.obsidian-harness.json`
9. Deploys `profile.md` (user behavior portrait) to `~/.claude/obsidian-harness/active-profile/`
10. **Phase 1**: Auto-installs all `category: official` skills from registry (always required)
11. **Phase 2**: Scans all `depends` from selected modules' skills, auto-installs missing deps by source grouping
12. Shows optional skills (non-official, not in depends) for manual install if desired

## Profile Switching

`npx obsidian-harness switch <name>` — Removes stale skills, installs new profile's modules, updates config. No dependency reinstall. Seconds.

## Future

See [[Roadmap]] for planned features.
