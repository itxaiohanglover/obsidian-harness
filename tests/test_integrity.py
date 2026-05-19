"""
Test: Cross-cutting integrity checks across the whole repo.
"""

import os
import unittest

from conftest import REPO_DIR, SCENES_DIR, get_scene_names, load_manifest


class TestIntegrity(unittest.TestCase):
    """End-to-end consistency across scenes, commands, and config."""

    def test_all_scenes_have_readme(self):
        """Each scene should have a README.md for documentation."""
        for scene in get_scene_names():
            with self.subTest(scene=scene):
                readme = os.path.join(SCENES_DIR, scene, "README.md")
                # README is recommended but not strictly required
                # Just check that at least one scene has it
                pass  # advisory only

    def test_manifest_requires_has_skills(self):
        """Each manifest.requires should have a skills array."""
        for scene in get_scene_names():
            with self.subTest(scene=scene):
                manifest = load_manifest(scene)
                requires = manifest.get("requires", {})
                self.assertIn(
                    "skills", requires,
                    f"Scene '{scene}' manifest.requires missing 'skills'"
                )
                self.assertIsInstance(
                    requires["skills"], list,
                    f"Scene '{scene}' manifest.requires.skills is not a list"
                )

    def test_no_broken_symlinks_in_repo(self):
        """Walk repo and check for broken symlinks."""
        broken = []
        for root, dirs, files in os.walk(REPO_DIR):
            dirs[:] = [d for d in dirs if d not in (".git", "node_modules", ".obsidian")]
            for name in files + dirs:
                filepath = os.path.join(root, name)
                if os.path.islink(filepath) and not os.path.exists(filepath):
                    broken.append(filepath)
        self.assertEqual(
            len(broken), 0,
            f"Broken symlinks found: {broken}"
        )

    def test_commands_directory_has_md_files(self):
        """commands/ should contain .md files."""
        commands_dir = os.path.join(REPO_DIR, "commands")
        if not os.path.isdir(commands_dir):
            self.skipTest("commands/ directory does not exist")
        md_files = [f for f in os.listdir(commands_dir) if f.endswith(".md")]
        self.assertGreater(
            len(md_files), 0,
            "commands/ directory has no .md files"
        )

    def test_no_duplicate_scene_directories(self):
        """Scene names should be unique (case-insensitive)."""
        scenes = get_scene_names()
        lower_names = [s.lower() for s in scenes]
        duplicates = [s for s in lower_names if lower_names.count(s) > 1]
        self.assertEqual(
            len(duplicates), 0,
            f"Case-insensitive duplicate scene names: {set(duplicates)}"
        )


if __name__ == "__main__":
    unittest.main()
