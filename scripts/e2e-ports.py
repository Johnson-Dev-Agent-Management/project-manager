"""Reject occupied listeners while allowing TCP TIME_WAIT from the previous run."""
from contextlib import ExitStack
import os
import socket
import sys


def check(ports):
    with ExitStack() as stack:
        for port in ports:
            listener = stack.enter_context(socket.socket())
            if os.name == 'nt':
                listener.setsockopt(socket.SOL_SOCKET, socket.SO_EXCLUSIVEADDRUSE, 1)
            else:
                listener.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            listener.bind(('127.0.0.1', port))
            # listen also rejects another reusable socket bound to this port.
            listener.listen(1)


if __name__ == '__main__':
    check(tuple(map(int, sys.argv[1:])) if len(sys.argv) > 1 else (5001, 5174))
