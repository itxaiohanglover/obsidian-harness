"""Shared test utilities and fixtures for persona test suite."""

import json
import os
import tempfile
import shutil

REPO_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCENES_DIR = os.path.join(REPO_DIR, "scenes")


def get_all_json_files():
    """Find all JSON files in the repo (excluding .obsidian, node_modules)."""
    results = []
    for root, dirs, files in os.walk(REPO_DIR):
        dirs[:] = [d for d in dirs if d not in (".obsidian", "node_modules", ".git")]
        for f in files:
            if f.endswith(".json"):
                results.append(os.path.join(root, f))
    return results


def get_scene_names():
    """Return list of scene directory names."""
    return [d for d in os.listdir(SCENES_DIR)
            if os.path.isdir(os.path.join(SCENES_DIR, d))]


def load_prompts(scene_name):
    """Load and return prompts.json for a scene."""
    path = os.path.join(SCENES_DIR, scene_name, "prompts.json")
    with open(path) as f:
        return json.load(f)


def load_manifest(scene_name):
    """Load and return manifest.json for a scene."""
    path = os.path.join(SCENES_DIR, scene_name, "manifest.json")
    with open(path) as f:
        return json.load(f)


def resolve_file_refs(data, scene_dir):
    """Resolve @file: references in prompts.json fields."""
    resolved = {}
    for key, val in data.items():
        if isinstance(val, str) and val.startswith("@file:"):
            ref_path = os.path.join(scene_dir, val[6:])
            if os.path.isfile(ref_path):
                with open(ref_path) as rf:
                    resolved[key] = rf.read()
            else:
                resolved[key] = None  # missing file
        else:
            resolved[key] = val
    return resolved


def create_temp_vault(scene_name="daily", source="builtin"):
    """Create a temporary vault with .obsidian and .persona directories."""
    vault = tempfile.mkdtemp()
    os.makedirs(os.path.join(vault, ".obsidian"))
    os.makedirs(os.path.join(vault, ".persona", "contexts"))
    os.makedirs(os.path.join(vault, ".persona", "scenes"))

    with open(os.path.join(vault, ".persona", "profile.md"), "w") as f:
        f.write("# Profile\n")

    active = {
        "scene": scene_name,
        "source": source,
        "activated_at": "2026-05-19T10:00:00Z",
        "last_aha_at": None
    }
    with open(os.path.join(vault, ".persona", "active-scene.json"), "w") as f:
        json.dump(active, f)

    return vault


def cleanup_vault(vault_path):
    """Remove a temporary vault."""
    shutil.rmtree(vault_path, ignore_errors=True)
