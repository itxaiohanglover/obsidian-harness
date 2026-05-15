Detect what changed since the user was last here, then continue working.

## Vault path

Read from `~/.claude/obsidian-harness.json`. If missing, ask the user.

## Workflow

### Step 1: Detect recent changes

Run a single scan to find what changed in the last 2 hours:
- Modified or new `.md` files (exclude `.obsidian/`, `.agents/`)
- Read each changed file's content

### Step 2: Compare with context

Check conversation history — were we working on something before the user left?
- If yes → continue that task with the new changes incorporated
- If no → summarize what changed and ask what to do next

### Step 3: Act

Based on what changed and what we were doing:
- If user was writing → continue from where they stopped
- If user reorganized files → acknowledge and suggest next steps
- If user dumped new content → ask if they want `/fuck` to process it

## Keep it fast

One scan, one response. No lengthy analysis. The user said `/ok` because they're back and want to keep moving.

## Tone

Brief. Like picking up a conversation where you left off. Use the user's language.
