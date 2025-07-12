# 🚀 START THE APPLICATION - FINAL STEPS

## ✅ GREAT NEWS!
- ✅ MongoDB is running and connected!
- ✅ System configuration is complete!
- ✅ All dependencies installed!

## 🎯 NEXT STEPS (Run these in WSL2 terminal):

### Step 1: Open WSL2 Terminal
From your PowerShell, type:
```
wsl
```

### Step 2: Navigate to Project Directory
```bash
cd /home/liuwei/LearningPlatform
```

### Step 3: Initialize Database with Test Data
```bash
npm run seed
```

**Expected output:**
```
开始初始化数据...
数据初始化完成！
管理员账号: principal@school.edu / admin123
教师账号: wang@school.edu / admin123
学生登录使用学号作为用户名和密码，如: 20230001 / 20230001
种子数据创建成功
```

### Step 4: Start the Application
```bash
npm run dev
```

**Expected output:**
```
服务器运行在端口 3000
环境: development
MongoDB Connected: localhost:27017
实时通知系统已启动
```

### Step 5: Open Your Browser
Navigate to: **http://localhost:3000**

## 🔑 LOGIN CREDENTIALS

### 👨‍💼 Admin Account
- Username: `principal@school.edu`
- Password: `admin123`
- Access: Full system administration

### 👩‍🏫 Teacher Account  
- Username: `wang@school.edu`
- Password: `admin123`
- Access: Teaching tools, student management

### 👨‍🎓 Student Account
- Username: `20230001`
- Password: `20230001`
- Access: Learning dashboard, assignments

## 🧪 TESTING THE SYSTEM

### Basic Tests:
1. **Login as admin** → Should see full dashboard with statistics
2. **Navigate to "学生管理"** → Should see list of 60 students
3. **Navigate to "作业管理"** → Should see assignment creation tools
4. **Logout and login as student** → Should see student dashboard

### Advanced Tests:
1. **Create new assignment** (as teacher)
2. **Submit assignment** (as student)  
3. **Grade assignment** (as teacher)
4. **Check real-time notifications**

## 🎉 SUCCESS INDICATORS

✅ **You'll know it's working when:**
- Web page loads without errors
- You can login with any test account
- Dashboard shows data and statistics
- Navigation menu works properly
- Real-time notifications appear

## 🐛 TROUBLESHOOTING

### If npm run seed fails:
```bash
# Check MongoDB is still running
node test-mongodb.js

# If MongoDB stopped, restart it from Windows:
# docker start learning-mongodb
```

### If npm run dev fails:
```bash
# Install nodemon globally
npm install -g nodemon

# Or use regular node
npm start
```

### If port 3000 is busy:
```bash
# Use different port
PORT=3001 npm run dev
```

### If browser can't connect:
- Check Windows Firewall
- Try: http://127.0.0.1:3000
- Try: http://[::1]:3000

## 📱 MOBILE TESTING

The system is responsive! Test on mobile by:
1. Find your local IP: `ip addr show`
2. Open: `http://YOUR_IP:3000` on phone
3. Use same login credentials

## 🔄 STOPPING THE APPLICATION

To stop the server:
- Press `Ctrl+C` in the terminal
- MongoDB will keep running in Docker

To stop MongoDB:
```bash
docker stop learning-mongodb
```

## 🚀 PRODUCTION DEPLOYMENT

Once testing is complete, you can deploy to:
- AWS EC2
- DigitalOcean
- Heroku
- Vercel
- Azure

---

**🎯 Ready to start! Run the commands above and enjoy your Learning Platform!**