"""Exercise failure handling in the CI evidence reader and aggregate gate."""
import contextlib
import io
import importlib.util
import json
import os
from pathlib import Path
import tempfile
import textwrap
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('report', ROOT / 'scripts/report.py')
report = importlib.util.module_from_spec(spec)
spec.loader.exec_module(report)


class EvidenceTests(unittest.TestCase):
    def test_missing_empty_failed_and_skipped_junit_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'junit.xml'
            with self.assertRaises(FileNotFoundError):
                report.junit(path)
            for content in ('<testsuites/>', '<testsuite><testcase><failure/></testcase></testsuite>',
                            '<testsuite><testcase><error/></testcase></testsuite>',
                            '<testsuite><testcase><skipped/></testcase></testsuite>'):
                path.write_text(content)
                with self.assertRaises(ValueError):
                    report.junit(path)
            path.write_text('<testsuite><testcase/></testsuite>')
            self.assertEqual(report.junit(path), 1)

    def test_coverage_has_no_numerical_floor(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(report, 'ARTIFACTS', Path(directory)):
            frontend = Path(directory) / 'frontend'
            (frontend / 'coverage').mkdir(parents=True)
            (frontend / 'junit.xml').write_text('<testsuite><testcase/></testsuite>')
            data = {'total': {metric: {'total': 10, 'pct': 0} for metric in ('lines', 'branches')}}
            (frontend / 'coverage/coverage-summary.json').write_text(json.dumps(data))
            self.assertIn('lines 0%', report.report('frontend'))
            data['total']['lines']['total'] = 0
            (frontend / 'coverage/coverage-summary.json').write_text(json.dumps(data))
            with self.assertRaises(ValueError):
                report.report('frontend')

    def test_backend_requires_tests_and_coverage(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(report, 'ARTIFACTS', Path(directory)):
            backend = Path(directory) / 'backend'
            backend.mkdir()
            trx = backend / 'tests.trx'
            trx.write_text('<TestRun xmlns="http://microsoft.com/schemas/VisualStudio/TeamTest/2010"/>')
            with self.assertRaises(ValueError):
                report.report('backend')
            trx.write_text('<TestRun xmlns="http://microsoft.com/schemas/VisualStudio/TeamTest/2010"><UnitTestResult outcome="Passed"/></TestRun>')
            with self.assertRaises(ValueError):
                report.report('backend')
            (backend / 'run').mkdir()
            (backend / 'run/coverage.cobertura.xml').write_text('<coverage lines-valid="10" branches-valid="10" line-rate="0" branch-rate="0"/>')
            self.assertIn('lines 0.00%', report.report('backend'))
            trx.write_text(trx.read_text().replace('Passed', 'Failed'))
            with self.assertRaises(ValueError):
                report.report('backend')

    def test_gate_requires_all_explicit_successes(self):
        source = (ROOT / '.github/workflows/ci.yml').read_text()
        gate = compile(textwrap.dedent(source.split("python3 - <<'PY'\n", 1)[1].rsplit('\n          PY', 1)[0]), 'quality-gate', 'exec')
        success = {name: {'result': 'success'} for name in ('frontend', 'backend', 'windows-smoke', 'e2e')}
        with tempfile.TemporaryDirectory() as directory:
            env = {'GITHUB_STEP_SUMMARY': str(Path(directory) / 'summary.md'), 'HEAD_SHA': 'head', 'TESTED_SHA': 'tested'}
            with patch.dict(os.environ, {**env, 'RESULTS': json.dumps(success)}), contextlib.redirect_stdout(io.StringIO()):
                exec(gate, {})
            for outcome in ('failure', 'cancelled', 'skipped', 'missing'):
                results = dict(success)
                if outcome == 'missing':
                    del results['frontend']
                else:
                    results['frontend'] = {'result': outcome}
                with self.subTest(outcome=outcome), patch.dict(os.environ, {**env, 'RESULTS': json.dumps(results)}), contextlib.redirect_stdout(io.StringIO()):
                    with self.assertRaises(SystemExit):
                        exec(gate, {})
