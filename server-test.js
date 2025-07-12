const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Basic middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Test route
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: '🎉 Learning Platform API is working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Basic auth test
app.post('/api/auth/test-login', (req, res) => {
  const { username, password } = req.body;
  
  // Mock authentication
  if (username === 'test' && password === 'test123') {
    res.json({
      success: true,
      message: '✅ Test login successful!',
      user: {
        id: 'test123',
        name: 'Test User',
        role: 'admin'
      },
      token: 'mock-jwt-token'
    });
  } else {
    res.status(401).json({
      success: false,
      message: '❌ Invalid credentials'
    });
  }
});

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'test.html'));
});

// Create a simple test page
app.get('/test', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Learning Platform - System Test</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            .status { padding: 10px; margin: 10px 0; border-radius: 5px; }
            .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
            .test-section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
            button { padding: 10px 20px; margin: 5px; cursor: pointer; background: #007bff; color: white; border: none; border-radius: 3px; }
            button:hover { background: #0056b3; }
            #results { margin-top: 20px; padding: 10px; background: #f8f9fa; border-radius: 5px; }
        </style>
    </head>
    <body>
        <h1>🎓 Learning Platform - System Test</h1>
        <div class="status success">✅ Server is running successfully!</div>
        
        <div class="test-section">
            <h3>🔧 System Tests</h3>
            <button onclick="testAPI()">Test API Connection</button>
            <button onclick="testAuth()">Test Authentication</button>
            <button onclick="testFileSystem()">Test File System</button>
        </div>
        
        <div class="test-section">
            <h3>📊 System Information</h3>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
            <p><strong>Port:</strong> ${process.env.PORT || 3000}</p>
            <p><strong>Node.js:</strong> ${process.version}</p>
        </div>
        
        <div id="results"></div>
        
        <script>
            async function testAPI() {
                try {
                    const response = await fetch('/api/test');
                    const data = await response.json();
                    showResult('API Test', data.success ? '✅ PASSED' : '❌ FAILED', JSON.stringify(data, null, 2));
                } catch (error) {
                    showResult('API Test', '❌ FAILED', error.message);
                }
            }
            
            async function testAuth() {
                try {
                    const response = await fetch('/api/auth/test-login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username: 'test', password: 'test123' })
                    });
                    const data = await response.json();
                    showResult('Auth Test', data.success ? '✅ PASSED' : '❌ FAILED', JSON.stringify(data, null, 2));
                } catch (error) {
                    showResult('Auth Test', '❌ FAILED', error.message);
                }
            }
            
            async function testFileSystem() {
                try {
                    const response = await fetch('/css/style.css');
                    const status = response.ok ? '✅ PASSED' : '❌ FAILED';
                    showResult('File System Test', status, 'Static files: ' + (response.ok ? 'accessible' : 'not accessible'));
                } catch (error) {
                    showResult('File System Test', '❌ FAILED', error.message);
                }
            }
            
            function showResult(testName, status, details) {
                const results = document.getElementById('results');
                results.innerHTML += \`
                    <div style="margin: 10px 0; padding: 10px; border-left: 4px solid \${status.includes('✅') ? '#28a745' : '#dc3545'}; background: #f8f9fa;">
                        <strong>\${testName}:</strong> \${status}<br>
                        <pre style="margin: 5px 0; font-size: 12px;">\${details}</pre>
                    </div>
                \`;
            }
        </script>
        
        <div style="margin-top: 30px; padding: 15px; background: #e9ecef; border-radius: 5px;">
            <h4>🚀 Next Steps:</h4>
            <ol>
                <li>If all tests pass, the basic system is working</li>
                <li>Install MongoDB to enable full functionality</li>
                <li>Run database seed script</li>
                <li>Access the full application</li>
            </ol>
        </div>
    </body>
    </html>
  `);
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
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

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log('🚀 Learning Platform Test Server Started!');
  console.log(`📍 Server running on: http://localhost:${PORT}`);
  console.log(`🧪 Test page: http://localhost:${PORT}/test`);
  console.log(`📊 API test: http://localhost:${PORT}/api/test`);
  console.log('');
  console.log('🔗 Open your browser and navigate to the URLs above to test the system');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server shut down successfully');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server shut down successfully');
    process.exit(0);
  });
});