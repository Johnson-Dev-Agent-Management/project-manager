"""Install checksum-pinned upstream Linux x64 executables; fail closed offline."""
import hashlib
import io
import json
import os
from pathlib import Path
import subprocess
import tarfile

ROOT = Path(__file__).resolve().parents[1]
output = Path(os.environ.get('PROJECT_TOOLS_DIR', ROOT / '.tools')) / 'policy'
output.mkdir(parents=True, exist_ok=True)
for name, tool in json.loads((ROOT / 'scripts/policy-tools.json').read_text()).items():
    archive = output / (name + '.archive')
    if not archive.exists() or hashlib.sha256(archive.read_bytes()).hexdigest() != tool['sha256']:
        subprocess.run(['curl', '--fail', '--location', '--silent', '--show-error',
                        '--connect-timeout', '10', '--max-time', '90', tool['url'], '-o', str(archive)], check=True)
    data = archive.read_bytes()
    if hashlib.sha256(data).hexdigest() != tool['sha256']:
        raise ValueError(f'{name}: checksum mismatch')
    with tarfile.open(fileobj=io.BytesIO(data)) as bundle:
        member = bundle.extractfile(tool['member'])
        if member is None:
            raise ValueError(f'{name}: missing executable')
        binary = output / name
        binary.write_bytes(member.read())
        binary.chmod(0o755)
    print(f'{name} {tool["version"]}: verified upstream archive SHA-256 {tool["sha256"]}')
