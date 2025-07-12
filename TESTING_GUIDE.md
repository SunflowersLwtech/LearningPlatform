# 🧪 Learning Platform Testing Guide

## Prerequisites

Before testing, ensure you have:
- Node.js 16.0+ installed
- MongoDB installed and running (or MongoDB Atlas account)
- A modern web browser (Chrome, Firefox, Safari, Edge)

## Phase 1: Environment Setup

### Step 1: Navigate to Project Directory
```bash
cd /home/liuwei/LearningPlatform
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment
```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your settings (optional for local testing)
# Default MongoDB URI: mongodb://localhost:27017/learning_platform
```

### Step 4: Start MongoDB (if local)
```bash
# For Ubuntu/Debian
sudo systemctl start mongod

# For macOS (with Homebrew)
brew services start mongodb-community

# For Windows
net start MongoDB
```

### Step 5: Initialize Database with Test Data
```bash
npm run seed
```

**Expected Output:**
```
MongoDB Connected: localhost:27017
开始初始化数据...
数据初始化完成！
管理员账号: principal@school.edu / admin123
教师账号: wang@school.edu / admin123
学生登录使用学号作为用户名和密码，如: 20230001 / 20230001
种子数据创建成功
```

### Step 6: Start the Server
```bash
npm run dev
```

**Expected Output:**
```
服务器运行在端口 3000
环境: development
MongoDB Connected: localhost:27017
实时通知系统已启动
```

## Phase 2: Basic System Testing

### Step 7: Access the Application
1. Open your web browser
2. Navigate to: `http://localhost:3000`
3. You should see the welcome page with system introduction

**✅ Checkpoint:** Welcome page loads with 4 feature cards and login/register buttons

### Step 8: Test User Authentication

#### A. Test Principal Login (Admin)
1. Click "登录" button
2. Select "教职工" as user type
3. Enter credentials:
   - Username: `principal@school.edu`
   - Password: `admin123`
4. Click "登录"

**✅ Expected Results:**
- Login successful message appears
- Navigation bar updates to show user name
- Sidebar appears with all menu options
- Dashboard loads with admin statistics

#### B. Test Teacher Login
1. Logout (click user dropdown → 退出登录)
2. Login with teacher credentials:
   - Username: `wang@school.edu`
   - Password: `admin123`

**✅ Expected Results:**
- Teacher dashboard loads
- Limited menu options (no student management for regular teachers)
- Statistics show teacher-specific data

#### C. Test Student Login
1. Logout and login as student:
   - User type: "学生"
   - Username: `20230001`
   - Password: `20230001`

**✅ Expected Results:**
- Student dashboard loads
- Student-specific menu (no admin options)
- Shows pending assignments and recent grades

## Phase 3: Core Module Testing

### Step 9: Test 校务与学籍管理 (Administration Module)

#### A. Student Management (Login as Principal)
1. Login as principal
2. Click "学生管理" in sidebar
3. Verify student list displays
4. Test search functionality
5. Click on a student to view details
6. Test student status updates

**Test Cases:**
- Search by name: "学生1"
- Search by student ID: "20230001"
- Filter by grade: "高一"
- View student profile
- Update student information

#### B. Class Management
1. Click "班级管理"
2. View class list
3. Check class details
4. Test class scheduling features

### Step 10: Test 教学过程管理 (Teaching Module)

#### A. Course Management (Login as Teacher)
1. Login as teacher (wang@school.edu)
2. Click "课程管理"
3. View assigned courses
4. Test course details

#### B. Assignment Management
1. Click "作业管理"
2. Create new assignment:
   - Title: "测试作业"
   - Type: "homework"
   - Set due date (future date)
   - Add questions or description
3. Publish assignment
4. View assignment list

**✅ Expected Results:**
- Assignment creation form works
- Assignment appears in list
- Status shows as "published"

### Step 11: Test 学生学习与互动 (Learning Module)

#### A. Student Dashboard (Login as Student)
1. Login as student (20230001)
2. Check dashboard shows:
   - Pending assignments
   - Recent grades
   - Active discussions

#### B. Assignment Submission
1. Click on an assignment from dashboard
2. Test assignment submission:
   - Fill in answers
   - Upload files (if applicable)
   - Submit assignment

**✅ Expected Results:**
- Assignment details load correctly
- Submission form works
- Success message after submission

#### C. Resource Access
1. Click "资源库"
2. Browse available resources
3. Test download functionality

### Step 12: Test 评价与分析 (Analytics Module)

#### A. Grading (Login as Teacher)
1. Login as teacher
2. Go to assignment submissions
3. Grade a student submission:
   - Enter score
   - Add comments
   - Save grade

#### B. Reports and Analytics (Login as Principal)
1. Login as principal
2. Click "数据分析"
3. Generate student report
4. View class performance
5. Check grade distribution

## Phase 4: Advanced Feature Testing

### Step 13: Test Real-time Notifications

#### A. Setup Multiple Browser Windows
1. Open 2 browser windows
2. Window 1: Login as teacher
3. Window 2: Login as student

#### B. Test Notification Flow
1. Teacher creates new assignment
2. Check if student receives notification
3. Student submits assignment
4. Check if teacher receives notification

**✅ Expected Results:**
- Real-time notifications appear
- Notification count updates
- Sound plays (if enabled)

### Step 14: Test File Upload System

#### A. Resource Upload (Login as Teacher)
1. Navigate to resource management
2. Upload a test file (PDF, image, or document)
3. Verify file appears in resource list
4. Test file download

#### B. Assignment File Submission (Login as Student)
1. Submit assignment with file attachment
2. Verify file uploads successfully

### Step 15: Test Permission System

#### A. Role-based Access
1. Login as different user types
2. Verify menu visibility:
   - Principal: All options visible
   - Teacher: Limited admin access
   - Student: Learning-focused options only

#### B. API Endpoint Protection
1. Try accessing admin endpoints as student
2. Verify proper error messages

## Phase 5: System Stress Testing

### Step 16: Data Volume Testing

#### A. Create Multiple Records
1. Add more students via API or interface
2. Create multiple assignments
3. Generate bulk submissions
4. Test system performance

#### B. Pagination Testing
1. Test with >20 students per page
2. Verify pagination works correctly
3. Check search with large datasets

### Step 17: Browser Compatibility

Test the application in different browsers:
- Chrome (latest)
- Firefox (latest)
- Safari (if on Mac)
- Edge (if on Windows)

**Test Points:**
- Login functionality
- Dashboard loading
- Real-time notifications
- File uploads
- Responsive design

### Step 18: Mobile Responsiveness

1. Test on mobile device or browser dev tools
2. Check responsive layout
3. Test touch interactions
4. Verify mobile navigation

## Phase 6: Error Handling & Edge Cases

### Step 19: Error Scenario Testing

#### A. Invalid Login Attempts
1. Try wrong password
2. Try non-existent user
3. Test with empty fields

#### B. Network Error Simulation
1. Disconnect internet briefly
2. Check error handling
3. Test reconnection

#### C. File Upload Limits
1. Try uploading very large file
2. Try unsupported file types
3. Test multiple file uploads

### Step 20: Data Validation Testing

#### A. Form Validation
1. Submit forms with missing required fields
2. Test with invalid data formats
3. Check client-side validation

#### B. API Input Validation
1. Send malformed requests
2. Test SQL injection attempts
3. Verify proper error responses

## Performance Benchmarks

### Expected Performance Metrics:
- **Page Load Time**: < 3 seconds
- **API Response Time**: < 500ms
- **File Upload**: 10MB in < 30 seconds
- **Real-time Notifications**: < 1 second delay
- **Database Queries**: < 100ms average

### Memory Usage:
- **Server**: < 200MB for 100 concurrent users
- **Database**: Efficient with proper indexing
- **Browser**: Reasonable for modern devices

## Troubleshooting Common Issues

### Issue 1: MongoDB Connection Failed
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod
```

### Issue 2: Port 3000 Already in Use
```bash
# Find and kill process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

### Issue 3: Permission Denied for File Uploads
```bash
# Create uploads directory with proper permissions
mkdir -p uploads/{assignments,resources,general}
chmod 755 uploads/
```

### Issue 4: Real-time Notifications Not Working
1. Check browser console for WebSocket errors
2. Verify Socket.io connection in Network tab
3. Test with different browsers

## Test Completion Checklist

- [ ] System starts successfully
- [ ] All user types can login
- [ ] Student management works
- [ ] Class management functions
- [ ] Course creation and management
- [ ] Assignment creation and submission
- [ ] Grading system works
- [ ] Analytics and reports generate
- [ ] Real-time notifications function
- [ ] File upload/download works
- [ ] Permissions are properly enforced
- [ ] Mobile responsive design
- [ ] Error handling works properly
- [ ] Performance meets benchmarks

## Success Criteria

✅ **System is ready for production if:**
1. All core modules function correctly
2. User authentication and authorization work
3. Real-time features operate smoothly
4. File management is secure and functional
5. Data analytics provide meaningful insights
6. System handles expected user load
7. Security measures are effective
8. User interface is intuitive and responsive

## Next Steps After Testing

1. **Deploy to Production Server**
2. **Set up SSL Certificate**
3. **Configure Production Database**
4. **Set up Monitoring and Logging**
5. **Create User Documentation**
6. **Train End Users**
7. **Establish Backup Procedures**
8. **Plan Maintenance Schedule**