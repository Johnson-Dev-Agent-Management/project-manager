"""E2E must consume intact build output from this commit and workflow run."""
import contextlib
import importlib.util
import io
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('build_output', ROOT / 'scripts/build-output.py')
build = importlib.util.module_from_spec(spec)
spec.loader.exec_module(build)


class BuildOutputTests(unittest.TestCase):
    def test_output_provenance_integrity_and_missing_files(self):
        for kind, entry in (('web', 'index.html'), ('api', 'ProjectManager.Api.dll')):
            with self.subTest(kind=kind), tempfile.TemporaryDirectory() as directory:
                root = Path(directory)
                output = root / '.artifacts/build' / kind / 'output'
                output.mkdir(parents=True)
                with patch.object(build, 'ROOT', root), patch.object(build.subprocess, 'check_output', return_value='commit\n'), patch.dict(os.environ, {'GITHUB_RUN_ID': 'run-1'}), contextlib.redirect_stdout(io.StringIO()):
                    with self.assertRaises(ValueError):
                        build.process('record', kind)
                    (output / entry).write_text('synthetic output')
                    build.process('record', kind)
                    build.process('verify', kind)
                    with patch.dict(os.environ, {'GITHUB_RUN_ID': 'different-run'}), self.assertRaises(ValueError):
                        build.process('verify', kind)
                    with patch.object(build.subprocess, 'check_output', return_value='different-commit\n'), self.assertRaises(ValueError):
                        build.process('verify', kind)
                    (output / entry).write_text('modified')
                    with self.assertRaises(ValueError):
                        build.process('verify', kind)
