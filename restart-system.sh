#!/bin/bash

echo "🔄 Learning Platform System Restart"
echo "=================================="
echo "Time: $(date)"
echo ""

# Stop any existing server processes
echo "🛑 Stopping existing servers..."
pkill -f "node server.js" 2>/dev/null || true
pkill -f "nodemon" 2>/dev/null || true
sleep 2

# Clean up old logs and PID files
rm -f server.log server.pid nohup.out

echo "✅ Cleanup completed"
echo ""

# Check if MongoDB is accessible
echo "📊 Testing MongoDB connection..."
if timeout 5 node -e "
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/learning_platform', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 3000
}).then(() => {
  console.log('MongoDB connection successful');
  process.exit(0);
}).catch((err) => {
  console.log('MongoDB connection failed:', err.message);
  process.exit(1);
});
" 2>/dev/null; then
    echo "✅ MongoDB is accessible"
else
    echo "❌ MongoDB connection failed"
    echo ""
    echo "🚨 MANUAL ACTION REQUIRED:"
    echo "Please restart MongoDB using one of these methods:"
    echo ""
    echo "Method 1 - Windows PowerShell (as Administrator):"
    echo "  docker start learning-mongodb"
    echo ""
    echo "Method 2 - Docker Desktop GUI:"
    echo "  1. Open Docker Desktop"
    echo "  2. Go to Containers tab"
    echo "  3. Find 'learning-mongodb'"
    echo "  4. Click Start button"
    echo ""
    echo "Method 3 - Fresh MongoDB container:"
    echo "  docker run -d --name learning-mongodb-new -p 27017:27017 mongo:5.0"
    echo ""
    echo "⏳ After restarting MongoDB, run this script again."
    echo ""
    read -p "Press Enter after MongoDB is running, or Ctrl+C to exit..."
    echo ""
    
    # Test again
    if timeout 5 node -e "
    const mongoose = require('mongoose');
    mongoose.connect('mongodb://localhost:27017/learning_platform', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 3000
    }).then(() => {
      console.log('MongoDB connection successful');
      process.exit(0);
    }).catch((err) => {
      console.log('MongoDB connection failed:', err.message);
      process.exit(1);
    });
    " 2>/dev/null; then
        echo "✅ MongoDB is now accessible!"
    else
        echo "❌ MongoDB still not accessible. Please check Docker and try again."
        exit 1
    fi
fi

echo ""
echo "🚀 Starting Learning Platform server..."

# Start server with enhanced configuration
cat > start-server-robust.js << 'EOF'
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const mongoose = require('mongoose');
const os = require('os');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Enhanced MongoDB connection with retry logic
const connectDB = async () => {
  const maxRetries = 5;
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/learning_platform', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      
      console.log('✅ MongoDB Connected:', mongoose.connection.host);
      return;
    } catch (error) {
      retries++;
      console.log(`❌ MongoDB connection attempt ${retries}/${maxRetries} failed:`, error.message);
      
      if (retries < maxRetries) {
        console.log(`⏳ Retrying in 3 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      } else {
        console.log('💥 Failed to connect to MongoDB after', maxRetries, 'attempts');
        console.log('🚨 Please ensure MongoDB is running:');
        console.log('   - Docker: docker start learning-mongodb');
        console.log('   - Or run: docker run -d --name learning-mongodb -p 27017:27017 mongo:5.0');
        process.exit(1);
      }
    }
  }
};

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime()
  });
});

// API routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/students', require('./src/routes/students'));
app.use('/api/classes', require('./src/routes/classes'));
app.use('/api/courses', require('./src/routes/courses'));
app.use('/api/assignments', require('./src/routes/assignments'));
app.use('/api/learning', require('./src/routes/learning'));
app.use('/api/analytics', require('./src/routes/analytics'));

app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: '🎓 Learning Platform API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    mongodb_status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Initialize and start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Initialize Socket.io
    const { initializeSocket } = require('./src/utils/notifications');
    initializeSocket(server);
    
    const PORT = process.env.PORT || 3000;
    const HOST = process.env.HOST || '0.0.0.0';
    
    server.listen(PORT, HOST, () => {
      console.log('🚀 Learning Platform Started Successfully!');
      console.log('==========================================');
      console.log(`📍 Server: ${HOST}:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`💾 Database: ${mongoose.connection.name}`);
      console.log('🔔 Real-time notifications: Active');
      
      // Get network interfaces
      const networkInterfaces = os.networkInterfaces();
      const localIPs = [];
      
      Object.keys(networkInterfaces).forEach(interfaceName => {
        networkInterfaces[interfaceName].forEach(interface => {
          if (interface.family === 'IPv4' && !interface.internal) {
            localIPs.push(interface.address);
          }
        });
      });
      
      console.log('\n🌐 Access URLs:');
      console.log(`   http://localhost:${PORT}`);
      console.log(`   http://127.0.0.1:${PORT}`);
      if (localIPs.length > 0) {
        localIPs.forEach(ip => {
          console.log(`   http://${ip}:${PORT}`);
        });
      }
      
      console.log('\n🔑 Login Credentials:');
      console.log('   Admin: principal@school.edu / admin123');
      console.log('   Teacher: wang@school.edu / admin123');
      console.log('   Student: 20230001 / 20230001');
      
      console.log('\n✅ System Ready for Use!');
      console.log('==========================================\n');
    });
    
    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down gracefully...');
      server.close(async () => {
        await mongoose.disconnect();
        console.log('✅ Server stopped');
        process.exit(0);
      });
    });
    
  } catch (error) {
    console.error('💥 Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
EOF

# Start the robust server
echo "🎯 Launching robust server with MongoDB retry logic..."
nohup node start-server-robust.js > server.log 2>&1 &
SERVER_PID=$!
echo $SERVER_PID > server.pid

echo "📍 Server PID: $SERVER_PID"
echo "📝 Logs: tail -f server.log"

# Wait for server to start
echo "⏳ Waiting for server to initialize..."
sleep 5

# Test server
echo ""
echo "🧪 Testing server connectivity..."
if curl -s http://localhost:3000/health >/dev/null 2>&1; then
    echo "✅ Server health check passed"
    
    # Get server info
    SERVER_INFO=$(curl -s http://localhost:3000/health)
    echo "📊 Server Status: $SERVER_INFO"
else
    echo "❌ Server health check failed"
    echo "📝 Recent logs:"
    tail -10 server.log
    exit 1
fi

echo ""
echo "🎉 SYSTEM RESTART COMPLETED!"
echo "=========================="
echo ""
echo "🌐 Try these URLs in your Windows browser:"
echo "   http://localhost:3000"
echo "   http://127.0.0.1:3000"

# Get WSL2 IP
WSL_IP=$(hostname -I | awk '{print $1}')
echo "   http://$WSL_IP:3000"

echo ""
echo "🔑 Login with:"
echo "   principal@school.edu / admin123"
echo ""
echo "🛠️ Management commands:"
echo "   Monitor: ./monitor.sh"
echo "   Stop: kill $SERVER_PID"
echo "   Logs: tail -f server.log"
echo ""
EOF