# 🚀 Render Deployment Guide - Isolated WebSocket Architecture

## 📋 Overview

Your application now deploys as **TWO separate services** on Render:

1. **tastebook-api** - Flask REST API (port varies, assigned by Render)
2. **tastebook-websocket** - WebSocket Server (port 10000)

---

## ✅ What Was Fixed

### **Before** (Broken)
```yaml
services:
  - name: tastebook  # ❌ Single service trying to do both
    startCommand: "gunicorn --worker-class eventlet ..."  # ❌ Won't start WebSocket
```

### **After** (Correct)
```yaml
services:
  - name: tastebook-api           # ✅ REST API only
    startCommand: "gunicorn ..."
    
  - name: tastebook-websocket     # ✅ WebSocket only
    startCommand: "python src/socket_app.py"
```

---

## 🔧 Environment Variables

### **Automatic (Render manages these)**
- `PORT` - Assigned by Render for each service
- `DATABASE_URL` - PostgreSQL connection string

### **You Need to Set These in Render Dashboard**

#### For `tastebook-api` service:
```bash
SOCKET_SERVER_URL=https://tastebook-websocket.onrender.com
JWT_SECRET_KEY=<generate-a-secret>
```

#### For `tastebook-websocket` service:
```bash
SOCKET_PORT=10000
```

#### For your Frontend (in your frontend deployment):
```bash
VITE_BACKEND_URL=https://tastebook-api.onrender.com
VITE_SOCKET_URL=https://tastebook-websocket.onrender.com
```

---

## 📝 Step-by-Step Deployment

### 1. **Commit and Push Your Changes**
```bash
git add .
git commit -m "feat: isolated WebSocket architecture with Render config"
git push origin isolate-websocket-logic
```

### 2. **Deploy to Render**

Option A: **Using render.yaml (Recommended)**
- Render will automatically detect the `render.yaml` file
- It will create both services for you
- Just connect your GitHub repo to Render

Option B: **Manual Setup**
1. Create first service: `tastebook-api`
   - Build Command: `./render_build.sh`
   - Start Command: `gunicorn --bind 0.0.0.0:$PORT wsgi:application --chdir ./src/`
   
2. Create second service: `tastebook-websocket`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `python src/socket_app.py`

### 3. **Set Environment Variables**

In Render Dashboard → `tastebook-api` service → Environment:
```
SOCKET_SERVER_URL = https://tastebook-websocket.onrender.com
JWT_SECRET_KEY = <your-secret-key>
DATABASE_URL = <auto-filled-by-render>
FLASK_DEBUG = 0
```

In Render Dashboard → `tastebook-websocket` service → Environment:
```
SOCKET_PORT = 10000
FLASK_DEBUG = 0
```

### 4. **Generate JWT Secret**
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```
Copy the output and paste it as `JWT_SECRET_KEY`

### 5. **Wait for Both Services to Deploy**
- `tastebook-api` will be at: `https://tastebook-api.onrender.com`
- `tastebook-websocket` will be at: `https://tastebook-websocket.onrender.com`

### 6. **Update Frontend Environment Variables**
If you're deploying the frontend separately (e.g., on Vercel, Netlify):
```bash
VITE_BACKEND_URL=https://tastebook-api.onrender.com
VITE_SOCKET_URL=https://tastebook-websocket.onrender.com
```

---

## 🧪 Testing Your Deployment

### 1. **Test REST API**
```bash
curl https://tastebook-api.onrender.com/api/health
```
Should return: `{"status": "ok"}`

### 2. **Test WebSocket Server**
```bash
curl https://tastebook-websocket.onrender.com/health
```
Should return: `{"status": "healthy", "service": "websocket"}`

### 3. **Test Full Flow**
1. Open your deployed frontend
2. Navigate to Messages page
3. Click "Connect WebSocket"
4. Should see green banner: "WebSocket connected"
5. Send a message
6. Open in another tab/browser
7. Should appear instantly!

---

## 🔍 Troubleshooting

### **Service Won't Start**

**Check Render Logs:**
- Go to Render Dashboard
- Click on service name
- Click "Logs" tab
- Look for error messages

**Common Issues:**

1. **Missing dependencies:**
   ```bash
   # Make sure Pipfile.lock is committed
   git add Pipfile.lock
   git commit -m "Add Pipfile.lock"
   git push
   ```

2. **Port binding error:**
   - Render automatically assigns `$PORT`
   - Make sure `src/socket_app.py` uses `os.getenv("SOCKET_PORT", 10000)`

3. **Database connection error:**
   - Check that `DATABASE_URL` is set in `tastebook-api`
   - WebSocket service doesn't need database access

### **WebSocket Won't Connect from Frontend**

1. **Check CORS:**
   - `src/socket_app.py` has `cors_allowed_origins="*"`
   - This allows all origins (fine for development, consider restricting in production)

2. **Check SSL:**
   - Render provides HTTPS automatically
   - Make sure frontend uses `wss://` (secure WebSocket) not `ws://`
   - socket.io client handles this automatically with HTTPS URLs

3. **Check Environment Variables:**
   ```bash
   # In frontend deployment
   echo $VITE_SOCKET_URL
   # Should show: https://tastebook-websocket.onrender.com
   ```

### **Inter-Service Communication Fails**

If REST API can't trigger WebSocket events:

1. **Check SOCKET_SERVER_URL:**
   ```bash
   # In tastebook-api logs, should show:
   # [SOCKETIO] Message emission request sent: 200
   ```

2. **Internal vs External URLs:**
   - Use **external URL** for `SOCKET_SERVER_URL`
   - Render services communicate via public URLs on free tier

---

## 💰 Cost Breakdown (Free Tier)

Both services can run on Render's **free tier**:

| Service | Free Tier Limits | Notes |
|---------|------------------|-------|
| tastebook-api | 750 hours/month | Spins down after 15 min inactivity |
| tastebook-websocket | 750 hours/month | Spins down after 15 min inactivity |
| postgresql-db | 90 days free trial | Then $7/month or migrate to other DB |

**Total: $0/month** (during free trial)

**After trial:** Just the database ($7/month), services remain free.

---

## 🚦 Service Status Indicators

### **Render Dashboard**
Check that both services show:
- ✅ Green dot = Running
- 🔴 Red dot = Failed
- 🟡 Yellow dot = Building

### **Your Application**
- REST API health: `https://tastebook-api.onrender.com/api/health`
- WebSocket health: `https://tastebook-websocket.onrender.com/health`

---

## 📊 Architecture on Render

```
┌──────────────────────────────────────────────────────────┐
│                    Render Platform                        │
│                                                           │
│  ┌─────────────────────┐    ┌────────────────────────┐  │
│  │  tastebook-api      │    │ tastebook-websocket    │  │
│  │  (Flask REST API)   │    │ (Socket Server)        │  │
│  │                     │    │                        │  │
│  │  Port: $PORT        │───>│  Port: 10000          │  │
│  │  (Render assigned)  │HTTP│  (Fixed)              │  │
│  └─────────┬───────────┘    └───────────┬────────────┘  │
│            │                            │                │
│            └────────────┬───────────────┘                │
│                         │                                │
│                    ┌────▼────────┐                       │
│                    │  PostgreSQL │                       │
│                    │  Database   │                       │
│                    └─────────────┘                       │
└──────────────────────────────────────────────────────────┘
                         ▲            ▲
                         │            │
                    REST API     WebSocket
                         │            │
                    ┌────┴────────────┴────┐
                    │   Frontend (User)    │
                    │   (Browser)          │
                    └──────────────────────┘
```

---

## 🎯 Production Checklist

Before going live:

- [ ] Both services deployed and showing green status
- [ ] Environment variables set correctly
- [ ] JWT_SECRET_KEY is unique and secure
- [ ] Database migrations run successfully
- [ ] REST API health check returns 200
- [ ] WebSocket health check returns 200
- [ ] Frontend connects to both services
- [ ] Can send/receive messages in real-time
- [ ] WebSocket reconnects after disconnect
- [ ] App works with WebSocket disconnected (graceful degradation)

---

## 🎉 Success!

Your isolated WebSocket architecture is now deployed on Render with:
- ✅ Separate, scalable services
- ✅ Independent deployment and monitoring
- ✅ Better resource management
- ✅ Production-ready configuration

**Happy deploying! 🚀**

---

**Last Updated**: October 8, 2025  
**Render Blueprint**: `render.yaml`  
**Status**: ✅ Production Ready
