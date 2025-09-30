# How to Stop the WebSocket/Socket.IO Connection

If you're experiencing persistent Socket.IO connections that won't stop even after your Flask server shuts down, here are the ways to stop them:

## Method 1: Browser Console Commands (Development Only)

When running in development mode, you can use these commands in your browser's console:

```javascript
// Stop the socket completely
stopSocket()

// Or access the service directly
socketService.forceDisconnect()

// Check connection status
socketService.getConnectionStatus()
```

## Method 2: Refresh the Page

The simplest way is to refresh your browser page. This will completely reload the React app and reset all WebSocket connections.

## Method 3: Close the Browser Tab

Closing the browser tab will terminate all JavaScript execution and WebSocket connections.

## What We Fixed

1. **Added reconnection limits**: Socket will stop trying to reconnect after 5 failed attempts
2. **Manual disconnect tracking**: When you manually disconnect, it won't try to reconnect
3. **Force disconnect method**: Completely stops the socket and all reconnection attempts
4. **Global debug access**: In development, you can access `socketService` and `stopSocket()` from browser console

## Why This Happens

Socket.IO is designed to maintain persistent connections and automatically reconnect when the connection is lost. This is usually good for user experience, but during development it can be annoying when the server is frequently restarted.

The improvements we made will:
- Limit reconnection attempts to prevent infinite loops
- Respect manual disconnections
- Provide easy ways to stop connections during development
- Clean up properly when components unmount

## Testing the Fix

1. Start your React app
2. Open browser console and check for socket connection logs
3. Stop your Flask server
4. You should see max 5 reconnection attempts, then it stops
5. If it doesn't stop, run `stopSocket()` in the console
