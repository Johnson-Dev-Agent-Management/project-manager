"""Setup must select pinned project tools from newer hosts, including Git Bash."""
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]


class SetupTests(unittest.TestCase):
    def fixture(self, directory, platform, matching_host=False):
        root = Path(directory)
        (root / 'scripts').mkdir()
        for name in ('setup.sh', 'common.sh'):
            shutil.copyfile(ROOT / 'scripts' / name, root / 'scripts' / name)
        for name in ('.nvmrc', '.npm-version', 'global.json'):
            shutil.copyfile(ROOT / name, root / name)
        host = root / 'host'
        host.mkdir()
        node_version = (ROOT / '.nvmrc').read_text().strip()
        npm_version = (ROOT / '.npm-version').read_text().strip()
        sdk = json.loads((ROOT / 'global.json').read_text())['sdk']['version']
        env = {**os.environ, 'PATH': f'{host}:{os.environ["PATH"]}',
               'PROJECT_TOOLS_DIR': str(root / 'tools'),
               'PROJECT_CACHE_DIR': str(root / 'cache'),
               'SETUP_TEST_ROOT': str(root), 'SETUP_TEST_PLATFORM': platform,
               'SETUP_TEST_NODE': node_version if matching_host else '27.0.0',
               'SETUP_TEST_NPM': npm_version if matching_host else '12.3.0',
               'SETUP_TEST_SDK': sdk, 'PROJECT_BOOTSTRAP_NODE': 'false'}
        env.pop('PROJECT_NODE_DIR', None)
        commands = {
            'node': '''import os, pathlib, sys
root = pathlib.Path(os.environ['SETUP_TEST_ROOT'])
if sys.argv[1:] == ['--version']:
    private = pathlib.Path(os.environ['PROJECT_TOOLS_DIR']) in pathlib.Path(__file__).parents
    print('v' + ((root / '.nvmrc').read_text().strip() if private else os.environ['SETUP_TEST_NODE']))
elif sys.argv[1:] == ['-p', 'process.platform']:
    print('win32' if os.environ['SETUP_TEST_PLATFORM'].startswith('MINGW') else 'linux')
elif sys.argv[1:] == ['-p', 'process.arch']:
    print('x64')
else:
    print(os.environ['SETUP_TEST_SDK'])
''',
            'npm': '''import os, pathlib, shutil, sys
root = pathlib.Path(os.environ['SETUP_TEST_ROOT'])
tools = pathlib.Path(os.environ['PROJECT_NODE_DIR'])
if sys.argv[1:] == ['--version']:
    print((root / '.npm-version').read_text().strip() if tools in pathlib.Path(__file__).parents else os.environ['SETUP_TEST_NPM'])
elif sys.argv[1] == 'install':
    with (root / 'calls.txt').open('a') as f: f.write('install\\n')
    if os.environ.get('SETUP_TEST_INSTALL_FAILURE'): sys.exit(17)
    package = 'node-win-x64' if os.environ['SETUP_TEST_PLATFORM'].startswith('MINGW') else 'node-linux-x64'
    assert package + '@' + (root / '.nvmrc').read_text().strip() in sys.argv
    assert '--ignore-scripts' in sys.argv
    (tools / 'node_modules' / package / 'bin').mkdir(parents=True)
    (tools / 'node_modules/.bin').mkdir(parents=True)
    shutil.copy2(root / 'host/node', tools / 'node_modules' / package / 'bin/node')
    shutil.copy2(root / 'host/npm', tools / 'node_modules/.bin/npm')
else:
    with (root / 'calls.txt').open('a') as f: f.write('ci\\n')
''',
            'dotnet': '''import os, pathlib, sys
if sys.argv[1:] == ['--version']: print(os.environ['SETUP_TEST_SDK'])
else:
    with (pathlib.Path(os.environ['SETUP_TEST_ROOT']) / 'calls.txt').open('a') as f: f.write('restore\\n')
''',
            'uname': "import os\nprint(os.environ['SETUP_TEST_PLATFORM'])\n",
            'cygpath': "import sys\nprint(sys.argv[-1])\n",
        }
        for name, body in commands.items():
            command = host / name
            command.write_text(f'#!{sys.executable}\n' + body)
            command.chmod(0o755)
        return root, env, node_version, npm_version

    def test_newer_hosts_bootstrap_and_reuse_private_tools(self):
        for platform in ('Linux', 'MINGW64_NT-10.0'):
            with self.subTest(platform=platform), tempfile.TemporaryDirectory() as directory:
                root, env, node, npm = self.fixture(directory, platform)
                for _ in range(2):
                    result = subprocess.run(['bash', 'scripts/setup.sh'], cwd=root, env=env, capture_output=True, text=True)
                    self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
                    self.assertIn(f'v{node}\n{npm}\n', result.stdout)
                self.assertEqual((root / 'calls.txt').read_text().splitlines(), ['install', 'ci', 'restore', 'ci', 'restore'])

    def test_forced_bootstrap_works_with_matching_host(self):
        with tempfile.TemporaryDirectory() as directory:
            root, env, _, _ = self.fixture(directory, 'MINGW64_NT-10.0', matching_host=True)
            env['PROJECT_BOOTSTRAP_NODE'] = 'true'
            result = subprocess.run(['bash', 'scripts/setup.sh'], cwd=root, env=env, capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            self.assertEqual((root / 'calls.txt').read_text().splitlines(), ['install', 'ci', 'restore'])

    def test_bootstrap_failure_stops_before_dependency_restore(self):
        with tempfile.TemporaryDirectory() as directory:
            root, env, _, _ = self.fixture(directory, 'MINGW64_NT-10.0')
            env['SETUP_TEST_INSTALL_FAILURE'] = 'true'
            result = subprocess.run(['bash', 'scripts/setup.sh'], cwd=root, env=env, capture_output=True, text=True)
            self.assertEqual(result.returncode, 17, result.stdout + result.stderr)
            self.assertEqual((root / 'calls.txt').read_text().splitlines(), ['install'])
