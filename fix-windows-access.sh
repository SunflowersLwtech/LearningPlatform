#!/bin/bash

echo "🔧 Windows Access Troubleshooting Tool"
echo "====================================="

# Get system information
WSL_IP=$(hostname -I | awk '{print $1}')
DEFAULT_GATEWAY=$(ip route show | grep -i default | awk '{ print $3}' | head -n1)

echo "📊 Network Information:"
echo "   WSL2 IP: $WSL_IP"
echo "   Gateway: $DEFAULT_GATEWAY"
echo ""

# Test various connection methods
echo "🧪 Testing connection methods..."
echo ""

echo "1. Testing localhost:3000..."
if curl -s -I http://localhost:3000 >/dev/null 2>&1; then
    echo "   ✅ localhost:3000 works"
else
    echo "   ❌ localhost:3000 failed"
fi

echo "2. Testing 127.0.0.1:3000..."
if curl -s -I http://127.0.0.1:3000 >/dev/null 2>&1; then
    echo "   ✅ 127.0.0.1:3000 works"
else
    echo "   ❌ 127.0.0.1:3000 failed"
fi

echo "3. Testing WSL2 IP ($WSL_IP:3000)..."
if curl -s -I http://$WSL_IP:3000 >/dev/null 2>&1; then
    echo "   ✅ $WSL_IP:3000 works"
else
    echo "   ❌ $WSL_IP:3000 failed"
fi

echo ""
echo "🔍 Checking server status..."
if ps aux | grep -v grep | grep "node server.js" >/dev/null; then
    echo "✅ Node.js server is running"
    
    # Check what the server is listening on
    if command -v ss >/dev/null 2>&1; then
        echo "📡 Server listening on:"
        ss -tlnp | grep :3000 || echo "   ⚠️  Port 3000 not found in listening ports"
    fi
else
    echo "❌ Node.js server is NOT running"
    echo "💡 Run: ./start-server.sh"
    exit 1
fi

echo ""
echo "🪟 Windows Access Solutions:"
echo ""
echo "Method 1 - Try different URLs in Windows browser:"
echo "   http://localhost:3000"
echo "   http://127.0.0.1:3000"
echo "   http://$WSL_IP:3000"
echo ""
echo "Method 2 - Windows Firewall Fix:"
echo "   1. Open Windows Security → Firewall & network protection"
echo "   2. Allow an app through firewall"
echo "   3. Add Node.js or allow port 3000"
echo ""
echo "Method 3 - Use Windows hosts file:"
echo "   1. Edit C:\\Windows\\System32\\drivers\\etc\\hosts"
echo "   2. Add line: $WSL_IP learning-platform.local"
echo "   3. Access: http://learning-platform.local:3000"
echo ""
echo "Method 4 - Port forwarding (Run in Windows PowerShell as Admin):"
echo "   netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=$WSL_IP"
echo ""
echo "Method 5 - Restart with different host binding:"
echo "   ./stop-server.sh"
echo "   HOST=0.0.0.0 PORT=3000 node server.js"

# Create a simple test page accessible via IP
echo ""
echo "🛠️  Creating Windows-accessible test page..."

cat > /tmp/test-server.js << 'EOF'
const http = require('http');
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
    <!DOCTYPE html>
    <html>
    <head><title>Learning Platform Test</title></head>
    <body>
        <h1>✅ Connection Successful!</h1>
        <p>Your Learning Platform is accessible from Windows!</p>
        <p><a href="http://${process.env.HOST || 'localhost'}:3000">Go to Learning Platform</a></p>
        <script>
            setTimeout(() => {
                window.location.href = 'http://${process.env.HOST || 'localhost'}:3000';
            }, 3000);
        </script>
    </body>
    </html>
    `);
});

server.listen(3001, '0.0.0.0', () => {
    console.log('Test server running on http://0.0.0.0:3001');
});
EOF

echo "🧪 Starting test server on port 3001..."
node /tmp/test-server.js &
TEST_PID=$!

sleep 2

echo "✅ Test page available at:"
echo "   http://localhost:3001"
echo "   http://127.0.0.1:3001"  
echo "   http://$WSL_IP:3001"
echo ""
echo "💡 If the test page works but main app doesn't, it's a server binding issue."
echo "🛑 To stop test server: kill $TEST_PID"