"""
Test: registry.json structure and content validity.
"""

import json
import os
import unittest

from conftest import REPO_DIR


REGISTRY_PATH = os.path.join(REPO_DIR, "registry.json")


class TestRegistry(unittest.TestCase):
    """registry.json must be valid and well-structured."""

    def setUp(self):
        with open(REGISTRY_PATH) as f:
            self.registry = json.load(f)

    def test_registry_exists(self):
        self.assertTrue(
            os.path.isfile(REGISTRY_PATH),
            "registry.json not found at repo root"
        )

    def test_registry_is_array(self):
        self.assertIsInstance(
            self.registry, list,
            "registry.json root should be an array"
        )

    def test_registry_entries_have_required_fields(self):
        required_fields = ["name", "type", "source", "description"]
        for idx, entry in enumerate(self.registry):
            with self.subTest(index=idx, name=entry.get("name")):
                for field in required_fields:
                    self.assertIn(
                        field, entry,
                        f"Entry #{idx} missing field '{field}'"
                    )

    def test_registry_names_are_unique(self):
        names = [e.get("name") for e in self.registry]
        duplicates = [n for n in names if names.count(n) > 1]
        self.assertEqual(
            len(duplicates), 0,
            f"Duplicate names in registry: {set(duplicates)}"
        )

    def test_registry_entries_have_valid_type(self):
        valid_types = ["skill", "scene", "command", "plugin"]
        for entry in self.registry:
            with self.subTest(name=entry.get("name")):
                self.assertIn(
                    entry.get("type"), valid_types,
                    f"Invalid type '{entry.get('type')}' for '{entry.get('name')}'"
                )


if __name__ == "__main__":
    unittest.main()
