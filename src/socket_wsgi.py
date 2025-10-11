"""
WSGI entry point for the WebSocket server.
This is used by gunicorn in production with eventlet worker.
"""
import eventlet
import errno

# CRITICAL: Monkey patch MUST be first thing, before any other imports.
# Exclude os module to avoid gunicorn wakeup RuntimeError on Render/eventlet.
eventlet.monkey_patch(os=False)

# Render sometimes closes idle sockets before the worker finishes shutting them
# down which bubbles up as noisy EBADF logs. Patch eventlet's shutdown handler
# to quietly ignore that specific condition while keeping other errors visible.
try:
	from eventlet.greenio import base as _greenio_base

	_orig_shutdown = _greenio_base.BaseSocket.shutdown

	def _safe_shutdown(self, how=2):
		try:
			return _orig_shutdown(self, how)
		except OSError as exc:  # pragma: no cover - defensive path
			if exc.errno == errno.EBADF:
				return
			raise

	_greenio_base.BaseSocket.shutdown = _safe_shutdown
except Exception:  # pragma: no cover - patch should never block boot
	pass

# Import the Flask app and SocketIO instance
from socket_app import socket_app, socketio

# For gunicorn with Flask-SocketIO and eventlet worker
# When using eventlet worker, gunicorn needs the Flask app, and Flask-SocketIO
# will automatically handle WebSocket connections through the app
application = socket_app