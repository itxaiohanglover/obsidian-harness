"""
Test: Scene directory structure and required files.
"""

import json
import os
import unittest

from conftest import SCENES_DIR, get_scene_names, load_prompts, load_manifest


REQUIRED_SCENE_FILES = ["manifest.json", "prompts.json"]


class TestSceneStructure(unittest.TestCase):
    """Each scene must have required files with correct schema."""

    def test_scenes_directory_exists(self):
        self.assertTrue(os.path.isdir(SCENES_DIR), "scenes/ directory missing")

    def test_at_least_one_scene_exists(self):
        scenes = get_scene_names()
        self.assertGreater(len(scenes), 0, "No scenes found")

    def test_required_files_present(self):
        for scene in get_scene_names():
            scene_dir = os.path.join(SCENES_DIR, scene)
            for filename in REQUIRED_SCENE_FILES:
                with self.subTest(scene=scene, file=filename):
                    filepath = os.path.join(scene_dir, filename)
                    self.assertTrue(
                        os.path.isfile(filepath),
                        f"Missing {filename} in scene '{scene}'"
                    )

    def test_manifest_has_required_fields(self):
        required_fields = ["scene", "description", "requires"]
        for scene in get_scene_names():
            with self.subTest(scene=scene):
                manifest = load_manifest(scene)
                for field in required_fields:
                    self.assertIn(
                        field, manifest,
                        f"manifest.json in '{scene}' missing field '{field}'"
                    )

    def test_prompts_has_system_prompt(self):
        for scene in get_scene_names():
            with self.subTest(scene=scene):
                prompts = load_prompts(scene)
                has_system = (
                    "system_prompt" in prompts
                    or "systemPrompt" in prompts
                    or any(
                        isinstance(v, str) and v.startswith("@file:")
                        for v in prompts.values()
                    )
                )
                # At minimum, prompts.json should not be empty
                self.assertGreater(
                    len(prompts), 0,
                    f"prompts.json in '{scene}' is empty"
                )

    def test_scene_name_matches_manifest(self):
        for scene in get_scene_names():
            with self.subTest(scene=scene):
                manifest = load_manifest(scene)
                self.assertEqual(
                    manifest.get("scene"), scene,
                    f"manifest.scene '{manifest.get('scene')}' != dir name '{scene}'"
                )


if __name__ == "__main__":
    unittest.main()
