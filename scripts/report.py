"""Validate CI evidence and write a small summary; enforce reviewed production coverage floors."""
import json
import os
import re
from pathlib import Path
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = ROOT / '.artifacts'


def junit(path, expected_files=None):
    root = ET.parse(path).getroot()
    cases = list(root.iter('testcase'))
    if not cases or any(case.find(tag) is not None for case in cases
                        for tag in ('failure', 'error', 'skipped')):
        raise ValueError(f'{path}: missing tests, failures, errors, or skips')
    if expected_files is not None:
        actual = {case.get('classname') for case in cases}
        if actual != expected_files:
            raise ValueError(f'Test file/report mismatch: expected {expected_files}, got {actual}')
    for suite in root.iter('testsuite'):
        if not list(suite.iter('testcase')):
            raise ValueError(f'{path}: empty test suite {suite.get("name")}')
    return len(cases)


def floors(lines, branches):
    if not (80 <= lines <= 100 and 70 <= branches <= 100):
        raise ValueError(f'Coverage below approved floors: lines {lines}% (80), branches {branches}% (70)')


def report(kind):
    if kind == 'frontend':
        web = ROOT / 'src/web'
        expected = {path.relative_to(web).as_posix() for path in (web / 'src').rglob('*')
                    if path.name.endswith(('.test.ts', '.test.tsx'))}
        if not expected:
            raise ValueError('No frontend test files')
        count = junit(ARTIFACTS / 'frontend/junit.xml', expected)
        data = json.loads((ARTIFACTS / 'frontend/coverage/coverage-summary.json').read_text())
        production = {path.resolve() for path in (web / 'src').rglob('*')
                      if path.suffix in ('.ts', '.tsx')
                      and not path.name.endswith(('.test.ts', '.test.tsx', '.d.ts'))
                      and path.name != 'test-setup.ts'}
        if {Path(name).resolve() for name in data if name != 'total'} != production:
            raise ValueError('Frontend coverage must include every production TS/TSX file')
        total = data['total']
        if total['lines']['total'] <= 0 or total['branches']['total'] <= 0:
            raise ValueError('Empty frontend coverage')
        floors(total['lines']['covered'] / total['lines']['total'] * 100,
               total['branches']['covered'] / total['branches']['total'] * 100)
        return f"frontend: {count} tests; lines {total['lines']['pct']}%; branches {total['branches']['pct']}% (floors: 80% lines / 70% branches)"
    if kind == 'backend':
        results = ET.parse(ARTIFACTS / 'backend/tests.trx').getroot()
        ns = {'t': 'http://microsoft.com/schemas/VisualStudio/TeamTest/2010'}
        cases = results.findall('.//t:UnitTestResult', ns)
        if not cases or any(case.get('outcome') != 'Passed' for case in cases):
            raise ValueError('Missing or unsuccessful backend tests')
        classes = {node.get('className') for node in results.findall('.//t:TestMethod', ns)}
        expected = set()
        for path in (ROOT / 'tests/ProjectManager.Api.Tests').rglob('*Tests.cs'):
            namespace = re.search(r'namespace\s+([^;{]+)', path.read_text())
            expected.add(f'{namespace[1].strip()}.{path.stem}' if namespace else path.stem)
        if not expected or classes != expected:
            raise ValueError(f'Backend suite/report mismatch: {expected} vs {classes}')
        files = list((ARTIFACTS / 'backend').glob('*/coverage.cobertura.xml'))
        if len(files) != 1:
            raise ValueError('Expected exactly one backend coverage report')
        coverage = ET.parse(files[0]).getroot()
        if int(coverage.attrib['lines-valid']) <= 0 or int(coverage.attrib['branches-valid']) <= 0:
            raise ValueError('Empty backend coverage')
        lines = float(coverage.attrib['line-rate']) * 100
        branches = float(coverage.attrib['branch-rate']) * 100
        floors(lines, branches)
        return f'backend: {len(cases)} tests; lines {lines:.2f}%; branches {branches:.2f}% (floors: 80% lines / 70% branches)'
    if kind in ('e2e-create', 'e2e-restart'):
        specs = ROOT / 'src/web/e2e'
        expected = {path.relative_to(specs).as_posix() for path in specs.rglob('*')
                    if path.name.endswith(('.spec.ts', '.spec.tsx', '.test.ts', '.test.tsx'))}
        if not expected:
            raise ValueError('No browser suites')
        count = junit(Path(os.environ['E2E_ARTIFACT_DIR']) / kind.removeprefix('e2e-') / 'junit.xml', expected)
        return f'{kind}: {count} browser tests'
    raise ValueError(f'Unknown report: {kind}')


if __name__ == '__main__':
    summary = report(sys.argv[1])
    print(summary)
    destination = ARTIFACTS / f'{sys.argv[1]}-summary.md'
    destination.write_text(summary + '\n')
    if os.environ.get('GITHUB_STEP_SUMMARY'):
        with open(os.environ['GITHUB_STEP_SUMMARY'], 'a') as output:
            output.write(summary + '\n')
