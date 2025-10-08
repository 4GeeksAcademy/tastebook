# WebSocket Architecture - Visual Guide

## 🏗️ Architecture Comparison

### BEFORE: Monolithic Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                     Flask Application (Port 3001)                │
│                                                                   │
│  ┌──────────────────┐              ┌──────────────────┐         │
│  │   REST API       │              │   SocketIO       │         │
│  │   Endpoints      │              │   Server         │         │
│  │                  │              │                  │         │
│  │  /api/messages   │              │  @socketio.on()  │         │
│  │  /api/chats      │              │  handlers        │         │
│  │  /api/users      │              │                  │         │
│  └──────────────────┘              └──────────────────┘         │
│                                                                   │
│  Both coupled in same process                                    │
│  Can't control independently                                     │
│  Auto-connects on page load                                      │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │
                    Always Connected
                              │
                    ┌─────────────────┐
                    │    Frontend     │
                    │   React App     │
                    └─────────────────┘
```

### AFTER: Microservices Architecture
```
┌─────────────────────────────┐       ┌─────────────────────────────┐
│   Flask REST API            │       │   WebSocket Server          │
│   (Port 3001)               │       │   (Port 3002)               │
│                             │       │                             │
│  ┌──────────────────┐       │       │  ┌──────────────────┐      │
│  │   REST API       │       │       │  │   SocketIO       │      │
│  │   Endpoints      │       │       │  │   Server         │      │
│  │                  │       │       │  │                  │      │
│  │  /api/messages   │───────┼───────┼──│  /emit/message_  │      │
│  │  /api/chats      │ HTTP  │       │  │     received     │      │
│  │  /api/users      │ POST  │       │  │  /emit/messages_ │      │
│  └──────────────────┘       │       │  │     read         │      │
│                             │       │  │  /health         │      │
│  Independent Process        │       │  └──────────────────┘      │
│  Can restart without        │       │                             │
│  affecting WebSocket        │       │  Independent Process        │
└─────────────────────────────┘       │  User controls connection   │
                                      └─────────────────────────────┘
           ▲                                        ▲
           │                                        │
    REST API Calls                         Manual Connect/Disconnect
           │                                        │
           │                          ┌─────────────┴────────────┐
           │                          │                          │
    ┌──────┴──────────────────────────┴──────────┐             │
    │            Frontend (Port 3000)              │             │
    │                                              │             │
    │  ┌────────────────────────────────────┐     │             │
    │  │   Messages Page                    │     │             │
    │  │                                    │     │             │
    │  │  ┌──────────────────────────┐     │     │             │
    │  │  │ WebSocket Status Banner  │     │     │             │
    │  │  │                          │     │     │             │
    │  │  │ ⚠️ Disconnected          │     │     │             │
    │  │  │ [Connect WebSocket] btn  │─────┼─────┘             │
    │  │  │                          │     │                   │
    │  │  │ OR                       │     │                   │
    │  │  │                          │     │                   │
    │  │  │ ✅ Connected             │     │                   │
    │  │  │ [Disconnect] btn         │     │                   │
    │  │  └──────────────────────────┘     │                   │
    │  │                                    │                   │
    │  │  Messages load via REST API       │                   │
    │  │  Real-time updates via WebSocket  │                   │
    │  └────────────────────────────────────┘                   │
    └───────────────────────────────────────────────────────────┘
```

---

## 🔄 Message Flow Diagram

### Scenario: User sends a message

```
┌──────────┐         ┌─────────────┐         ┌──────────────┐         ┌──────────┐
│ User A   │         │  REST API   │         │  WebSocket   │         │ User B   │
│ (Tab 1)  │         │  :3001      │         │  Server      │         │ (Tab 2)  │
└────┬─────┘         └──────┬──────┘         │  :3002       │         └────┬─────┘
     │                      │                └───────┬──────┘              │
     │                      │                        │                     │
     │ 1. Type message      │                        │                     │
     │ "Hello!"             │                        │                     │
     │                      │                        │                     │
     │ 2. Click Send        │                        │                     │
     ├─────────────────────>│                        │                     │
     │ POST /api/messages   │                        │                     │
     │                      │                        │                     │
     │                      │ 3. Save to DB          │                     │
     │                      │ ✅ Success             │                     │
     │                      │                        │                     │
     │ 4. ✅ Response       │                        │                     │
     │<─────────────────────┤                        │                     │
     │ {message_id: 123}    │                        │                     │
     │                      │                        │                     │
     │                      │ 5. Trigger WebSocket   │                     │
     │                      ├───────────────────────>│                     │
     │                      │ POST /emit/message_    │                     │
     │                      │      received          │                     │
     │                      │ {chat_id, message}     │                     │
     │                      │                        │                     │
     │                      │                        │ 6. Broadcast        │
     │                      │                        ├────────────────────>│
     │                      │                        │ SocketIO Event      │
     │                      │                        │ 'message_received'  │
     │                      │                        │                     │
     │                      │                        │                     │ 7. Message appears
     │                      │                        │                     │ instantly! ✨
     │                      │                        │                     │
     │ 8. Also receives     │                        │                     │
     │ (if connected)       │<───────────────────────┤                     │
     │<─────────────────────┤                        │                     │
     │                      │                        │                     │
```

### If WebSocket is NOT connected:

```
┌──────────┐         ┌─────────────┐         ┌──────────────┐         ┌──────────┐
│ User A   │         │  REST API   │         │  WebSocket   │         │ User B   │
│ (WS ❌)  │         │  :3001      │         │  Server ❌   │         │ (WS ❌)  │
└────┬─────┘         └──────┬──────┘         │              │         └────┬─────┘
     │                      │                └──────────────┘              │
     │                      │                                              │
     │ 1. Send message      │                                              │
     ├─────────────────────>│                                              │
     │ POST /api/messages   │                                              │
     │                      │                                              │
     │ 2. ✅ Response       │                                              │
     │<─────────────────────┤                                              │
     │                      │                                              │
     │ 3. Message sent! ✅  │         ⚠️ WebSocket offline               │
     │ (shown in UI)        │         No broadcast sent                   │
     │                      │                                              │
     │                      │                                              │
     │                      │                                      4. User B needs
     │                      │                                      to refresh page
     │                      │                                      to see new msg
     │                      │                                              │
```

---

## 🎛️ Connection States

### State 1: Both Users Connected to WebSocket
```
User A [🟢 WS] ←─────────────────────────→ [🟢 WS] User B
                Real-time sync ✨
                Instant updates
```

### State 2: One User Connected, One Disconnected
```
User A [🟢 WS] ──────────────────────────→ [🔴 WS] User B
       ↓ Sends message                      ↓ Needs refresh
       ✅ Instant update                     ⚠️ No notification
```

### State 3: Both Users Disconnected
```
User A [🔴 WS] ←──────────────────────────→ [🔴 WS] User B
       ↓ Sends message                      ↓ Receives via API
       ✅ Works fine                         ⚠️ Manual refresh needed
       Messages stored in DB ✅
```

---

## 🐳 Docker Container Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  Docker Compose Environment                      │
│                                                                   │
│  ┌────────────────┐   ┌────────────────┐   ┌────────────────┐  │
│  │  app service   │   │ socket service │   │  db service    │  │
│  │  (REST API)    │   │  (WebSocket)   │   │  (PostgreSQL)  │  │
│  │                │   │                │   │                │  │
│  │  Flask App     │   │  Socket App    │   │  Port: 5432    │  │
│  │  Port: 3001    │   │  Port: 3002    │   │                │  │
│  │                │   │                │   │                │  │
│  │  pipenv run    │   │  pipenv run    │   │  Database      │  │
│  │  start         │   │  socket        │   │  tastebook     │  │
│  └───────┬────────┘   └───────┬────────┘   └────────┬───────┘  │
│          │                    │                      │           │
│          └────────────────────┴──────────────────────┘           │
│                    Shared Network                                │
│                    network_mode: service:db                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📡 Event Broadcasting

### SocketIO Rooms

Each chat has its own "room":

```
Chat Room: chat_123
├── User A (socket_id: abc123)
├── User B (socket_id: def456)
└── User C (socket_id: ghi789)

When message sent to chat_123:
→ Broadcast to room "chat_123"
→ All users in room receive event
→ Real-time sync! ✨
```

### Room Management

```
User Opens Chat               User Leaves Chat
       │                            │
       ├─→ join_chat event          ├─→ leave_chat event
       │   {chat_id: 123,           │   {chat_id: 123,
       │    user_id: 1}              │    user_id: 1}
       │                            │
       ▼                            ▼
  Added to room                Removed from room
  "chat_123"                   "chat_123"
       │                            │
       ▼                            ▼
  Receives all                 No longer receives
  events for                   events for
  that chat                    that chat
```

---

## 🔌 Connection Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                    WebSocket Connection Lifecycle                │
└─────────────────────────────────────────────────────────────────┘

1. Page Load
   ┌──────────────┐
   │ Disconnected │  ← Default state
   └──────┬───────┘
          │
          │ User clicks "Connect WebSocket"
          ▼
   ┌──────────────┐
   │ Connecting... │  ← socketService.connect()
   └──────┬───────┘
          │
          │ Success!
          ▼
   ┌──────────────┐
   │  Connected   │  ← Green banner, real-time active
   └──────┬───────┘
          │
          ├─→ Automatic reconnect on disconnect (up to 5 attempts)
          │
          │ User clicks "Disconnect" OR max reconnects reached
          ▼
   ┌──────────────┐
   │ Disconnected │  ← Back to default
   └──────────────┘
```

---

## 🎨 UI States

### Disconnected State
```
┌────────────────────────────────────────────────────────────┐
│ ⚠️ WebSocket Disconnected                                  │
│                                                            │
│ Connect to enable real-time messaging features             │
│                                                            │
│                          [Connect WebSocket Button]        │
└────────────────────────────────────────────────────────────┘

Messages work normally, but:
  • No instant updates
  • No real-time notifications
  • Need to refresh to see new messages
```

### Connected State
```
┌────────────────────────────────────────────────────────────┐
│ ✅ WebSocket connected - Real-time messaging active        │
│                                              [Disconnect]   │
└────────────────────────────────────────────────────────────┘

All features active:
  ✓ Instant message delivery
  ✓ Real-time read receipts
  ✓ Live chat updates
  ✓ Notifications
```

---

## 🚦 Status Indicators

```
Backend Status Check:

Flask API (3001)               WebSocket (3002)
      │                              │
      ▼                              ▼
 GET /api/health             GET /health
      │                              │
      ▼                              ▼
 {"status": "ok"}        {"status": "healthy",
                          "service": "websocket"}

Frontend Connection:

socketService.getConnectionStatus()
      │
      ├─→ true  (🟢 Connected)
      └─→ false (🔴 Disconnected)
```

---

**Visual diagrams created**: October 8, 2025  
**Architecture**: Microservices with manual connection control  
**Status**: ✅ Production Ready
