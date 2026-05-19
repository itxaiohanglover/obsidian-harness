Distill — refine scattered memories into structured persona profile.

## Execution Flow

1. Read `{cwd}/.persona/active-scene.json` → get current scene name
   - If not found → error: "先用 /go 切换到一个场景"
2. Read `~/.claude/persona.json` → get `repo_path`
3. Locate scene prompts.json (same priority as /um: local > builtin)
4. Read `prompts.json._memory` → get memory list
5. Read `prompts.json._profile` → get current profile
6. If `_memory` is empty or has fewer than 3 entries:
   - Output: "当前记忆不足（{count} 条）。继续使用 /um 和 /aha，AI 会逐渐积累你的偏好。"
   - Exit
7. Analyze `_memory` patterns:
   - **Repeated** (similar content 3+ times) → candidate for promotion to `_profile`
   - **Contradictory** (conflicting preferences) → list both, ask user which to keep
   - **Stale** (only appeared once, seems one-off) → suggest removal
8. Generate rewritten `_profile` draft:
   - Incorporate promoted memories
   - Keep existing profile content that isn't contradicted
   - Stay concise (max 500 words)
9. Display diff:
   ```
   === 当前 _profile ===
   {old content}

   === 建议更新 ===
   {new content}

   === 变更说明 ===
   - 新增：从记忆中提升了 N 条偏好
   - 移除：清理了 N 条已过时/矛盾的记忆
   ```
10. Wait for user confirmation:
    - User confirms → write new `_profile` to prompts.json, remove promoted entries from `_memory`
    - User rejects or modifies → apply their edits, then write
    - User cancels → no changes

## What Gets Promoted

| Memory pattern | Action |
|---------------|--------|
| "我喜欢X" appearing 3+ times in variations | Promote to _profile as a clear preference |
| Correction pattern (user corrected same thing multiple times) | Promote as a rule |
| One-time specific instruction | Keep in _memory, don't promote |
| Contradicts existing _profile | Ask user to resolve |

## Rules

- MUST show diff and get confirmation before writing
- Never delete memories user hasn't agreed to delete
- _profile after rewrite should stay under 500 words
- Preserve user's voice — don't over-formalize their preferences
- If user asks "记住了什么" without /distill intent, just show _memory list without rewriting
