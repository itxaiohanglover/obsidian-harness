Converge — summarize progress, crystallize clarity, suggest next step.

## Execution Flow

0. **Environment check:**
   - If `{cwd}/.obsidian/` does not exist → **degraded mode**: skip vault-specific steps (no scene loading, no vault scan). Act as a general convergent assistant — summarize what user has been working on based on conversation context only. Output: "（当前不在 Obsidian vault 中，通用模式）"
   - If `{cwd}/.persona/` does not exist → run onboarding (same as /go step 3: create `.persona/`, `contexts/`, `scenes/`, `profile.md` template). Output: "🎉 首次使用！已创建 .persona/ 目录。"
1. Read `~/.claude/persona.json` → get `repo_path`
2. Read `{cwd}/.persona/active-scene.json` → get current scene name
   - If not found → default to `research`
3. Locate scene directory:
   - First: `{cwd}/.persona/scenes/{name}/`
   - Fallback: `{repo_path}/scenes/{name}/`
4. Read `prompts.json` → resolve inheritance if `_extends` is set (rules in CLAUDE.md "场景继承" section)
   - Resolve `@file:` references: if any string field starts with `@file:`, read the referenced file (path relative to scene dir) and use its content as the field value. If file not found → error: "@file 引用找不到：{path}"
   - Extract `_aha`, `_profile`, `_memory`, `_actions` from resolved/merged result
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

## Distillation Check (Explicit Trigger Only)

Do NOT proactively review the entire session for corrections. Only act on explicit signals:

- If user said "记住..." or "remember..." → immediately append to `_memory`
- If user explicitly said "不是"/"错了"/"别这样" to correct AI output in this turn → ask once: "要记住这个偏好吗？"
- If user confirmed → append to `prompts.json._memory` array
- If _memory has 5+ entries → add one line at end of output: "💡 已积累 {count} 条记忆，随时可以 /distill 精炼画像。"

Do NOT scan session history looking for implicit corrections. Keep it lightweight.

## Rules

- One scan, one response — fast
- Brief, like picking up a conversation
- Use user's language
- If user was mid-task, continue it — don't just summarize
- If `_actions` trigger matches user input, execute that action prompt
