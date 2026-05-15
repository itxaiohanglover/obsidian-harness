---
name: project-notes
description: Create structured project notes, dev logs from git history, and meeting minutes. Use when user says "project", "项目笔记", "dev log", "开发日志", "meeting notes", "会议纪要", or wants to document a project.
depends: ["obsidian-markdown"]
---

# Project Notes

## Overview

Create and maintain structured notes for projects, development logs, and meetings. Extract git history for dev logs and maintain project dashboards.

## Vault path

Read from `~/.claude/obsidian-harness.json`. If missing, ask the user.

## Workflows

### Create project note

1. Ask for project name (or infer from context)
2. Create `{Project Name}.md` using template `project.md`
3. Fill in:
   - Project description and goals
   - Status frontmatter (`active`, `paused`, `completed`)
   - Links to related notes, tasks, and resources
4. Add to relevant index note if one exists

### Dev log from git

1. Run `git log --since="today"` in the project directory
2. Parse commit messages
3. Create or append to a dev log note:
   - Date section with commits listed
   - Auto-summarize related commits into themes
   - Link to the project note via `[[Project Name]]`
4. If no project directory is obvious, ask which project

### Meeting minutes

1. Create from template `meeting.md`
2. Structure:
   - Meeting metadata (date, attendees, project)
   - Agenda items
   - Decisions made
   - Action items with owners and due dates
   - Next meeting date
3. Link action items to relevant project notes
4. Use callout syntax for decisions: `> [!decision] Decision text`

### Update project status

1. Read the project note's frontmatter
2. Update `status` field (`active` → `paused` → `completed`)
3. Update `updated` date
4. Add a changelog entry at the bottom of the note

## Naming conventions

- Project notes: `{Project Name}.md` (Title Case)
- Dev logs: `{Project Name} Dev Log.md`
- Meeting minutes: `{Date} {Meeting Topic}.md` (e.g. `2026-05-15 Sprint Planning.md`)
