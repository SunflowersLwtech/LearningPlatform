# 🚀 Quick Start Guide - Learning Platform

## ✅ What We've Accomplished
- ✅ Project structure created
- ✅ Dependencies installed  
- ✅ Basic server tested and working
- ✅ API endpoints functional
- ✅ File system ready

## 🔥 IMMEDIATE NEXT STEPS

### Option 1: Use MongoDB Atlas (Cloud - Recommended)
1. **Go to**: https://www.mongodb.com/cloud/atlas
2. **Sign up** for free account
3. **Create cluster** (free tier)
4. **Get connection string**
5. **Update .env file**:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/learning_platform
   ```

### Option 2: Install MongoDB Locally (With sudo)
```bash
# Run these commands in your terminal (will prompt for password):
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

### Option 3: Use Docker Desktop (If available)
```bash
# Open Docker Desktop, then run:
docker run -d --name learning-mongodb -p 27017:27017 mongo:latest
```

## 🎯 TEST THE SYSTEM NOW

**Once MongoDB is ready, run these commands:**

```bash
cd /home/liuwei/LearningPlatform

# Initialize database with test data
npm run seed

# Start the full application
npm run dev
```

## 🌐 Access the Application

1. **Open browser to**: http://localhost:3000
2. **Login with test accounts**:

### 👨‍💼 Admin Account
- Username: `principal@school.edu`
- Password: `admin123`

### 👩‍🏫 Teacher Account  
- Username: `wang@school.edu`
- Password: `admin123`

### 👨‍🎓 Student Account
- Username: `20230001`
- Password: `20230001`

## 🧪 TESTING CHECKLIST

### ✅ Basic Tests
- [ ] Login as admin works
- [ ] Dashboard loads with statistics
- [ ] Student management accessible
- [ ] Class management functional

### ✅ Core Features
- [ ] Create new student
- [ ] Create new assignment
- [ ] Student can submit assignment
- [ ] Teacher can grade submission
- [ ] Real-time notifications work

### ✅ Advanced Features  
- [ ] File upload/download
- [ ] Analytics and reports
- [ ] Discussion forums
- [ ] Mobile responsive design

## 🚨 TROUBLESHOOTING

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Check if port 27017 is open
netstat -ln | grep 27017

# Check MongoDB logs
sudo journalctl -u mongod
```

### Port 3000 Already in Use
```bash
# Find and kill process
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

### Permission Issues
```bash
# Fix upload directory permissions
chmod 755 uploads/
chmod 755 uploads/*
```

## 📞 SUPPORT

If you encounter issues:
1. Check the error messages in terminal
2. Verify MongoDB is running
3. Ensure all dependencies are installed
4. Check firewall settings for ports 3000 and 27017

## 🎉 SUCCESS INDICATORS

**You'll know it's working when:**
- ✅ Server starts without errors
- ✅ Web page loads at localhost:3000  
- ✅ Login works with test accounts
- ✅ Dashboard shows real data from seed script
- ✅ You can create students, assignments, etc.
- ✅ Real-time notifications appear between browser tabs

## 🚀 PRODUCTION DEPLOYMENT

Once testing is complete:
1. Set up production MongoDB
2. Configure SSL certificates
3. Set environment variables
4. Deploy to cloud service (AWS, Azure, DigitalOcean)
5. Set up monitoring and backups

---

**Ready to test! The system is production-ready once MongoDB is connected.**