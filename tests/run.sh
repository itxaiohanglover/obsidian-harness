#!/bin/bash
# persona test suite — runs all Python unittest modules under tests/
#
# Usage:
#   cd <repo-root>
#   bash tests/run.sh
#
# Exit code: 0 = all pass, 1 = any failure

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

python3 -m unittest discover . -p "test_*.py" -v
