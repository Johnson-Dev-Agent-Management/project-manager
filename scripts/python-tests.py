"""Run attribution and CI evidence tests, rejecting empty patterns/modules and skips."""
from fnmatch import fnmatch
from pathlib import Path
import sys
import unittest


class ModuleCheckingLoader(unittest.TestLoader):
    def __init__(self):
        super().__init__()
        self.empty_modules = set()

    def loadTestsFromModule(self, module, *, pattern=None):
        discovered = super().loadTestsFromModule(module, pattern=pattern)
        filename = Path(module.__file__).name
        if pattern is not None and fnmatch(filename, pattern) and discovered.countTestCases() == 0:
            self.empty_modules.add((module.__name__, filename))
        return discovered


loader = ModuleCheckingLoader()
suite = unittest.TestSuite()
empty_patterns = []
for pattern in ('test_pr_attribution.py', 'test_ci_*.py'):
    discovered = loader.discover('tests', pattern=pattern)
    if discovered.countTestCases() == 0:
        empty_patterns.append(pattern)
    suite.addTests(discovered)
for pattern in empty_patterns:
    print(f'No tests discovered for {pattern}', file=sys.stderr)
for module, filename in sorted(loader.empty_modules):
    print(f'Empty test module: {module} ({filename})', file=sys.stderr)
if empty_patterns or loader.empty_modules:
    sys.exit(1)
result = unittest.TextTestRunner(verbosity=2).run(suite)
if result.skipped:
    print('Failed Python validation: skipped tests are not allowed:', file=sys.stderr)
    for test, reason in result.skipped:
        print(f'  {test.id()}: {reason}', file=sys.stderr)
sys.exit(0 if result.wasSuccessful() and not result.skipped else 1)
