"""Validate CI evidence and write a small summary; coverage has no pass floor."""
import json
import os
from pathlib import Path
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = ROOT / '.artifacts'


def junit(path):
    root = ET.parse(path).getroot()
    cases = list(root.iter('testcase'))
    if not cases or any(case.find(tag) is not None for case in cases
                        for tag in ('failure', 'error', 'skipped')):
        raise ValueError(f'{path}: missing tests, failures, errors, or skips')
    return len(cases)


def report(kind):
    if kind == 'frontend':
        count = junit(ARTIFACTS / 'frontend/junit.xml')
        data = json.loads((ARTIFACTS / 'frontend/coverage/coverage-summary.json').read_text())
        total = data['total']
        if total['lines']['total'] <= 0 or total['branches']['total'] <= 0:
            raise ValueError('Empty frontend coverage')
        return f"frontend: {count} tests; lines {total['lines']['pct']}%; branches {total['branches']['pct']}% (informational)"
    if kind == 'backend':
        results = ET.parse(ARTIFACTS / 'backend/tests.trx').getroot()
        ns = {'t': 'http://microsoft.com/schemas/VisualStudio/TeamTest/2010'}
        cases = results.findall('.//t:UnitTestResult', ns)
        if not cases or any(case.get('outcome') != 'Passed' for case in cases):
            raise ValueError('Missing or unsuccessful backend tests')
        files = list((ARTIFACTS / 'backend').glob('*/coverage.cobertura.xml'))
        if len(files) != 1:
            raise ValueError('Expected exactly one backend coverage report')
        coverage = ET.parse(files[0]).getroot()
        if int(coverage.attrib['lines-valid']) <= 0 or int(coverage.attrib['branches-valid']) <= 0:
            raise ValueError('Empty backend coverage')
        lines = float(coverage.attrib['line-rate']) * 100
        branches = float(coverage.attrib['branch-rate']) * 100
        return f'backend: {len(cases)} tests; lines {lines:.2f}%; branches {branches:.2f}% (informational)'
    if kind in ('e2e-create', 'e2e-restart'):
        count = junit(ARTIFACTS / 'e2e' / kind.removeprefix('e2e-') / 'junit.xml')
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
