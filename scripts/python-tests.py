"""Run attribution and CI evidence tests, rejecting empty discovery and skips."""
import sys
import unittest

suite = unittest.TestSuite()
for pattern in ('test_pr_attribution.py', 'test_ci_*.py'):
    discovered = unittest.defaultTestLoader.discover('tests', pattern=pattern)
    if discovered.countTestCases() == 0:
        raise SystemExit(f'No tests discovered for {pattern}')
    suite.addTests(discovered)
result = unittest.TextTestRunner(verbosity=2).run(suite)
if result.skipped:
    print('Failed Python validation: skipped tests are not allowed:', file=sys.stderr)
    for test, reason in result.skipped:
        print(f'  {test.id()}: {reason}', file=sys.stderr)
sys.exit(0 if result.wasSuccessful() and not result.skipped else 1)
