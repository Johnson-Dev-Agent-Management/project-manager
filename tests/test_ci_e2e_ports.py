"""Real socket regressions for consecutive E2E runs and occupied port safety."""
import importlib.util
from pathlib import Path
import socket
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('e2e_ports', ROOT / 'scripts/e2e-ports.py')
ports = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ports)


class E2EPortTests(unittest.TestCase):
    def test_occupied_listener_rejected_without_disrupting_it(self):
        with socket.socket() as existing:
            existing.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            existing.bind(('127.0.0.1', 0))
            existing.listen(1)
            port = existing.getsockname()[1]
            with self.assertRaises(OSError):
                ports.check((port,))
            # The preflight must not close or steal the existing listener.
            with socket.create_connection(('127.0.0.1', port), timeout=1) as client:
                connection, _ = existing.accept()
                with connection:
                    client.sendall(b'ok')
                    self.assertEqual(connection.recv(2), b'ok')

    def test_closed_server_with_time_wait_can_be_reused(self):
        with socket.socket() as server:
            server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            server.bind(('127.0.0.1', 0))
            server.listen(1)
            port = server.getsockname()[1]
            with socket.create_connection(('127.0.0.1', port), timeout=1) as client:
                connection, _ = server.accept()
                connection.shutdown(socket.SHUT_WR)
                connection.close()
                self.assertEqual(client.recv(1), b'')
        ports.check((port,))
        ports.check((port,))
