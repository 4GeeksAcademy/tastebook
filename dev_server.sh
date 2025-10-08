#!/bin/bash

# TasteBook Development Server Manager
# Provides proper process management for both REST API and WebSocket services

PID_FILE="/tmp/tastebook_pids.txt"

start_services() {
    echo "🚀 Starting TasteBook services..."
    
    # Clean up any existing PID file
    rm -f "$PID_FILE"
    
    # Start Flask REST API (port 3001)
    echo "📡 Starting REST API on port 3001..."
    pipenv run flask run -p 3001 -h 0.0.0.0 &
    API_PID=$!
    echo "API_PID=$API_PID" >> "$PID_FILE"
    echo "   ✅ REST API started (PID: $API_PID)"
    
    # Start WebSocket server (port 3002)
    echo "🔌 Starting WebSocket server on port 3002..."
    pipenv run python src/socket_app.py &
    SOCKET_PID=$!
    echo "SOCKET_PID=$SOCKET_PID" >> "$PID_FILE"
    echo "   ✅ WebSocket server started (PID: $SOCKET_PID)"
    
    echo ""
    echo "🎉 All services running!"
    echo "   📡 REST API: http://localhost:3001"
    echo "   🔌 WebSocket: http://localhost:3002"
    echo ""
    echo "💡 To stop all services: ./dev_server.sh stop"
    echo "💡 Or use Ctrl+C to stop this script"
    
    # Set up trap to kill all processes on exit
    trap '
        kill -TERM $API_PID $SOCKET_PID 2>/dev/null
        sleep 3
        kill -0 $API_PID 2>/dev/null && kill -KILL $API_PID 2>/dev/null
        kill -0 $SOCKET_PID 2>/dev/null && kill -KILL $SOCKET_PID 2>/dev/null
        rm -f "$PID_FILE"
        echo "🛑 All services stopped"
    ' EXIT
    
    # Wait for all background processes
    wait
}

stop_services() {
    echo "🛑 Stopping TasteBook services..."
    
    if [ -f "$PID_FILE" ]; then
        source "$PID_FILE"
        
        if [ ! -z "$API_PID" ]; then
            kill "$API_PID" 2>/dev/null && echo "   ✅ REST API stopped (PID: $API_PID)"
        fi
        
        if [ ! -z "$SOCKET_PID" ]; then
            kill "$SOCKET_PID" 2>/dev/null && echo "   ✅ WebSocket server stopped (PID: $SOCKET_PID)"
        fi
        
        rm -f "$PID_FILE"
    else
        echo "   ℹ️  No PID file found, trying to kill by process name..."
        pkill -f "flask run -p 3001" 2>/dev/null && echo "   ✅ Flask processes stopped"
        pkill -f "socket_app.py" 2>/dev/null && echo "   ✅ Socket processes stopped"
    fi
    
    echo "🎉 All services stopped"
}

force_stop() {
    echo "💥 Force stopping all TasteBook processes..."
    pkill -f "flask run" 2>/dev/null
    pkill -f "socket_app.py" 2>/dev/null
    pkill -f "python.*socket" 2>/dev/null
    rm -f "$PID_FILE"
    echo "🎉 Force stop complete"
}

status() {
    echo "📊 TasteBook Services Status:"
    
    if pgrep -f "flask run -p 3001" > /dev/null; then
        echo "   📡 REST API: ✅ Running"
    else
        echo "   📡 REST API: ❌ Stopped"
    fi
    
    if pgrep -f "socket_app.py" > /dev/null; then
        echo "   🔌 WebSocket: ✅ Running"
    else
        echo "   🔌 WebSocket: ❌ Stopped"
    fi
}

case "$1" in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    force-stop)
        force_stop
        ;;
    restart)
        stop_services
        sleep 2
        start_services
        ;;
    status)
        status
        ;;
    *)
        echo "TasteBook Development Server Manager"
        echo ""
        echo "Usage: $0 {start|stop|force-stop|restart|status}"
        echo ""
        echo "Commands:"
        echo "  start      - Start both REST API and WebSocket services"
        echo "  stop       - Gracefully stop all services"
        echo "  force-stop - Force kill all related processes"
        echo "  restart    - Stop and start all services"
        echo "  status     - Show status of all services"
        echo ""
        echo "Default (no args): start services"
        
        if [ $# -eq 0 ]; then
            echo ""
            start_services
        fi
        ;;
esac