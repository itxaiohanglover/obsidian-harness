"""
Test: All JSON files in the repo are syntactically valid.
"""

import json
import unittest

from conftest import get_all_json_files


class TestJsonValid(unittest.TestCase):
    """Every .json file must parse without errors."""

    def test_all_json_files_parse(self):
        json_files = get_all_json_files()
        self.assertGreater(len(json_files), 0, "No JSON files found in repo")

        for filepath in json_files:
            with self.subTest(file=filepath):
                with open(filepath) as f:
                    try:
                        json.load(f)
                    except json.JSONDecodeError as e:
                        self.fail(f"Invalid JSON in {filepath}: {e}")

    def test_json_files_are_not_empty(self):
        json_files = get_all_json_files()
        for filepath in json_files:
            with self.subTest(file=filepath):
                with open(filepath) as f:
                    content = f.read().strip()
                self.assertGreater(len(content), 0, f"Empty JSON file: {filepath}")


if __name__ == "__main__":
    unittest.main()
