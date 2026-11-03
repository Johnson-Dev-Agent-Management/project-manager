"""Exercise both real smoke shutdown paths with TERM-resistant owned services."""
import json
from contextlib import ExitStack
import os
from pathlib import Path
import shlex
import shutil
import socket
import subprocess
import sys
import tempfile
import time
import unittest

ROOT = Path(__file__).resolve().parents[1]


class DevelopmentCleanupTests(unittest.TestCase):
    def setUp(self):
        self.bash = shutil.which('bash')
        self.assertIsNotNone(self.bash)
        # Resolve MSYS tools through Bash, rather than native Windows search order.
        self.perl, self.sleep, self.rm = subprocess.check_output(
            [self.bash, '-ec', 'command -v perl; command -v sleep; command -v rm'],
            text=True).splitlines()

    def write_command(self, path, body):
        path.write_text('#!/bin/bash\nset -eu\n' + body, newline='\n')
        path.chmod(0o755)

    def alive(self, pid):
        return subprocess.run([self.bash, '-c', 'kill -0 "$1" 2>/dev/null', '--', str(pid)],
                              check=False).returncode == 0

    def exercise_shutdown(self, failure, acknowledge=True):
        with tempfile.TemporaryDirectory(prefix='cleanup fixture ') as directory, socket.socket() as unrelated, ExitStack() as reservations:
            # Reserve distinct OS-selected ports until just before startup. The
            # real scripts still reject any listener that wins the rebind race.
            ports = []
            while len(ports) < 2:
                reserved = reservations.enter_context(socket.socket())
                reserved.bind(('127.0.0.1', 0))
                port = reserved.getsockname()[1]
                if port not in (5000, 5173):
                    ports.append(port)
            root = Path(directory)
            (root / 'scripts').mkdir()
            for name in ('common.sh', 'dev.sh', 'dev-smoke.sh', 'e2e-ports.py'):
                shutil.copyfile(ROOT / 'scripts' / name, root / 'scripts' / name)
            for name in ('.nvmrc', '.npm-version'):
                shutil.copyfile(ROOT / name, root / name)
            shutil.copyfile(ROOT / 'tests/fixtures/cleanup-service.pl', root / 'service.pl')
            host = root / 'host'
            host.mkdir()
            service = f'exec {shlex.quote(self.perl)} {shlex.quote((root / "service.pl").as_posix())}'
            parent = 'export CLEANUP_TEST_PARENT=$PPID\n'
            self.write_command(host / 'dotnet',
                               '[[ ${1:-} == build ]] && exit 0\n' + parent + service + ' api "$@"\n')
            self.write_command(host / 'node',
                               'if [[ ${1:-} == -p ]]; then\n'
                               f'  [[ $2 == process.platform ]] && echo {"win32" if os.name == "nt" else "linux"} || echo x64\n'
                               '  exit 0\nfi\n' + parent + service + ' web "$@"\n')
            # Model a slightly slower supervisor scheduler without changing the
            # production five-second grace. Equal nested budgets fail reliably.
            self.write_command(host / 'sleep',
                               f'if [[ -n ${{PROJECT_DEV_DATA_DIR:-}} ]]; then {shlex.quote(self.sleep)} 0.02; fi\n'
                               f'exec {shlex.quote(self.sleep)} "$@"\n')
            monitor = root / 'before-remove.py'
            monitor.write_text('''import os, pathlib, socket
root = pathlib.Path(os.environ['CLEANUP_TEST_ROOT'])
for port in (int(os.environ['PROJECT_DEV_API_PORT']), int(os.environ['PROJECT_DEV_WEB_PORT'])):
    try:
        with socket.create_connection(('127.0.0.1', port), timeout=0.2):
            (root / 'removed-while-listening').touch()
    except OSError:
        pass
''', newline='\n')
            self.write_command(host / 'rm',
                               f'{shlex.quote(Path(sys.executable).as_posix())} {shlex.quote(monitor.as_posix())}\n'
                               f'exec {shlex.quote(self.rm)} "$@"\n')
            env = {**os.environ, 'PATH': os.pathsep.join((str(host), os.environ['PATH'])),
                   'PROJECT_TOOLS_DIR': str(root / 'tools'), 'PROJECT_CACHE_DIR': str(root / 'cache'),
                   'CLEANUP_TEST_ROOT': str(root), 'CLEANUP_TEST_FAILURE': '1' if failure else '',
                   'PROJECT_DEV_API_PORT': str(ports[0]), 'PROJECT_DEV_WEB_PORT': str(ports[1]),
                   'CLEANUP_TEST_NO_ACK': '' if acknowledge else '1'}
            for name in ('PROJECT_NODE_DIR', 'PROJECT_DEV_DATA_DIR', 'PROJECT_DEV_CLEANUP_FILE', 'BASH_ENV'):
                env.pop(name, None)
            unrelated.bind(('127.0.0.1', 0))
            unrelated.listen(1)
            reservations.close()
            started = time.monotonic()
            process = subprocess.Popen([self.bash, 'scripts/dev-smoke.sh'], cwd=root, env=env,
                                       stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
            states = []
            try:
                output, _ = process.communicate(timeout=18)
                elapsed = time.monotonic() - started
                for kind, port in zip(('api', 'web'), ports):
                    self.assertTrue((root / f'{kind}.json').is_file(), output)
                    states.append(json.loads((root / f'{kind}.json').read_text()))
                    self.assertEqual(states[-1]['port'], port, output)
                    self.assertTrue((root / f'{kind}.term').exists(), f'{kind} did not ignore TERM: {output}')
                self.assertLess(elapsed, 15, output)
                self.assertEqual(process.returncode, 1 if failure or not acknowledge else 0, output)
                for state in states:
                    self.assertFalse(self.alive(state['pid']), f'service survived: {state}; {output}')
                    self.assertFalse(self.alive(state['parent']), f'dev.sh survived: {state}; {output}')
                    self.assertEqual(Path(state['database']).parent.exists(), not acknowledge, output)
                if not acknowledge:
                    self.assertIn('retaining storage:', output)
                self.assertFalse((root / 'removed-while-listening').exists(), output)
                for port in ports:
                    with socket.socket() as released:
                        released.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
                        released.bind(('127.0.0.1', port))
                        released.listen(1)
                # Cleanup may not disturb an unrelated listener owned by the test.
                with socket.create_connection(unrelated.getsockname(), timeout=1) as client:
                    connection, _ = unrelated.accept()
                    with connection:
                        client.sendall(b'ok')
                        self.assertEqual(connection.recv(2), b'ok')
            finally:
                # The regression must also clean up its fixtures when run against
                # the buggy implementation. Signal only recorded, test-owned PIDs.
                for path in root.glob('*.json'):
                    state = json.loads(path.read_text())
                    states.append(state)
                    for pid in (state['pid'], state['parent']):
                        if self.alive(pid):
                            subprocess.run([self.bash, '-c', 'kill -KILL "$1" 2>/dev/null || true', '--', str(pid)], check=True)
                if process.poll() is None:
                    process.kill()
                process.communicate(timeout=5)
                for state in states:
                    shutil.rmtree(Path(state['database']).parent, ignore_errors=True)

    def test_normal_shutdown_reaps_term_resistant_services_before_removing_storage(self):
        self.exercise_shutdown(failure=False)

    def test_failure_exit_reaps_term_resistant_services_before_removing_storage(self):
        self.exercise_shutdown(failure=True)

    def test_missing_cleanup_acknowledgment_fails_and_preserves_storage(self):
        self.exercise_shutdown(failure=False, acknowledge=False)
