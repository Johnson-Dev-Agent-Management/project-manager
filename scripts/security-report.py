"""Reject incomplete audits and high/critical advisories; print medium triage data."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIRECTORY = ROOT / '.artifacts/security'


def npm(data):
    if data.get('error') or data.get('auditReportVersion') != 2:
        raise ValueError('npm advisory retrieval incomplete')
    counts = data['metadata']['vulnerabilities']
    if not isinstance(data['vulnerabilities'], dict) or 'high' not in counts or 'critical' not in counts:
        raise ValueError('npm audit missing advisory results')
    print(f'npm advisory counts: {counts}')
    for name, entry in data['vulnerabilities'].items():
        print(f'npm: {name}, severity={entry["severity"]}, via={entry["via"]}')
    if counts['high'] or counts['critical']:
        raise ValueError('npm high/critical findings block validation')


def nuget(data):
    if (data.get('version') != 1 or not data.get('sources') or not data.get('projects')
            or data.get('parameters') != '--vulnerable --include-transitive'):
        raise ValueError('NuGet advisory retrieval incomplete')
    if data.get('logs'):
        raise ValueError(f'NuGet advisory diagnostics require triage: {data["logs"]}')
    for project in data['projects']:
        if not project.get('path', '').endswith('.csproj'):
            raise ValueError('NuGet audit missing project identity')
        # NuGet omits frameworks entirely when --vulnerable finds no advisories.
        for framework in project.get('frameworks', []):
            for kind in ('topLevelPackages', 'transitivePackages'):
                for package in framework.get(kind, []):
                    for advisory in package.get('vulnerabilities', []):
                        print(f'NuGet: {package["id"]}, {advisory}')
                        if advisory['severity'].lower() in ('high', 'critical'):
                            raise ValueError('NuGet high/critical findings block validation')
    print('NuGet advisory retrieval succeeded; no high/critical findings')


if __name__ == '__main__':
    npm(json.loads((DIRECTORY / 'npm-audit.json').read_text()))
    nuget(json.loads((DIRECTORY / 'nuget-audit.json').read_text()))
