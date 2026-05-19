#!/bin/bash
# Persona test suite — zero dependencies (bash + python3 only)
# Usage: ./tests/run.sh [test_name]
# Run all: ./tests/run.sh
# Run one: ./tests/run.sh json_valid

set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PASS=0
FAIL=0
ERRORS=""

# ─── Helpers ───

pass() { PASS=$((PASS + 1)); echo "  ✓ $1"; }
fail() { FAIL=$((FAIL + 1)); ERRORS="$ERRORS\n  ✗ $1"; echo "  ✗ $1"; }

run_test() {
  local test_name="$1"
  local filter="${2:-}"
  if [ -n "$filter" ] && [ "$filter" != "$test_name" ]; then
    return
  fi
  echo ""
  echo "── $test_name ──"
  "$test_name"
}

# ─── Tests ───

test_json_valid() {
  # All JSON files must be valid
  local files
  files=$(find "$REPO_DIR" -name "*.json" -not -path "*node_modules*" -not -path "*.obsidian*" -not -path "*/.DS_Store")
  for f in $files; do
    if python3 -c "import json; json.load(open('$f'))" 2>/dev/null; then
      pass "$(basename "$f") valid"
    else
      fail "$f is invalid JSON"
    fi
  done
}

test_scenes_structure() {
  # Each scene must have manifest.json + prompts.json
  for scene_dir in "$REPO_DIR"/scenes/*/; do
    local name
    name=$(basename "$scene_dir")
    if [ -f "$scene_dir/manifest.json" ]; then
      pass "$name has manifest.json"
    else
      fail "$name missing manifest.json"
    fi
    if [ -f "$scene_dir/prompts.json" ]; then
      pass "$name has prompts.json"
    else
      fail "$name missing prompts.json"
    fi
  done
}

test_prompts_required_fields() {
  # Each prompts.json must have _meta, _um, _aha, _memory, _actions
  for f in "$REPO_DIR"/scenes/*/prompts.json; do
    local name
    name=$(basename "$(dirname "$f")")
    local missing=""
    for field in _meta _um _aha _memory _actions; do
      if ! python3 -c "import json; d=json.load(open('$f')); assert '$field' in d" 2>/dev/null; then
        missing="$missing $field"
      fi
    done
    if [ -z "$missing" ]; then
      pass "$name prompts.json has all required fields"
    else
      fail "$name prompts.json missing:$missing"
    fi
  done
}

test_manifest_required_fields() {
  # Each manifest.json must have scene, description, requires
  for f in "$REPO_DIR"/scenes/*/manifest.json; do
    local name
    name=$(basename "$(dirname "$f")")
    local missing=""
    for field in scene description requires; do
      if ! python3 -c "import json; d=json.load(open('$f')); assert '$field' in d" 2>/dev/null; then
        missing="$missing $field"
      fi
    done
    if [ -z "$missing" ]; then
      pass "$name manifest.json has all required fields"
    else
      fail "$name manifest.json missing:$missing"
    fi
  done
}

test_file_references() {
  # All @file: references must point to existing files
  for f in "$REPO_DIR"/scenes/*/prompts.json; do
    local scene_dir
    scene_dir=$(dirname "$f")
    local name
    name=$(basename "$scene_dir")
    local refs
    refs=$(python3 -c "
import json
d = json.load(open('$f'))
for k, v in d.items():
    if isinstance(v, str) and v.startswith('@file:'):
        print(v[6:])
" 2>/dev/null)
    if [ -z "$refs" ]; then
      pass "$name no @file refs (ok)"
    else
      local all_found=true
      while IFS= read -r ref; do
        if [ -f "$scene_dir/$ref" ]; then
          pass "$name @file:$ref exists"
        else
          fail "$name @file:$ref NOT FOUND (expected at $scene_dir/$ref)"
          all_found=false
        fi
      done <<< "$refs"
    fi
  done
}

test_inheritance_chain() {
  # _extends must point to existing scene, no cycles, depth ≤ 3
  python3 - "$REPO_DIR" << 'PYTHON'
import json, sys, os

repo = sys.argv[1]
scenes_dir = os.path.join(repo, "scenes")
scenes = {}

for name in os.listdir(scenes_dir):
    prompts_path = os.path.join(scenes_dir, name, "prompts.json")
    if os.path.isfile(prompts_path):
        with open(prompts_path) as f:
            data = json.load(f)
        scenes[name] = data.get("_extends")

errors = []
for name, extends in scenes.items():
    if extends is None:
        continue
    # Check target exists
    if extends not in scenes:
        errors.append(f"{name}: _extends '{extends}' not found")
        continue
    # Check cycle and depth
    chain = [name]
    current = extends
    while current is not None:
        if current in chain:
            errors.append(f"{name}: inheritance cycle detected: {' → '.join(chain + [current])}")
            break
        chain.append(current)
        if len(chain) > 4:  # name + 3 parents max
            errors.append(f"{name}: inheritance too deep (>3): {' → '.join(chain)}")
            break
        current = scenes.get(current)
    else:
        print(f"  ✓ {name} → {' → '.join(chain[1:])} (depth {len(chain)-1})")

if errors:
    for e in errors:
        print(f"  ✗ {e}")
    sys.exit(1)
PYTHON
  if [ $? -eq 0 ]; then
    pass "all inheritance chains valid"
  else
    fail "inheritance chain errors (see above)"
  fi
}

test_commands_exist() {
  # All 5 commands must exist
  for cmd in um aha go distill new; do
    if [ -f "$REPO_DIR/commands/$cmd.md" ]; then
      pass "commands/$cmd.md exists"
    else
      fail "commands/$cmd.md missing"
    fi
  done
}

test_install_script() {
  # install.sh must be executable and pass syntax check
  if [ -f "$REPO_DIR/install.sh" ]; then
    pass "install.sh exists"
  else
    fail "install.sh missing"
    return
  fi
  if [ -x "$REPO_DIR/install.sh" ]; then
    pass "install.sh is executable"
  else
    fail "install.sh not executable"
  fi
  if bash -n "$REPO_DIR/install.sh" 2>/dev/null; then
    pass "install.sh syntax valid"
  else
    fail "install.sh has syntax errors"
  fi
}

test_install_dry_run() {
  # Simulate install in temp dir (non-destructive)
  local tmp_home
  tmp_home=$(mktemp -d)
  local tmp_claude="$tmp_home/.claude"
  mkdir -p "$tmp_claude/commands"

  # Run install with HOME override
  HOME="$tmp_home" bash "$REPO_DIR/install.sh" <<< "" 2>/dev/null || true

  # Check symlinks created
  local found=0
  for cmd in um aha go distill new; do
    if [ -L "$tmp_claude/commands/$cmd.md" ] || [ -f "$tmp_claude/commands/$cmd.md" ]; then
      found=$((found + 1))
    fi
  done

  if [ "$found" -ge 4 ]; then
    pass "install creates command symlinks ($found/5)"
  else
    fail "install only created $found/5 command symlinks"
  fi

  # Check persona.json
  if [ -f "$tmp_claude/persona.json" ]; then
    if python3 -c "import json; d=json.load(open('$tmp_claude/persona.json')); assert 'repo_path' in d" 2>/dev/null; then
      pass "persona.json created with repo_path"
    else
      fail "persona.json missing repo_path"
    fi
  else
    fail "persona.json not created"
  fi

  rm -rf "$tmp_home"
}

test_registry_valid() {
  # registry.json must be valid and contain skill entries
  local reg="$REPO_DIR/registry.json"
  if [ ! -f "$reg" ]; then
    fail "registry.json missing"
    return
  fi
  if python3 -c "
import json
d = json.load(open('$reg'))
assert isinstance(d, list), 'registry must be an array'
assert len(d) > 0, 'registry is empty'
for entry in d:
    assert 'name' in entry, f'entry missing name: {entry}'
    assert 'type' in entry, f'entry missing type: {entry}'
" 2>/dev/null; then
    pass "registry.json structure valid"
  else
    fail "registry.json structure invalid"
  fi
}

test_no_stale_references() {
  # CLAUDE.md should not reference deleted files/dirs
  local stale=0
  if grep -q "modules/" "$REPO_DIR/CLAUDE.md" 2>/dev/null; then
    fail "CLAUDE.md still references modules/"
    stale=1
  fi
  if grep -q "scripts/install.js" "$REPO_DIR/CLAUDE.md" 2>/dev/null; then
    fail "CLAUDE.md still references scripts/install.js"
    stale=1
  fi
  if grep -q "obsidian-harness.json" "$REPO_DIR/CLAUDE.md" 2>/dev/null; then
    fail "CLAUDE.md still references obsidian-harness.json"
    stale=1
  fi
  if [ "$stale" -eq 0 ]; then
    pass "no stale references in CLAUDE.md"
  fi
}

# ─── Main ───

echo "🧪 Persona Test Suite"
echo "   repo: $REPO_DIR"

FILTER="${1:-}"

run_test test_json_valid "$FILTER"
run_test test_scenes_structure "$FILTER"
run_test test_prompts_required_fields "$FILTER"
run_test test_manifest_required_fields "$FILTER"
run_test test_file_references "$FILTER"
run_test test_inheritance_chain "$FILTER"
run_test test_commands_exist "$FILTER"
run_test test_install_script "$FILTER"
run_test test_install_dry_run "$FILTER"
run_test test_registry_valid "$FILTER"
run_test test_no_stale_references "$FILTER"

echo ""
echo "════════════════════════"
echo "  Results: $PASS passed, $FAIL failed"
if [ "$FAIL" -gt 0 ]; then
  echo -e "  Failures:$ERRORS"
  echo "════════════════════════"
  exit 1
else
  echo "  All tests passed ✓"
  echo "════════════════════════"
  exit 0
fi
