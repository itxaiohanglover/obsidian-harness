Deal with whatever mess is in front of you. Auto-detect: organize, untangle thoughts, or restructure.

## Vault path

Read from `~/.claude/obsidian-harness.json`. If missing, ask the user.

## What this does

The user has something messy and wants it fixed. Your job is to figure out WHAT kind of mess it is and handle it.

## Workflow

### Step 1: Find the mess

1. If the user mentioned a specific file → read that file
2. If not → scan for the most recently modified file, or ask "which file?"

### Step 2: Diagnose

Read the content and classify:

**Type A: Disorganized content** — has structure but messy formatting, inconsistent naming, no tags
→ Fix: clean up formatting, add frontmatter, normalize structure, add tags

**Type B: Brain dump** — scattered thoughts, no structure, stream of consciousness
→ Fix: ask 2-3 targeted questions to understand the core idea, then restructure into organized notes

**Type C: Mixed content** — multiple topics crammed into one file
→ Fix: split into separate notes with proper links between them

**Type D: Almost there** — mostly organized but needs polish
→ Fix: quick polish — tighten language, fix links, add missing context

### Step 3: Execute

Tell the user what you found (one sentence): "This looks like a brain dump about X. I'll restructure it into 3 sections."

Then do it. Write back to the vault. Link related notes.

### Step 4: Quick confirm

After fixing, one sentence: "Done. Split into 3 notes: [[A]], [[B]], [[C]]. Want me to do anything else?"

## Rules

- Don't over-organize. Keep the user's voice and intent.
- When in doubt, ask. Don't assume.
- If it's a brain dump, ask questions FIRST, then organize.
- Keep the original file unless splitting is clearly better.
