"""Run attribution and CI evidence tests, rejecting accidental empty discovery."""
import sys
import unittest

suite = unittest.TestSuite()
for pattern in ('test_pr_attribution.py', 'test_ci_*.py'):
    discovered = unittest.defaultTestLoader.discover('tests', pattern=pattern)
    if discovered.countTestCases() == 0:
        raise SystemExit(f'No tests discovered for {pattern}')
    suite.addTests(discovered)
result = unittest.TextTestRunner(verbosity=2).run(suite)
sys.exit(0 if result.wasSuccessful() else 1)
