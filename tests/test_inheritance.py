"""
Test: @file: reference inheritance chain in prompts.json.
"""

import os
import unittest

from conftest import SCENES_DIR, get_scene_names, load_prompts


class TestInheritance(unittest.TestCase):
    """All @file: references in prompts.json must resolve to existing files."""

    def test_file_references_resolve(self):
        for scene in get_scene_names():
            scene_dir = os.path.join(SCENES_DIR, scene)
            prompts = load_prompts(scene)

            for key, value in prompts.items():
                if isinstance(value, str) and value.startswith("@file:"):
                    with self.subTest(scene=scene, key=key, ref=value):
                        ref_path = value[6:]  # strip "@file:"
                        full_path = os.path.join(scene_dir, ref_path)
                        self.assertTrue(
                            os.path.isfile(full_path),
                            f"Broken @file: ref in '{scene}/prompts.json' "
                            f"key='{key}' → '{ref_path}' not found"
                        )

    def test_referenced_files_are_not_empty(self):
        for scene in get_scene_names():
            scene_dir = os.path.join(SCENES_DIR, scene)
            prompts = load_prompts(scene)

            for key, value in prompts.items():
                if isinstance(value, str) and value.startswith("@file:"):
                    ref_path = value[6:]
                    full_path = os.path.join(scene_dir, ref_path)
                    if os.path.isfile(full_path):
                        with self.subTest(scene=scene, file=ref_path):
                            size = os.path.getsize(full_path)
                            self.assertGreater(
                                size, 0,
                                f"Empty referenced file: {full_path}"
                            )


if __name__ == "__main__":
    unittest.main()
