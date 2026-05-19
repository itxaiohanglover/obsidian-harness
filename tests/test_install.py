"""
Test: install.sh script validity and behavior.
"""

import os
import subprocess
import unittest

from conftest import REPO_DIR


INSTALL_SCRIPT = os.path.join(REPO_DIR, "install.sh")


class TestInstallScript(unittest.TestCase):
    """install.sh must be valid and contain expected commands."""

    def test_install_script_exists(self):
        self.assertTrue(
            os.path.isfile(INSTALL_SCRIPT),
            "install.sh not found at repo root"
        )

    def test_install_script_is_executable(self):
        self.assertTrue(
            os.access(INSTALL_SCRIPT, os.X_OK),
            "install.sh is not executable"
        )

    def test_install_script_has_shebang(self):
        with open(INSTALL_SCRIPT) as f:
            first_line = f.readline()
        self.assertTrue(
            first_line.startswith("#!/"),
            f"install.sh missing shebang, got: {first_line!r}"
        )

    def test_install_script_syntax_valid(self):
        """bash -n checks syntax without executing."""
        result = subprocess.run(
            ["bash", "-n", INSTALL_SCRIPT],
            capture_output=True, text=True
        )
        self.assertEqual(
            result.returncode, 0,
            f"install.sh has syntax errors:\n{result.stderr}"
        )

    def test_install_script_references_commands(self):
        """Script should reference known commands."""
        with open(INSTALL_SCRIPT) as f:
            content = f.read()
        expected_commands = ["um", "aha", "go"]
        for cmd in expected_commands:
            with self.subTest(command=cmd):
                self.assertIn(
                    cmd, content,
                    f"install.sh doesn't reference command '{cmd}'"
                )


if __name__ == "__main__":
    unittest.main()
