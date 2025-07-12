#!/bin/bash

echo "🐳 Checking Docker availability..."
echo ""

# Check if docker command exists
if command -v docker &> /dev/null; then
    echo "✅ Docker command found"
    
    # Check if Docker daemon is running
    if docker info &> /dev/null; then
        echo "✅ Docker daemon is running"
        echo "✅ Docker version: $(docker --version)"
        echo ""
        echo "🚀 Ready to start MongoDB container!"
        echo ""
        echo "Run this command to start MongoDB:"
        echo "docker run -d --name learning-mongodb -p 27017:27017 mongo:5.0"
        echo ""
        exit 0
    else
        echo "❌ Docker daemon not running"
        echo "💡 Make sure Docker Desktop is started"
        exit 1
    fi
else
    echo "❌ Docker command not found in WSL2"
    echo ""
    echo "📋 To fix this:"
    echo "1. Open Docker Desktop on Windows"
    echo "2. Go to Settings → Resources → WSL Integration"
    echo "3. Enable integration with your Ubuntu distro"
    echo "4. Click 'Apply & Restart'"
    echo ""
    echo "🔄 Alternative: Run MongoDB from Windows PowerShell:"
    echo "   docker run -d --name learning-mongodb -p 27017:27017 mongo:5.0"
    echo ""
    exit 1
fi