"""Run checks with unrelated development listeners, then verify their survival.

Use explicitly on an idle CI runner; routine check.sh never claims these ports.
"""
from contextlib import ExitStack
import shutil
import socket
import subprocess
import sys


def main():
    command = sys.argv[1:]
    if not command:
        raise SystemExit('Usage: with_dev_ports_occupied.py COMMAND [ARG ...]')
    # Resolve Git Bash before native Windows subprocess search can select WSL.
    command[0] = shutil.which(command[0]) or command[0]
    with ExitStack() as stack:
        listeners = []
        for port in (5000, 5173):
            listener = stack.enter_context(socket.socket())
            if sys.platform == 'win32':
                listener.setsockopt(socket.SOL_SOCKET, socket.SO_EXCLUSIVEADDRUSE, 1)
            else:
                listener.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            listener.bind(('127.0.0.1', port))
            listener.listen(5)
            listener.settimeout(2)
            listeners.append(listener)
        result = subprocess.run(command, check=False)
        for listener in listeners:
            with socket.create_connection(listener.getsockname(), timeout=2) as client:
                connection, _ = listener.accept()
                with connection:
                    connection.settimeout(2)
                    connection.sendall(b'ok')
                    if client.recv(2) != b'ok':
                        raise AssertionError('Unrelated development listener was disrupted')
        print('Passed: unrelated listeners on 5000 and 5173 remain usable', flush=True)
        return result.returncode


if __name__ == '__main__':
    sys.exit(main())
