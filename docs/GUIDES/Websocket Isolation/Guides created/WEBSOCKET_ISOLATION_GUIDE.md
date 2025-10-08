# WebSocket Isolation Implementation Guide

## Overview

The WebSocket logic has been successfully isolated into a **separate service** that runs independently from the main Flask REST API. This allows you to control when WebSocket connections are active, reducing resource usage and improving flexibility.

## Architecture

### Before (Monolithic)
```
┌────────────────────────────┐
│   Flask App (Port 3001)    │
│  ┌──────────┐              │
│  │ REST API │              │
│  └──────────┘              │
│  ┌──────────┐              │
│  │ SocketIO │ ◄────────────┼──── Frontend auto-connects
│  └──────────┘              │
└────────────────────────────┘
```

### After (Microservices)
```
┌────────────────────────────┐     ┌────────────────────────────┐
│   Flask App (Port 3001)    │     │ WebSocket Server (3002)    │
│  ┌──────────┐              │     │  ┌──────────┐              │
│  │ REST API │              │     │  │ SocketIO │ ◄────────────┼──── Frontend (manual connect)
│  └──────────┘              │     │  └──────────┘              │
│       │                    │     │       ▲                    │
│       │ HTTP POST          │     │       │                    │
│       └────────────────────┼─────┼───────┘                    │
│     (Trigger events)       │     │                            │
└────────────────────────────┘     └────────────────────────────┘
```

## Key Changes

### 1. **Separate Servers**
- **REST API**: `src/app.py` (Port 3001) - No SocketIO
- **WebSocket Server**: `src/socket_app.py` (Port 3002) - Dedicated SocketIO server

### 2. **Docker Services**
Three services in `docker-compose.yml`:
- `app` - Main Flask REST API
- `socket` - WebSocket server
- `db` - PostgreSQL database

### 3. **Manual WebSocket Control**
Frontend now has explicit connect/disconnect buttons instead of auto-connecting.

### 4. **Inter-Service Communication**
REST API sends HTTP POST requests to WebSocket server to trigger events:
```python
# src/api/websocket_events.py
requests.post(
    f"{SOCKET_SERVER_URL}/emit/message_received",
    json={'chat_id': chat_id, 'message': message_data}
)
```

## How to Use

### Starting the Services

#### Option 1: Start Both Services Together
```bash
pipenv run both
```

#### Option 2: Start Separately (in different terminals)

**Terminal 1 - REST API:**
```bash
pipenv run start
```

**Terminal 2 - WebSocket Server:**
```bash
pipenv run socket
```

### Frontend Usage

1. **Navigate to Messages Page** (`/messages`)
2. **You'll see a banner:**
   - ⚠️ **Yellow**: "WebSocket Disconnected" - Click "Connect WebSocket"
   - ✅ **Green**: "WebSocket connected - Real-time messaging active"

3. **Connect WebSocket**
   - Click the "Connect WebSocket" button
   - Toast notification: "WebSocket connected! 🟢"
   - Real-time features now active

4. **Disconnect WebSocket**
   - Click the "Disconnect" button
   - Toast notification: "WebSocket disconnected 🔴"
   - Messages still work, but updates require page refresh

## Environment Variables

### `.env` File
```bash
# REST API
DATABASE_URL=postgres://tastebook_user:postgres@localhost:5432/tastebook
FLASK_APP=src/app.py
FLASK_DEBUG=1

# WebSocket Server
SOCKET_PORT=3002
SOCKET_SERVER_URL=http://localhost:3002

# Frontend - REST API
VITE_BACKEND_URL=http://localhost:3001

# Frontend - WebSocket Server (NEW!)
VITE_SOCKET_URL=http://localhost:3002
```

### For GitHub Codespaces
Update URLs to use your Codespace domain:
```bash
VITE_BACKEND_URL=https://your-codespace-3001.app.github.dev/
VITE_SOCKET_URL=https://your-codespace-3002.app.github.dev/
SOCKET_SERVER_URL=http://localhost:3002  # Keep localhost for inter-service
```

## File Structure

### New/Modified Files

```
src/
├── app.py                          # ✨ MODIFIED - Removed SocketIO
├── socket_app.py                   # ✅ NEW - Dedicated WebSocket server
├── api/
│   └── websocket_events.py         # ✨ MODIFIED - HTTP-based event emitters
└── front/
    ├── utils/
    │   └── socketService.js        # ✨ MODIFIED - Manual connect/disconnect
    └── messages/
        ├── hooks/
        │   └── useMessages.js      # ✨ MODIFIED - Manual WebSocket control
        ├── pages/
        │   └── Messages.jsx        # ✨ MODIFIED - WebSocket status banner
        └── components/
            └── WebSocketStatus.jsx # ✨ MODIFIED - Connection UI

.devcontainer/
└── docker-compose.yml              # ✨ MODIFIED - Added 'socket' service

.env                                # ✨ MODIFIED - Added VITE_SOCKET_URL
Pipfile                             # ✨ MODIFIED - Added 'socket' script
```

## Features

### ✅ Benefits

1. **Resource Efficiency**
   - WebSocket only runs when needed
   - Reduces server load when messaging isn't in use

2. **Better Debugging**
   - Separate logs for REST API and WebSocket
   - Can restart WebSocket without affecting REST API

3. **Deployment Flexibility**
   - Can scale services independently
   - WebSocket on different server if needed

4. **User Control**
   - Users decide when to enable real-time features
   - No unnecessary connections

### 🎯 Functionality

When **WebSocket Connected**:
- ✅ Instant message delivery
- ✅ Real-time read receipts
- ✅ Live chat deletions
- ✅ Instant UI updates

When **WebSocket Disconnected**:
- ✅ Messages still send/receive (via REST API)
- ⚠️ Updates require page refresh
- ⚠️ No real-time notifications

## Troubleshooting

### WebSocket Won't Connect

1. **Check if WebSocket server is running:**
   ```bash
   curl http://localhost:3002/health
   # Should return: {"status": "healthy", "service": "websocket"}
   ```

2. **Check environment variables:**
   ```bash
   echo $VITE_SOCKET_URL
   # Should show WebSocket server URL
   ```

3. **Check browser console:**
   - Look for `[SOCKET]` messages
   - Connection errors will show the reason

### Events Not Broadcasting

1. **Verify SOCKET_SERVER_URL is correct:**
   ```bash
   # In src/api/websocket_events.py
   # Should point to WebSocket server (not REST API)
   ```

2. **Check WebSocket server logs:**
   ```bash
   # Look for [HTTP->WS] messages
   # Shows when REST API triggers events
   ```

### Port Conflicts

If ports 3001 or 3002 are in use:

1. **Update `.env`:**
   ```bash
   SOCKET_PORT=3003  # Or any available port
   VITE_SOCKET_URL=http://localhost:3003
   ```

2. **Update `devcontainer.json`:**
   ```json
   "forwardPorts": [3000, 3001, 3003]
   ```

## Production Deployment (Render)

Update `render.yaml`:

```yaml
services:
  # REST API service
  - type: web
    name: tastebook-api
    env: python
    buildCommand: "./render_build.sh"
    startCommand: "gunicorn src.wsgi:app"
    envVars:
      - key: SOCKET_SERVER_URL
        value: https://tastebook-socket.onrender.com

  # WebSocket service (NEW!)
  - type: web
    name: tastebook-socket
    env: python
    buildCommand: "pip install -r requirements.txt"
    startCommand: "python src/socket_app.py"
    envVars:
      - key: SOCKET_PORT
        value: 10000
```

## Testing

### Test WebSocket Connection

```javascript
// Browser console
socketService.connect()
  .then(() => console.log('Connected!'))
  .catch(err => console.error('Failed:', err));

socketService.disconnect();
```

### Test Event Flow

1. Open two browser tabs with Messages page
2. Connect WebSocket in both tabs
3. Send a message in Tab 1
4. Should appear instantly in Tab 2

## API Endpoints

### WebSocket Server Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check |
| `/emit/message_received` | POST | Trigger message broadcast |
| `/emit/messages_read` | POST | Trigger read receipt |
| `/emit/chat_deleted` | POST | Trigger chat deletion |

### SocketIO Events

| Event | Direction | Data |
|-------|-----------|------|
| `connect` | Server → Client | Connection confirmation |
| `disconnect` | Server → Client | Disconnection notice |
| `join_chat` | Client → Server | `{chat_id, user_id}` |
| `leave_chat` | Client → Server | `{chat_id, user_id}` |
| `message_received` | Server → Client | `{chat_id, message}` |
| `messages_marked_read` | Server → Client | `{chat_id, user_id}` |
| `chat_was_deleted` | Server → Client | `{chat_id, deleted_by}` |

## Next Steps

1. ✅ Test both services independently
2. ✅ Test WebSocket connect/disconnect in UI
3. ✅ Verify messages work with and without WebSocket
4. ✅ Deploy to production
5. ✅ Monitor performance and resource usage

## Support

For issues or questions:
1. Check browser console for `[SOCKET]` logs
2. Check terminal for WebSocket server logs
3. Verify both services are running
4. Check environment variables

---

**Implementation Date**: October 8, 2025
**Status**: ✅ Complete and Ready for Use
