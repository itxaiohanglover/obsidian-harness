Switch the active Obsidian scene. Tell Claude which scene to switch to.

## Usage

User says `/go <scene-name>` or naturally: "go to coding", "switch to research", "切换到 daily".

## What to do

1. Detect vault by looking for `.obsidian/` in cwd.
2. Read `{vault}/.obsidian-harness/scenes.json` to find available scenes.
3. If user doesn't specify, list available scenes.
4. Update `{vault}/.obsidian-harness/scene.json` with the new scene.
5. After switching, briefly confirm what changed:
   - "已切换到 {name} 场景"
   - One line about what's different in this scene

## Fuzzy matching

Support fuzzy matching for scene names:
- Exact match first
- Then prefix match
- Then edit distance (Levenshtein) ≤ 2

Example: `/go code` → matches `coding`

## Tone

Quick and casual. One line confirm. No lecture.
