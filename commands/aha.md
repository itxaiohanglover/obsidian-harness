Converge — summarize progress, crystallize clarity, suggest next step.

## Execution Flow

1. Read `~/.claude/persona.json` → get `repo_path`
2. Read `{cwd}/.persona/active-scene.json` → get current scene name
   - If not found → default to `daily`
3. Locate scene directory:
   - First: `{cwd}/.persona/scenes/{name}/`
   - Fallback: `{repo_path}/scenes/{name}/`
4. Read `prompts.json` → check `_extends` field
   - If `_extends` is not null:
     a. Locate parent scene (local > builtin)
     b. Recursively resolve (if parent also has `_extends`)
     c. Depth check: chain > 3 → error "继承链过深（最多 3 层）"
     d. Cycle check: name repeats → error "继承循环"
     e. Merge — scalars: child wins / null inherits / "" clears;
        _actions: key-level merge `{...parent, ...child}` (null removes);
        _memory: concat + dedupe
     f. Use merged result
   - Extract `_aha`, `_profile`, `_memory`, `_actions` from (merged) result
5. Read `{cwd}/.persona/contexts/{scene}.md` → inject context variables
6. Read `{cwd}/.persona/profile.md` → inject global persona
7. Compose: global profile + scene `_profile` + `_aha` prompt + context + `_memory`
8. If user input matches any `_actions` trigger → execute that action's prompt instead

## Behavior — No Input

Personal standup — quick status check with change awareness:

1. Read `{cwd}/.persona/active-scene.json` → get `activated_at` timestamp
2. Scan vault for `.md` files modified since `activated_at` (exclude `.obsidian/`, `.persona/`)
   - If `activated_at` is older than 24h, fall back to "last 24 hours" scope
3. One-sentence summary: "自切换场景以来，你改了 N 个文件，完成了 N 个任务，项目X还差Y部分"
4. Suggest one next step — based on what's incomplete or in progress
5. Update `{cwd}/.persona/active-scene.json` → set `last_aha_at: "{ISO timestamp}"`
   (This lets /um know when the last convergence happened)

## Behavior — With Input

Input is a scope modifier:

| Input type | Behavior |
|-----------|----------|
| Time range ("最近一周") | Summarize that period's output, generate review |
| Project name | Project status: done / pending / at risk |
| "今天的日记" | Review today's daily note, surface unfinished tasks |
| Other text | Summarize everything in vault related to that topic |

## Distillation Check (End of Every Execution)

After completing the convergence task, review the current session:

- If user corrected AI output → ask: "要记住这个偏好吗？"
- If user confirmed → append to `prompts.json._memory` array
- If user said "记住..." explicitly → immediately append to `_memory`

## Rules

- One scan, one response — fast
- Brief, like picking up a conversation
- Use user's language
- If user was mid-task, continue it — don't just summarize
- If `_actions` trigger matches user input, execute that action prompt
