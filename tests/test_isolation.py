"""
Test: Parallel vault isolation — multiple vaults can coexist independently.
"""

import json
import os
import unittest

from conftest import create_temp_vault, cleanup_vault, get_scene_names


class TestIsolation(unittest.TestCase):
    """Vaults are independent; changes in one do not affect another."""

    def setUp(self):
        self.vaults = []

    def tearDown(self):
        for vault in self.vaults:
            cleanup_vault(vault)

    def _make_vault(self, scene="daily"):
        vault = create_temp_vault(scene_name=scene)
        self.vaults.append(vault)
        return vault

    def test_two_vaults_have_separate_directories(self):
        vault_a = self._make_vault("daily")
        vault_b = self._make_vault("daily")
        self.assertNotEqual(vault_a, vault_b)

    def test_vault_active_scene_is_independent(self):
        vault_a = self._make_vault("daily")
        vault_b = self._make_vault("coding")

        with open(os.path.join(vault_a, ".persona", "active-scene.json")) as f:
            scene_a = json.load(f)["scene"]
        with open(os.path.join(vault_b, ".persona", "active-scene.json")) as f:
            scene_b = json.load(f)["scene"]

        self.assertEqual(scene_a, "daily")
        self.assertEqual(scene_b, "coding")

    def test_writing_to_one_vault_does_not_affect_other(self):
        vault_a = self._make_vault("daily")
        vault_b = self._make_vault("daily")

        test_file = os.path.join(vault_a, ".persona", "contexts", "note.md")
        with open(test_file, "w") as f:
            f.write("# Test note in vault A")

        other_file = os.path.join(vault_b, ".persona", "contexts", "note.md")
        self.assertFalse(
            os.path.exists(other_file),
            "File written in vault A appeared in vault B"
        )

    def test_parallel_vaults_with_different_scenes(self):
        """Create vaults for all available scenes simultaneously."""
        scenes = get_scene_names()
        for scene in scenes:
            vault = self._make_vault(scene)
            active_path = os.path.join(vault, ".persona", "active-scene.json")
            with open(active_path) as f:
                data = json.load(f)
            self.assertEqual(data["scene"], scene)


if __name__ == "__main__":
    unittest.main()
