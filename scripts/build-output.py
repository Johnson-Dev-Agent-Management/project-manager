"""Bind build artifacts to this checkout/run and detect missing or changed output."""
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]


def files(directory):
    return {str(path.relative_to(directory)): hashlib.sha256(path.read_bytes()).hexdigest()
            for path in sorted(directory.rglob('*')) if path.is_file()}


def process(mode, kind):
    directory = ROOT / '.artifacts/build' / kind
    output = directory / 'output'
    manifest = directory / 'provenance.json'
    expected = {'commit': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(),
                'run': os.environ.get('GITHUB_RUN_ID', 'local')}
    content = files(output)
    if not content or not (output / ('index.html' if kind == 'web' else 'ProjectManager.Api.dll')).is_file():
        raise ValueError(f'Missing {kind} build output')
    if mode == 'record':
        manifest.write_text(json.dumps({**expected, 'files': content}, indent=2) + '\n')
    elif mode == 'verify':
        data = json.loads(manifest.read_text())
        if data != {**expected, 'files': content}:
            raise ValueError(f'{kind} output differs or is from another commit/workflow run')
    else:
        raise ValueError('Expected record or verify')
    print(f'{mode}: {kind}, {expected}, {len(content)} files')


if __name__ == '__main__':
    if len(sys.argv) != 3 or sys.argv[2] not in ('web', 'api'):
        raise SystemExit('Usage: build-output.py record|verify web|api')
    process(*sys.argv[1:])
