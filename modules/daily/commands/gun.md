Switch the active Obsidian skill profile. Tell Claude which profile to switch to.

## Usage

User says `/gun <profile-name>` or naturally: "gun 到 book", "滚到 writing", "切换到 patent".

## What to do

1. List available profiles if user doesn't specify one:
   ```bash
   npx obsidian-harness profiles
   ```

2. Switch to the target profile:
   ```bash
   npx obsidian-harness switch <name>
   ```

3. After switching, briefly confirm what changed:
   - "已切换到 {name}，加载了 {n} 个专属命令"
   - If the new profile added new commands, list them in one line

## Tone

Quick and casual. One line confirm. No lecture.
