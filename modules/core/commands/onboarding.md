Welcome the user to obsidian-harness and guide them through their first experience.

## Step 1: Check install status

Read `~/.claude/obsidian-harness.json` to confirm installation. If not installed, guide the user to install first:
```
npx obsidian-harness init
```

## Step 2: Show what's installed

Read the config and tell the user:
- Which profile is active and what it means
- What skills are available (read from `~/.claude/skills/` symlinks)
- What commands are available (read from `~/.claude/commands/` symlinks)

## Step 3: Interactive demo

Guide the user to try one feature right now:

1. Ask: "你想先试试哪个功能？"
2. Show options:
   - 创建今日日记 → run `/daily`
   - 整理笔记库 → run `/organize`
   - 创建项目笔记 → run `/project`
3. Execute the chosen command immediately
4. After execution, briefly mention other available features

## Step 4: Mention natural language

Tell the user they don't need to memorize commands. They can just say:
- "今天的日记" → `/daily`
- "整理笔记库" → `/organize`
- "建个项目" → `/project`
- "看看这周干了啥" → `/review`
- "切换场景" → `/profile`

## Step 5: Point to profile customization

Mention they can edit their behavior profile at:
`~/.claude/obsidian-harness/active-profile/profile.md`

And switch scenes anytime with `/profile`.

## Tone

Friendly, concise, no walls of text. Use the user's language (Chinese if they speak Chinese). Adapt to their level — if they seem experienced, skip basics.
