#!/bin/bash
# persona install script

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
CLAUDE_DIR="$HOME/.claude"
COMMANDS_DIR="$CLAUDE_DIR/commands"
CONFIG_FILE="$CLAUDE_DIR/persona.json"

mkdir -p "$COMMANDS_DIR"

COMMANDS=("um" "aha" "go" "distill" "new")

echo "persona — installing commands..."

for cmd in "${COMMANDS[@]}"; do
  TARGET="$COMMANDS_DIR/$cmd.md"
  SOURCE="$REPO_DIR/commands/$cmd.md"

  if [ -e "$TARGET" ] && [ ! -L "$TARGET" ]; then
    echo ""
    echo "  ⚠ /$cmd already exists at $TARGET"
    echo "  Choose: [o]verwrite / [r]ename to persona-$cmd / [s]kip"
    read -r -p "  > " choice
    case "$choice" in
      o|O) rm -f "$TARGET" ;;
      r|R) TARGET="$COMMANDS_DIR/persona-$cmd.md" ;;
      s|S) echo "  Skipped /$cmd"; continue ;;
      *)   echo "  Skipped /$cmd"; continue ;;
    esac
  fi

  ln -sf "$SOURCE" "$TARGET"
  echo "  ✓ /$cmd → $TARGET"
done

cat > "$CONFIG_FILE" << EOF
{
  "version": "0.5.0",
  "installed_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "repo_path": "$REPO_DIR",
  "vaults": [],
  "command_names": {
    "um": "um",
    "aha": "aha",
    "go": "go",
    "distill": "distill",
    "new": "new"
  }
}
EOF

echo ""
echo "  Config: $CONFIG_FILE"
echo ""
echo "Done! Restart Claude Code to activate."
echo "Then: cd <your-vault> && type /go daily"
