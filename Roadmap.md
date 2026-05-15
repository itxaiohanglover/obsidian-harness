---
created: 2026-05-15
tags: [roadmap, planning]
aliases: [路线图]
---

# Roadmap

## v0.1 — Foundation (current)

- [x] Project structure and installation skeleton
- [x] Core module: vault-organize, knowledge-manage
- [x] Daily module: daily-workflow, review command
- [x] Project module: project-notes, meeting templates
- [x] Profile system (default, blogging, project, learning) with user behavior portrait
- [x] `switch` subcommand for instant profile switching
- [x] `/profile` command for in-session switching
- [x] Vault path memory + auto-detection (.obsidian/)
- [x] Project-level vault marker (.obsidian-harness.json)
- [x] skill-registry.json dependency dictionary
- [x] install.js installer with dependency checking
- [x] Dogfooding: project IS an Obsidian vault

## v0.2 — Polish

- [ ] SessionStart hook: auto-check skill dependencies at Claude Code launch
- [ ] `obsidian-harness update` command: refresh installed skills
- [ ] Test install on clean environment (macOS, Linux)
- [ ] Interactive profile selection (prompt if no --profile flag)
- [ ] README translations (中文)

## v0.3 — Extended Modules

- [ ] memory-sync module: sync [[Claude Code]] memory to Obsidian vault notes
- [ ] web-clip module: save web content to vault using defuddle
- [ ] git-sync module: git-based vault version control workflows

## v0.4 — Community

- [ ] Publish to npm registry
- [ ] Submit to awesome-openclaw-skills catalog
- [ ] Contribution guide for new skill submissions

## Ideas

- Integration with Obsidian community plugins (Dataview, Templater, Tasks)
- Canvas-based vault visualization using axton-obsidian-visual-skills
- Learning module integration with [[tutor-setup]] and [[tutor]]

---

Related: [[Architecture]]
