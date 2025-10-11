"""Shared Eventlet tweaks for gracefully handling EBADF during shutdown."""

import errno
import logging
from typing import Callable


logger = logging.getLogger(__name__)


def _wrap_method(original: Callable, fallback):
    def wrapper(self, *args, **kwargs):
        try:
            return original(self, *args, **kwargs)
        except OSError as exc:  # pragma: no cover - defensive path
            if exc.errno == errno.EBADF:
                return fallback
            raise

    return wrapper


def apply_eventlet_ebadf_patch() -> bool:
    """Make Eventlet's socket operations ignore EBADF noise during shutdown."""

    try:
        from eventlet.greenio import base as greenio_base  # type: ignore
    except Exception:  # pragma: no cover - import failure should be surfaced in logs
        logger.debug("eventlet.greenio.base import failed; EBADF patch skipped")
        return False

    try:
        if not hasattr(greenio_base.BaseSocket, "_ebadf_safe"):  # idempotent guard
            greenio_base.BaseSocket.shutdown = _wrap_method(greenio_base.BaseSocket.shutdown, None)
            greenio_base.BaseSocket.recv = _wrap_method(greenio_base.BaseSocket.recv, b"")
            greenio_base.BaseSocket.send = _wrap_method(greenio_base.BaseSocket.send, 0)
            greenio_base.BaseSocket._ebadf_safe = True  # type: ignore[attr-defined]
            logger.debug("Applied Eventlet EBADF guard to BaseSocket")
    except Exception:  # pragma: no cover - patch should not break startup
        logger.exception("Failed to install Eventlet EBADF guard")
        return False

    return True