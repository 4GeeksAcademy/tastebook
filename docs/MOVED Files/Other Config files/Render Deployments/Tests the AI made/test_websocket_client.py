#!/usr/bin/env python3
"""
Simple WebSocket client to test for "Bad file descriptor" errors
"""
import socketio
import time
import threading

# Test client
sio = socketio.Client()

@sio.event
def connect():
    print(f"✅ Connected: {sio.sid}")

@sio.event
def disconnect():
    print(f"❌ Disconnected")

@sio.event
def connected(data):
    print(f"📨 Received connected event: {data}")

def test_multiple_connections():
    """Test rapid connections/disconnections that might trigger the error"""
    for i in range(5):
        try:
            print(f"\n🔄 Test {i+1}: Connecting...")
            sio.connect('http://localhost:3002')
            time.sleep(1)
            print(f"🔌 Test {i+1}: Disconnecting...")
            sio.disconnect()
            time.sleep(0.5)
        except Exception as e:
            print(f"❌ Error in test {i+1}: {e}")

def test_rapid_reconnections():
    """Test rapid reconnections without proper cleanup"""
    clients = []
    for i in range(3):
        client = socketio.Client()
        try:
            print(f"🔄 Creating client {i+1}")
            client.connect('http://localhost:3002')
            clients.append(client)
            time.sleep(0.1)
        except Exception as e:
            print(f"❌ Error creating client {i+1}: {e}")
    
    # Disconnect all at once
    for i, client in enumerate(clients):
        try:
            print(f"🔌 Disconnecting client {i+1}")
            client.disconnect()
        except Exception as e:
            print(f"❌ Error disconnecting client {i+1}: {e}")

if __name__ == '__main__':
    print("🧪 Testing WebSocket server for connection issues...")
    
    print("\n1️⃣ Testing sequential connections...")
    test_multiple_connections()
    
    print("\n2️⃣ Testing rapid multiple connections...")
    test_rapid_reconnections()
    
    print("\n✅ Test completed!")