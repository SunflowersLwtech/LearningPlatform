#!/bin/bash

echo "📊 Learning Platform Monitor"
echo "=========================="
echo "Time: $(date)"
echo ""

# Check MongoDB
echo "🗄️  MongoDB Status:"
if docker ps --format "table {{.Names}}\t{{.Status}}" | grep learning-mongodb >/dev/null 2>&1; then
    echo "   ✅ Docker container running"
    if node test-mongodb.js >/dev/null 2>&1; then
        echo "   ✅ Database connection OK"
    else
        echo "   ❌ Database connection failed"
    fi
else
    echo "   ❌ Docker container not found"
    echo "   💡 Run: docker start learning-mongodb"
fi

echo ""

# Check Node.js server
echo "🚀 Node.js Server Status:"
if ps aux | grep -v grep | grep "node server.js" >/dev/null; then
    SERVER_PID=$(ps aux | grep -v grep | grep "node server.js" | awk '{print $2}')
    echo "   ✅ Server running (PID: $SERVER_PID)"
    
    # Check port
    if command -v ss >/dev/null 2>&1; then
        if ss -tlnp | grep :3000 >/dev/null; then
            LISTEN_INFO=$(ss -tlnp | grep :3000)
            echo "   ✅ Port 3000 listening: $LISTEN_INFO"
        else
            echo "   ❌ Port 3000 not listening"
        fi
    fi
    
    # Test connectivity
    echo ""
    echo "🔗 Connection Tests:"
    
    if curl -s -I http://localhost:3000/api >/dev/null 2>&1; then
        echo "   ✅ localhost:3000 responding"
    else
        echo "   ❌ localhost:3000 not responding"
    fi
    
    if curl -s -I http://127.0.0.1:3000/api >/dev/null 2>&1; then
        echo "   ✅ 127.0.0.1:3000 responding"
    else
        echo "   ❌ 127.0.0.1:3000 not responding"
    fi
    
    # Get WSL IP
    WSL_IP=$(hostname -I | awk '{print $1}')
    if curl -s -I http://$WSL_IP:3000/api >/dev/null 2>&1; then
        echo "   ✅ $WSL_IP:3000 responding"
    else
        echo "   ❌ $WSL_IP:3000 not responding"
    fi
    
else
    echo "   ❌ Server not running"
    echo "   💡 Run: ./start-server.sh"
fi

echo ""
echo "📈 System Resources:"
echo "   Memory: $(free -h | grep Mem | awk '{print $3 "/" $2}')"
echo "   Disk: $(df -h . | tail -1 | awk '{print $3 "/" $2 " (" $5 " used)"}')"
echo ""

# Check recent logs
if [ -f "server.log" ]; then
    echo "📝 Recent Server Logs (last 5 lines):"
    tail -5 server.log
    echo ""
fi

echo "🛠️  Quick Actions:"
echo "   Start server: ./start-server.sh"
echo "   Stop server: ./stop-server.sh"
echo "   Fix Windows access: ./fix-windows-access.sh"
echo "   MongoDB: docker start learning-mongodb"
echo ""

# Real-time monitoring option
if [ "$1" = "--watch" ] || [ "$1" = "-w" ]; then
    echo "🔄 Monitoring mode (press Ctrl+C to stop)"
    echo ""
    while true; do
        clear
        bash $0
        sleep 5
    done
fi