Manage the user's personal knowledge — habits, preferences, language style, and workflow patterns.

## Storage

User memory is stored at `~/.claude/obsidian-harness/active-profile/prompt.json`. This file serves dual purpose:
- **prompt.json**: skill-specific prompt overrides (existing mechanism)
- **User memory**: accumulated preferences and habits

When the user asks to "remember" something or update preferences, write it into `prompt.json` under a `_memory` key:

```json
{
  "_memory": {
    "habits": ["always writes in Chinese", "prefers bullet points over paragraphs"],
    "phrases": {
      "写好了": "read recent vault changes and process them",
      "搞一下": "deep analysis and organization"
    },
    "workflow": ["collect", "organize", "write", "visualize"],
    "style": {
      "writing": "concise, technical, Chinese with English terms",
      "drawing": "dark theme, architecture diagrams"
    }
  },
  "daily-workflow": "Record learning progress and insights",
  "mermaid-visualizer": "Dark theme, use Chinese labels"
}
```

## Workflow

### No arguments — Show memory

1. Read `prompt.json`
2. If `_memory` exists, display a summary:
   ```
   📝 Your Preferences

   Habits: {list}
   Common phrases: {list}
   Preferred workflow: {flow}
   Style: {summary}

   To update: "记住我喜欢..." or "我的习惯是..."
   ```
3. If `_memory` is empty, say: "You haven't set any preferences yet. Tell me things like '记住我喜欢用中文写笔记' and I'll remember."

### User says "记住..." — Save to memory

1. Parse what the user wants to remember
2. Categorize it: habit / phrase / workflow / style
3. Update `prompt.json` `_memory` section
4. Confirm: "Got it, I'll remember that."

### User describes their workflow — Update workflow

1. Listen to the user describe their typical process
2. Save as an ordered list under `_memory.workflow`
3. Next time they start a similar flow, proactively suggest the next step

## Principles

- Memory is LOCAL only, never sent anywhere
- Read on every skill invocation, write only when user asks
- Keep entries concise — this gets loaded into context
- Merge, don't overwrite — new entries add to existing ones
