# 🚀 WebSocket Isolation - Quick Start Guide

## ✅ Implementation Status: COMPLETE

All code changes have been successfully implemented. Follow these steps to test and use the new isolated WebSocket architecture.

---

## 🎯 Quick Test (5 minutes)

### Step 1: Install Dependencies
```bash
cd /workspaces/tastebook
pipenv install
```

### Step 2: Start Both Services
```bash
pipenv run both
```

You should see:
```
[REST API] Starting Flask API on port 3001
[WEBSOCKET] 🚀 Starting WebSocket server on port 3002
```

### Step 3: Start Frontend (in new terminal)
```bash
npm run dev
```

### Step 4: Test in Browser

1. Open `http://localhost:3000/messages`
2. You should see a **yellow warning banner**: "WebSocket Disconnected"
3. Click **"Connect WebSocket"** button
4. Banner turns **green**: "WebSocket connected - Real-time messaging active"
5. Send a message - it should appear instantly
6. Click **"Disconnect"** button
7. Messages still work, but no real-time updates

---

## 🐛 Troubleshooting

### Port 3001 or 3002 already in use?

**Find and kill the process:**
```bash
lsof -ti:3001 | xargs kill -9
lsof -ti:3002 | xargs kill -9
```

### Services won't start?

**Check if Python packages are installed:**
```bash
pipenv install
```

**Check if `.env` file exists:**
```bash
cat .env | grep SOCKET
```

Should show:
```
SOCKET_PORT=3002
SOCKET_SERVER_URL=http://localhost:3002
VITE_SOCKET_URL=...
```

### WebSocket won't connect in browser?

**1. Check if WebSocket server is running:**
```bash
curl http://localhost:3002/health
```

Should return: `{"status": "healthy", "service": "websocket"}`

**2. Check browser console:**
- Look for `[SOCKET]` messages
- Should see connection attempt logs

**3. Check VITE_SOCKET_URL:**
- Open browser developer tools → Network tab
- Look for WebSocket connection
- Verify URL matches your environment

---

## 📊 Service Ports

| Service | Port | URL |
|---------|------|-----|
| Frontend | 3000 | `http://localhost:3000` |
| REST API | 3001 | `http://localhost:3001` |
| WebSocket | 3002 | `http://localhost:3002` |
| PostgreSQL | 5432 | `localhost:5432` |

---

## 🎮 Useful Commands

### Start Services

```bash
# Both services together
pipenv run both

# Or separately:
pipenv run start    # REST API only
pipenv run socket   # WebSocket only
```

### Check Health

```bash
# REST API
curl http://localhost:3001/api/health

# WebSocket
curl http://localhost:3002/health
```

### View Logs

**REST API logs:**
```bash
# Watch terminal running `pipenv run start`
```

**WebSocket logs:**
```bash
# Watch terminal running `pipenv run socket`
# Look for [SOCKETIO] messages
```

### Database

```bash
# Reset migrations
pipenv run reset_db

# Run migrations
pipenv run migrate
pipenv run upgrade
```

---

## 🧪 Testing Checklist

Use this checklist to verify everything works:

### Backend Tests
- [ ] REST API starts without errors (`pipenv run start`)
- [ ] WebSocket server starts without errors (`pipenv run socket`)
- [ ] `/health` endpoint responds on WebSocket server
- [ ] Can send message via REST API (even with WebSocket off)

### Frontend Tests
- [ ] Messages page loads
- [ ] Shows "WebSocket Disconnected" banner by default
- [ ] Can click "Connect WebSocket" button
- [ ] Toast shows "WebSocket connected! 🟢"
- [ ] Banner turns green
- [ ] Can send/receive messages in real-time (try two tabs)
- [ ] Can click "Disconnect" button
- [ ] Toast shows "WebSocket disconnected 🔴"
- [ ] Messages still work (but require refresh for updates)

### Integration Tests
- [ ] Open two browser tabs
- [ ] Connect WebSocket in both
- [ ] Send message in Tab 1
- [ ] Message appears instantly in Tab 2
- [ ] Disconnect in Tab 1
- [ ] Send message in Tab 2
- [ ] Tab 1 doesn't see it (needs refresh)

---

## 🔧 Configuration

### Development (Local/Codespaces)

**`.env` for local:**
```bash
VITE_BACKEND_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3002
SOCKET_SERVER_URL=http://localhost:3002
```

**`.env` for Codespaces:**
```bash
VITE_BACKEND_URL=https://your-codespace-3001.app.github.dev/
VITE_SOCKET_URL=https://your-codespace-3002.app.github.dev/
SOCKET_SERVER_URL=http://localhost:3002
```

### Production (Render/Heroku)

See `docs/GUIDES/WEBSOCKET_ISOLATION_GUIDE.md` for full deployment instructions.

---

## 📚 Documentation

- **Complete Guide**: `docs/GUIDES/WEBSOCKET_ISOLATION_GUIDE.md`
- **Implementation Summary**: `docs/GUIDES/WEBSOCKET_IMPLEMENTATION_SUMMARY.md`
- **This File**: `docs/GUIDES/WEBSOCKET_QUICK_START.md`

---

## 💡 Key Concepts

### Why Two Servers?

1. **Isolation**: WebSocket logic separated from REST API
2. **Control**: Users activate WebSocket when needed
3. **Efficiency**: Reduced resource usage
4. **Scalability**: Services scale independently

### How Do They Communicate?

```
REST API ──HTTP POST──> WebSocket Server ──SocketIO──> Frontend
```

When a message is sent via REST API, it triggers the WebSocket server to broadcast to all connected clients.

### What If WebSocket Is Down?

The app gracefully degrades:
- Messages still send/receive via REST API
- Updates require page refresh instead of being instant
- No errors or crashes

---

## 🎉 You're Ready!

Everything is set up and ready to use. Start the services and test the implementation!

```bash
# Terminal 1: Start backend services
pipenv run both

# Terminal 2: Start frontend
npm run dev

# Browser: Open localhost:3000/messages
```

**Enjoy your isolated WebSocket architecture! 🚀**

---

**Last Updated**: October 8, 2025  
**Status**: ✅ Ready for Use  
**Branch**: `isolate-websocket-logic`
