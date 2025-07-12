#!/bin/bash

echo "🚀 Starting Learning Platform Server..."
echo "=================================="

# Check if MongoDB is running
echo "📊 Checking MongoDB connection..."
if node test-mongodb.js > /dev/null 2>&1; then
    echo "✅ MongoDB is connected"
else
    echo "❌ MongoDB connection failed"
    echo "💡 Make sure MongoDB Docker container is running:"
    echo "   docker start learning-mongodb"
    exit 1
fi

# Kill any existing Node processes
echo "🔄 Stopping any existing servers..."
pkill -f "node server.js" 2>/dev/null || true
pkill -f "nodemon" 2>/dev/null || true

# Wait a moment
sleep 2

# Check if port 3000 is free
if command -v lsof >/dev/null 2>&1; then
    if lsof -i :3000 >/dev/null 2>&1; then
        echo "⚠️  Port 3000 is still in use, trying to free it..."
        lsof -ti:3000 | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
fi

echo "🔧 Starting server with enhanced networking..."

# Start server with host binding for WSL2 compatibility
HOST=0.0.0.0 PORT=3000 node server.js &
SERVER_PID=$!

echo "📍 Server PID: $SERVER_PID"
sleep 3

# Test if server is responding
echo "🧪 Testing server connectivity..."

if curl -s http://localhost:3000/api >/dev/null 2>&1; then
    echo "✅ Server is responding on localhost:3000"
else
    echo "⚠️  Server not responding on localhost, trying 127.0.0.1..."
    if curl -s http://127.0.0.1:3000/api >/dev/null 2>&1; then
        echo "✅ Server is responding on 127.0.0.1:3000"
    else
        echo "❌ Server not responding, checking logs..."
        ps aux | grep node
        exit 1
    fi
fi

# Get WSL2 IP for Windows access
WSL_IP=$(ip route show | grep -i default | awk '{ print $3}' | head -n1)
HOST_IP=$(hostname -I | awk '{print $1}')

echo ""
echo "🌐 ACCESS URLS:"
echo "   http://localhost:3000"
echo "   http://127.0.0.1:3000"
echo "   http://$HOST_IP:3000"
echo ""
echo "🔑 LOGIN CREDENTIALS:"
echo "   Admin: principal@school.edu / admin123"
echo "   Teacher: wang@school.edu / admin123"
echo "   Student: 20230001 / 20230001"
echo ""
echo "✅ Server is running! (PID: $SERVER_PID)"
echo "🛑 To stop: kill $SERVER_PID or run ./stop-server.sh"
echo ""
echo "📝 If Windows browser can't connect, try:"
echo "   1. Windows Firewall: Allow Node.js"
echo "   2. Try: http://$HOST_IP:3000"
echo "   3. Run: ./fix-windows-access.sh"

# Keep the script running so we can see the server status
wait $SERVER_PID