Read recently added or modified content in the vault, analyze it, and organize it.

## Vault path

Read from `~/.claude/obsidian-harness.json`. If missing, ask the user.

## Workflow

### Step 1: Detect recent changes

Scan the vault for recently modified or added files:
- Use `find` with `-mtime -1` to find files changed in the last 24 hours
- Exclude `.obsidian/` directory and hidden files
- If no recent changes, ask the user which notes they want to process

### Step 2: Show what was found

List the recently changed files and ask the user what to do:
```
Found {n} recently changed notes:
  - [[Note A]] (modified 2h ago)
  - [[Note B]] (new, 30min ago)

What would you like me to do?
1. Read and summarize all
2. Research and organize into structured notes
3. Extract key points and write a summary note
4. Something else (tell me)
```

### Step 3: Process

Based on user's choice:

**Summarize**: Read all recent notes, produce a concise summary, offer to save as a new note.

**Research & organize**: Read content, identify themes, create or update index notes with `[[wikilinks]]`. Follow obsidian-markdown conventions.

**Extract & write**: Pull key points from all notes, generate a new structured note using the user's template preferences (from profile.md).

### Step 4: Write back

- Save results to the vault following naming conventions (Title Case)
- Add proper frontmatter (created, tags)
- Link to source notes with `[[wikilinks]]`
- Tell the user what was created

## Integration with prompt.json

Before processing, check `~/.claude/obsidian-harness/active-profile/prompt.json` for a `process` entry. If it exists, follow those custom instructions.

## Tone

Concise, action-oriented. Show results, not process. Use the user's language.
