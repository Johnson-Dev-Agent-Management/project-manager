"""Exercise the real Python CI runner against isolated synthetic test suites."""
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest


RUNNER = Path(__file__).resolve().parents[1] / 'scripts/python-tests.py'
PASSING = '''import unittest
class FixtureTests(unittest.TestCase):
    def test_passes(self):
        self.assertTrue(True)
'''
SKIPPED = '''import unittest
class FixtureTests(unittest.TestCase):
    @unittest.skip('synthetic skip reason')
    def test_skipped(self):
        self.fail('a skipped test must not execute')
'''
RUN_ONCE = '''from pathlib import Path
import unittest
class FixtureTests(unittest.TestCase):
    def test_passes(self):
        marker = Path(__file__).with_suffix('.executed')
        self.assertFalse(marker.exists(), 'test executed more than once')
        marker.touch()
'''


class PythonRunnerTests(unittest.TestCase):
    def run_runner(self, attribution=PASSING, evidence=PASSING, extra_modules=None):
        with tempfile.TemporaryDirectory() as directory:
            tests = Path(directory) / 'tests'
            tests.mkdir()
            modules = {
                'test_pr_attribution.py': attribution,
                'test_ci_fixture.py': evidence,
                **(extra_modules or {}),
            }
            for filename, source in modules.items():
                if source is not None:
                    (tests / filename).write_text(source)
            return subprocess.run(
                [sys.executable, '-B', str(RUNNER)], cwd=directory,
                stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                text=True, timeout=15, check=False,
            )

    def test_entirely_skipped_suite_fails_with_test_ids_and_reasons(self):
        result = self.run_runner(SKIPPED, SKIPPED)
        self.assertNotEqual(result.returncode, 0, result.stdout)
        for module in ('test_pr_attribution', 'test_ci_fixture'):
            self.assertIn(f'{module}.FixtureTests.test_skipped: synthetic skip reason', result.stdout)

    def test_passing_and_skipped_tests_still_fail(self):
        result = self.run_runner(PASSING, SKIPPED)
        self.assertNotEqual(result.returncode, 0, result.stdout)
        self.assertIn('test_passes', result.stdout)
        self.assertIn('test_ci_fixture.FixtureTests.test_skipped: synthetic skip reason', result.stdout)

    def test_fully_passing_suite_succeeds(self):
        result = self.run_runner()
        self.assertEqual(result.returncode, 0, result.stdout)
        self.assertIn('Ran 2 tests', result.stdout)
        self.assertIn('OK', result.stdout)

    def test_empty_ci_module_fails_among_passing_modules(self):
        result = self.run_runner(extra_modules={'test_ci_security.py': ''})
        self.assertNotEqual(result.returncode, 0, result.stdout)
        self.assertIn('Empty test module: test_ci_security (test_ci_security.py)', result.stdout)

    def test_every_empty_module_is_named_including_attribution(self):
        for attribution, modules, expected in (
            (PASSING, {'test_ci_empty.py': '', 'test_ci_security.py': 'class NotATest:\n    pass\n'},
             ('test_ci_empty', 'test_ci_security')),
            ('', {}, ('test_pr_attribution',)),
        ):
            with self.subTest(expected=expected):
                result = self.run_runner(attribution=attribution, extra_modules=modules)
                self.assertNotEqual(result.returncode, 0, result.stdout)
                for module in expected:
                    self.assertIn(f'Empty test module: {module} ({module}.py)', result.stdout)

    def test_multiple_passing_modules_execute_once_each(self):
        result = self.run_runner(RUN_ONCE, RUN_ONCE, {'test_ci_security.py': RUN_ONCE})
        self.assertEqual(result.returncode, 0, result.stdout)
        self.assertIn('Ran 3 tests', result.stdout)
        self.assertIn('OK', result.stdout)

    def test_each_discovery_pattern_must_find_tests(self):
        for attribution, evidence, pattern in (
            (None, PASSING, 'test_pr_attribution.py'),
            (PASSING, None, 'test_ci_*.py'),
        ):
            with self.subTest(pattern=pattern):
                result = self.run_runner(attribution, evidence)
                self.assertNotEqual(result.returncode, 0, result.stdout)
                self.assertIn(f'No tests discovered for {pattern}', result.stdout)

    def test_assertion_failures_and_errors_still_fail(self):
        for outcome, statement in (
            ('FAIL', "self.fail('synthetic assertion failure')"),
            ('ERROR', "raise RuntimeError('synthetic test error')"),
        ):
            with self.subTest(outcome=outcome):
                result = self.run_runner(PASSING, PASSING.replace('self.assertTrue(True)', statement))
                self.assertNotEqual(result.returncode, 0, result.stdout)
                self.assertIn(outcome, result.stdout)
