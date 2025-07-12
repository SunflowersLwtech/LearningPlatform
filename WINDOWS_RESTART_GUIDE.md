# 🔧 Windows Quick Fix Guide

## 🚨 Current Issue: MongoDB Connection Lost

The server stopped because MongoDB connection was refused. Here's the immediate fix:

## 🔥 STEP 1: Restart MongoDB (Choose One Method)

### Method A: Windows PowerShell (FASTEST)
```powershell
# Open PowerShell as Administrator
docker start learning-mongodb

# Verify it started
docker ps | findstr learning-mongodb
```

### Method B: Docker Desktop GUI (EASIEST)
1. Open Docker Desktop
2. Go to "Containers" tab
3. Find "learning-mongodb"
4. Click the "Start" button
5. Wait for it to show "Running"

## 🚀 STEP 2: Restart Learning Platform Server

After MongoDB is running, **in WSL2 terminal**:

```bash
# Method 1: Use our restart script
./stop-server.sh && ./start-server.sh

# Method 2: Manual restart
pkill -f "node server.js"
nohup node server.js > server.log 2>&1 &

# Method 3: Simple restart
npm run dev
```

## ✅ STEP 3: Verify Everything Works

```bash
# Check status
./monitor.sh

# Test connection
curl -I http://localhost:3000
```

## 🌐 STEP 4: Try Browser Again

Open Windows browser and try:
1. http://localhost:3000
2. http://127.0.0.1:3000
3. http://172.23.15.108:3000

## 🛠️ If Browser Still Fails

### Windows Firewall Fix:
1. Windows Security → Firewall & network protection
2. "Allow an app through firewall"
3. Click "Change Settings"
4. Add "Node.js" or browse to find node.exe
5. Check both "Private" and "Public"

### Alternative: Use Port Forwarding
In PowerShell as Administrator:
```powershell
# Get WSL2 IP
wsl hostname -I

# Forward port (replace 172.x.x.x with actual WSL2 IP)
netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=172.23.15.108

# Test
Start-Process "http://localhost:3000"
```

## 🔄 Complete Reset (If Above Doesn't Work)

1. **Stop everything:**
   ```bash
   ./stop-server.sh
   ```

2. **Restart MongoDB in Windows:**
   ```powershell
   docker stop learning-mongodb
   docker start learning-mongodb
   ```

3. **Clear and restart server:**
   ```bash
   rm -f server.log server.pid
   npm run dev
   ```

## 💡 Prevention Tips

1. **Keep Docker Desktop running** in Windows
2. **Don't close Docker Desktop** while using the platform
3. **Use `./monitor.sh --watch`** to monitor system health
4. **If you see MongoDB errors**, restart Docker first

---

## 🎯 IMMEDIATE ACTION FOR YOU:

1. **Go to Windows PowerShell** and run: `docker start learning-mongodb`
2. **Come back to WSL2** and run: `./start-server.sh`
3. **Try browser again** at: http://localhost:3000

The platform will work once MongoDB is restarted! 🚀