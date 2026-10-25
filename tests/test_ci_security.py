"""Security audit failures and unavailable advisory data must never look clean."""
import contextlib
import importlib.util
import io
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('security_report', ROOT / 'scripts/security-report.py')
security = importlib.util.module_from_spec(spec)
spec.loader.exec_module(security)


class SecurityReportTests(unittest.TestCase):
    def test_npm_requires_data_and_blocks_high_and_critical(self):
        with contextlib.redirect_stdout(io.StringIO()):
            for severity in ('high', 'critical'):
                data = {'auditReportVersion': 2, 'metadata': {'vulnerabilities': {'high': 0, 'critical': 0}}, 'vulnerabilities': {}}
                security.npm(data)
                data['metadata']['vulnerabilities'][severity] = 1
                with self.assertRaises(ValueError):
                    security.npm(data)
            for data in ({}, {'error': {'code': 'network unavailable'}}, {'auditReportVersion': 2}):
                with self.assertRaises((ValueError, KeyError)):
                    security.npm(data)

    def test_nuget_requires_current_advisories_and_blocks_high_and_critical(self):
        with contextlib.redirect_stdout(io.StringIO()):
            for severity in ('High', 'Critical'):
                framework = {'framework': 'net10.0'}
                data = {'version': 1, 'sources': ['https://api.nuget.org/v3/index.json'], 'parameters': '--vulnerable --include-transitive', 'projects': [{'path': '/synthetic/Tests.csproj', 'frameworks': [framework]}]}
                security.nuget(data)
                security.nuget({**data, 'projects': [{'path': '/synthetic/Tests.csproj'}]})
                framework['transitivePackages'] = [{'id': 'Synthetic.Package', 'vulnerabilities': [{'severity': severity, 'advisoryurl': 'https://example.invalid/advisory'}]}]
                with self.assertRaises(ValueError):
                    security.nuget(data)
            for data in ({}, {'version': 1, 'sources': [], 'projects': []}, {**data, 'logs': [{'message': 'NU1900'}]}):
                with self.assertRaises(ValueError):
                    security.nuget(data)
