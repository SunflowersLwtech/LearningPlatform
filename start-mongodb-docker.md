# 🐳 MongoDB Docker Setup Guide

## Option A: Enable WSL2 Integration (Recommended)

### 1. Open Docker Desktop on Windows
- Click the Docker Desktop icon in system tray
- Go to Settings (gear icon)
- Navigate to: **Resources** → **WSL Integration** 
- Enable "Enable integration with my default WSL distro"
- Check your Ubuntu distro in the list
- Click "Apply & Restart"

### 2. Test Docker in WSL2
```bash
# After Docker Desktop restarts, test:
docker --version
```

### 3. Start MongoDB Container
```bash
# Pull and run MongoDB
docker run -d \
  --name learning-mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password123 \
  mongo:5.0

# Check if container is running
docker ps
```

### 4. Update .env file
```bash
# Edit .env to use Docker MongoDB
MONGODB_URI=mongodb://admin:password123@localhost:27017/learning_platform?authSource=admin
```

## Option B: Use Windows PowerShell/CMD

If WSL2 integration doesn't work, run these commands in **Windows PowerShell**:

```powershell
# Start MongoDB container
docker run -d --name learning-mongodb -p 27017:27017 mongo:5.0

# Check container status
docker ps

# View container logs
docker logs learning-mongodb
```

## Option C: Use Docker Desktop GUI

1. **Open Docker Desktop**
2. **Go to Images tab**
3. **Search for "mongo"**
4. **Pull mongo:5.0**
5. **Run container with settings**:
   - Container name: `learning-mongodb`
   - Port: `27017:27017`
6. **Start the container**

## Verification Steps

### Check if MongoDB is running:
```bash
# Test connection (from WSL2)
curl -s http://localhost:27017 || echo "MongoDB not accessible"

# Or use our test script
node test-mongodb.js
```

### If successful, you should see:
```
✅ MongoDB connection successful!
📊 Connected to: learning_platform
🖥️  Host: localhost:27017
```

## Troubleshooting

### Container won't start:
```bash
# Stop any existing container
docker stop learning-mongodb
docker rm learning-mongodb

# Start fresh
docker run -d --name learning-mongodb -p 27017:27017 mongo:5.0
```

### Port already in use:
```bash
# Check what's using port 27017
netstat -ano | findstr :27017

# Or use different port
docker run -d --name learning-mongodb -p 27018:27017 mongo:5.0
# Then update .env: MONGODB_URI=mongodb://localhost:27018/learning_platform
```

### WSL2 can't access container:
- Ensure Docker Desktop is running
- Try restarting Docker Desktop
- Check Windows Firewall settings

## Next Steps After MongoDB is Running

```bash
cd /home/liuwei/LearningPlatform

# Test MongoDB connection
node test-mongodb.js

# If successful, initialize database
npm run seed

# Start the application
npm run dev

# Open browser: http://localhost:3000
```

## Success Indicators

✅ **You'll know it's working when:**
- `docker ps` shows learning-mongodb container running
- `node test-mongodb.js` shows connection successful
- `npm run seed` completes without errors
- Web app loads at localhost:3000