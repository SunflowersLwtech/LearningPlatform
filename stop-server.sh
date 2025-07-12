#!/bin/bash

echo "🛑 Stopping Learning Platform Server..."

# Kill Node.js processes
pkill -f "node server.js" && echo "✅ Stopped Node.js server"
pkill -f "nodemon" && echo "✅ Stopped nodemon"

# Kill any processes using port 3000
if command -v lsof >/dev/null 2>&1; then
    if lsof -ti:3000 >/dev/null 2>&1; then
        lsof -ti:3000 | xargs kill -9 && echo "✅ Freed port 3000"
    fi
fi

sleep 1

# Check if anything is still running
if ps aux | grep -v grep | grep node >/dev/null; then
    echo "⚠️  Some Node processes still running:"
    ps aux | grep -v grep | grep node
else
    echo "✅ All Node processes stopped"
fi

echo "🔄 Server stopped successfully"