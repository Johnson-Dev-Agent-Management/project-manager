"""Unsupported hosts must reject Linux tool archives before downloads or writes."""
from pathlib import Path
import runpy
import unittest
from unittest.mock import patch

INSTALLER = Path(__file__).resolve().parents[1] / 'scripts/install-policy-tools.py'


class PolicyToolPlatformTests(unittest.TestCase):
    def test_unsupported_hosts_fail_before_installation(self):
        for system, machine in (('Windows', 'AMD64'), ('Darwin', 'arm64'), ('Linux', 'aarch64')):
            with self.subTest(system=system, machine=machine), \
                    patch('platform.system', return_value=system), \
                    patch('platform.machine', return_value=machine), \
                    patch('pathlib.Path.mkdir') as mkdir, \
                    patch('subprocess.run') as run:
                with self.assertRaisesRegex(SystemExit, 'require Linux x64'):
                    runpy.run_path(str(INSTALLER), run_name='__main__')
                mkdir.assert_not_called()
                run.assert_not_called()
