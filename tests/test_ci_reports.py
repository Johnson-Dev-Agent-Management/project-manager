"""Exercise failure handling in evidence, coverage policy, and aggregate gate."""
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
                            '<testsuite><testcase><skipped/></testcase></testsuite>',
                            '<testsuites><testsuite/><testsuite><testcase/></testsuite></testsuites>'):
                path.write_text(content)
                with self.assertRaises(ValueError):
                    report.junit(path)
            path.write_text('<testsuite><testcase classname="a.test.ts"/></testsuite>')
            self.assertEqual(report.junit(path, {'a.test.ts'}), 1)
            with self.assertRaises(ValueError):
                report.junit(path, {'a.test.ts', 'missing.test.tsx'})

    def test_coverage_floors_apply_to_each_metric_without_rounding(self):
        report.floors(80, 70)
        report.floors(100, 100)
        for lines, branches in ((79.999, 100), (100, 69.999), (0, 0), (101, 100), (float('nan'), 100)):
            with self.subTest(lines=lines, branches=branches), self.assertRaises(ValueError):
                report.floors(lines, branches)

    def test_frontend_coverage_requires_all_production_files_and_all_suites(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            web = root / 'src/web/src'
            web.mkdir(parents=True)
            (web / 'app.tsx').write_text('production')
            (web / 'app.test.tsx').write_text('test')
            frontend = root / 'evidence/frontend'
            (frontend / 'coverage').mkdir(parents=True)
            junit = frontend / 'junit.xml'
            junit.write_text('<testsuite><testcase classname="src/app.test.tsx"/></testsuite>')
            total = {metric: {'total': 100, 'covered': 100, 'pct': 100} for metric in ('lines', 'branches')}
            data = {'total': total, str(web / 'app.tsx'): total}
            coverage = frontend / 'coverage/coverage-summary.json'
            coverage.write_text(json.dumps(data))
            with patch.object(report, 'ROOT', root), patch.object(report, 'ARTIFACTS', root / 'evidence'):
                self.assertIn('lines 100%', report.report('frontend'))
                (web / 'missing.test.ts').write_text('another suite')
                with self.assertRaises(ValueError):
                    report.report('frontend')
                (web / 'missing.test.ts').unlink()
                (web / 'untested.ts').write_text('unimported production')
                with self.assertRaises(ValueError):
                    report.report('frontend')
                (web / 'untested.ts').unlink()
                for total_count, covered in ((100, 79), (0, 0)):
                    total['lines'].update(total=total_count, covered=covered, pct=100)
                    coverage.write_text(json.dumps(data))
                    with self.assertRaises(ValueError):
                        report.report('frontend')

    def test_backend_requires_tests_coverage_and_every_suite(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            tests = root / 'tests/ProjectManager.Api.Tests'
            tests.mkdir(parents=True)
            (tests / 'ExampleTests.cs').write_text('namespace Example;')
            backend = root / 'evidence/backend'
            backend.mkdir(parents=True)
            trx = backend / 'tests.trx'
            trx.write_text('<TestRun xmlns="http://microsoft.com/schemas/VisualStudio/TeamTest/2010"/>')
            with patch.object(report, 'ROOT', root), patch.object(report, 'ARTIFACTS', root / 'evidence'):
                with self.assertRaises(ValueError):
                    report.report('backend')
                good = '<TestRun xmlns="http://microsoft.com/schemas/VisualStudio/TeamTest/2010"><UnitTestResult outcome="Passed"/><TestMethod className="Example.ExampleTests"/></TestRun>'
                trx.write_text(good)
                with self.assertRaises(ValueError):
                    report.report('backend')
                (backend / 'run').mkdir()
                coverage = backend / 'run/coverage.cobertura.xml'
                coverage.write_text('<coverage lines-valid="10" branches-valid="10" line-rate="1" branch-rate="1"/>')
                self.assertIn('lines 100.00%', report.report('backend'))
                (tests / 'MissingTests.cs').write_text('namespace Example;')
                with self.assertRaises(ValueError):
                    report.report('backend')
                (tests / 'MissingTests.cs').unlink()
                for outcome in ('Failed', 'NotExecuted'):
                    trx.write_text(good.replace('Passed', outcome))
                    with self.assertRaises(ValueError):
                        report.report('backend')
                trx.write_text(good)
                for attributes in ('lines-valid="10" branches-valid="10" line-rate="0.79999" branch-rate="1"',
                                   'lines-valid="10" branches-valid="10" line-rate="1" branch-rate="0.69999"',
                                   'lines-valid="0" branches-valid="10" line-rate="0" branch-rate="1"'):
                    coverage.write_text(f'<coverage {attributes}/>')
                    with self.assertRaises(ValueError):
                        report.report('backend')

    def test_gate_requires_all_explicit_successes(self):
        source = (ROOT / '.github/workflows/ci.yml').read_text()
        gate = compile(textwrap.dedent(source.split("python3 - <<'PY'\n", 1)[1].rsplit('\n          PY', 1)[0]), 'quality-gate', 'exec')
        success = {name: {'result': 'success'} for name in ('frontend', 'backend', 'windows-smoke', 'e2e', 'policy', 'supply-chain')}
        with tempfile.TemporaryDirectory() as directory:
            env = {'GITHUB_STEP_SUMMARY': str(Path(directory) / 'summary.md'), 'HEAD_SHA': 'head', 'TESTED_SHA': 'tested'}
            with patch.dict(os.environ, {**env, 'RESULTS': json.dumps(success)}), contextlib.redirect_stdout(io.StringIO()):
                exec(gate, {})
            for job in success:
                for outcome in ('failure', 'cancelled', 'skipped', 'missing'):
                    results = dict(success)
                    if outcome == 'missing':
                        del results[job]
                    else:
                        results[job] = {'result': outcome}
                    with self.subTest(job=job, outcome=outcome), patch.dict(os.environ, {**env, 'RESULTS': json.dumps(results)}), contextlib.redirect_stdout(io.StringIO()):
                        with self.assertRaises(SystemExit):
                            exec(gate, {})
