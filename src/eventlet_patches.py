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
        socket_classes = []
        for attr_name in ("BaseSocket", "GreenSocket"):
            socket_cls = getattr(greenio_base, attr_name, None)
            if socket_cls is not None:
                socket_classes.append((attr_name, socket_cls))

        if not socket_classes:
            logger.debug("No compatible Eventlet socket class found; EBADF patch skipped")
            return False

        patched_any = False
        for attr_name, socket_cls in socket_classes:
            if getattr(socket_cls, "_ebadf_safe", False):
                patched_any = True
                continue

            if hasattr(socket_cls, "shutdown"):
                socket_cls.shutdown = _wrap_method(socket_cls.shutdown, None)
            if hasattr(socket_cls, "recv"):
                socket_cls.recv = _wrap_method(socket_cls.recv, b"")
            if hasattr(socket_cls, "send"):
                socket_cls.send = _wrap_method(socket_cls.send, 0)

            socket_cls._ebadf_safe = True  # type: ignore[attr-defined]
            logger.debug("Applied Eventlet EBADF guard to %s", attr_name)
            patched_any = True

        if not patched_any:
            logger.debug("Eventlet EBADF guard already installed")
            return True
    except Exception:  # pragma: no cover - patch should not break startup
        logger.exception("Failed to install Eventlet EBADF guard")
        return False

    return True