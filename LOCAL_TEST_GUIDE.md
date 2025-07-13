# 🧪 学习平台本地测试指南

## 📋 快速开始

### 1. 环境要求
- **Node.js**: 14.0+ (推荐 16.x 或 18.x)
- **MongoDB**: 4.4+ (本地运行或云服务)
- **系统**: Windows 10/11, macOS 10.15+, Ubuntu 18.04+

### 2. 一键启动（推荐）
```bash
# 1. 进入项目目录
cd LearningPlatform

# 2. 运行一键启动脚本
./start-dev.sh
```

### 3. 手动启动
```bash
# 1. 安装依赖
npm install

# 2. 初始化数据库
node scripts/initDb.js

# 3. 启动服务器
npm start
# 或使用nodemon自动重启
npm run dev
```

## 🔧 详细测试步骤

### 第一步：验证服务器启动
1. 打开浏览器访问：http://localhost:3000
2. 应该看到学习平台首页
3. 访问 API 状态：http://localhost:3000/api
4. 应该返回JSON格式的系统信息

### 第二步：运行自动化测试
```bash
# 安装测试依赖
npm install axios form-data

# 运行完整测试套件
node scripts/test-local.js
```

### 第三步：手动功能测试

#### 🔐 登录测试
**测试账户：**
- **管理员**: admin@school.edu / admin123
- **校长**: principal@school.edu / admin123  
- **教师**: wang@school.edu / admin123
- **学生**: 20230001 / 20230001

**测试步骤：**
1. 访问登录页面
2. 尝试使用各个角色登录
3. 验证角色权限是否正确

#### 📚 学生管理测试
**使用管理员或校长账户：**
1. 访问学生管理页面
2. 测试添加新学生
3. 测试编辑学生信息
4. 测试学生班级调整
5. 测试学生状态变更

**API测试示例：**
```bash
# 获取访问令牌
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@school.edu","password":"admin123","userType":"staff"}'

# 使用令牌获取学生列表
curl -X GET http://localhost:3000/api/students \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 🏫 班级管理测试
1. 查看班级列表
2. 测试创建新班级
3. 测试班级容量管理
4. 测试班主任分配

#### 📖 课程管理测试
1. 查看课程列表
2. 测试课程创建
3. 测试课程班级关联
4. 测试教师分配

#### 📝 作业管理测试
1. 创建新作业
2. 分配给班级
3. 测试学生提交作业
4. 测试作业批改和评分

### 第四步：高级功能测试

#### 🔄 实时同步测试
1. 打开多个浏览器窗口
2. 在一个窗口中修改数据
3. 验证其他窗口是否实时更新

#### 📁 文件上传测试
1. 测试头像上传
2. 测试作业文件上传
3. 测试各种文件格式
4. 测试文件大小限制

#### 🛡️ 权限测试
1. 使用学生账户尝试访问管理功能
2. 使用教师账户测试课程权限
3. 验证角色权限边界

#### 🔍 数据一致性测试
```bash
# 运行数据一致性检查
curl -X GET http://localhost:3000/api/data-maintenance/consistency-check \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

## 🐛 常见问题排查

### 1. 服务器无法启动
**可能原因：**
- MongoDB未运行
- 端口3000被占用
- 依赖包未安装

**解决方案：**
```bash
# 检查MongoDB状态
systemctl status mongod  # Linux
brew services list | grep mongodb  # macOS

# 检查端口占用
netstat -tlnp | grep :3000  # Linux
lsof -i :3000  # macOS

# 重新安装依赖
rm -rf node_modules package-lock.json
npm install
```

### 2. 数据库连接失败
**检查步骤：**
1. 确认MongoDB正在运行
2. 检查连接字符串（默认：mongodb://localhost:27017）
3. 验证数据库权限

### 3. 学生登录失败
**可能原因：**
- 种子数据中的密码问题

**解决方案：**
```bash
# 运行数据库修复脚本
node scripts/initDb.js
```

### 4. 文件上传失败
**检查：**
- uploads目录是否存在且有写权限
- 文件大小是否超过限制（默认10MB）
- 文件类型是否被允许

## 📊 性能基准

### 响应时间基准
- **API响应**: < 200ms
- **数据库查询**: < 100ms
- **文件上传**: < 2秒（小文件）
- **页面加载**: < 1秒

### 并发基准
- **同时在线用户**: 100+
- **数据库连接**: 20个连接池
- **文件上传**: 10个并发

## 🔧 开发者工具

### 1. 数据库管理
```bash
# 使用MongoDB命令行
mongosh learning_platform

# 查看集合
show collections

# 查看学生数据
db.students.find().limit(5)
```

### 2. 日志查看
```bash
# 查看应用日志
tail -f logs/app.log

# 查看错误日志
tail -f logs/error.log
```

### 3. API调试
推荐使用以下工具：
- **Postman**: 图形化API测试
- **curl**: 命令行API测试
- **Thunder Client**: VS Code插件

## 📝 测试清单

### ✅ 基础功能测试
- [ ] 服务器启动正常
- [ ] 数据库连接成功
- [ ] 所有角色登录正常
- [ ] API端点响应正常

### ✅ 核心功能测试
- [ ] 学生CRUD操作
- [ ] 班级管理功能
- [ ] 课程管理功能
- [ ] 作业管理功能
- [ ] 权限控制正确

### ✅ 高级功能测试
- [ ] 文件上传下载
- [ ] 实时数据同步
- [ ] 数据一致性检查
- [ ] 安全防护措施

### ✅ 性能测试
- [ ] 响应时间符合基准
- [ ] 并发处理正常
- [ ] 内存使用稳定
- [ ] 数据库性能良好

## 🚨 安全测试

### 1. 输入验证测试
```bash
# 测试SQL注入防护
curl "http://localhost:3000/api/students?search='; DROP TABLE students; --"

# 测试XSS防护  
curl "http://localhost:3000/api/students?search=<script>alert('xss')</script>"
```

### 2. 认证测试
```bash
# 测试无效令牌
curl -X GET http://localhost:3000/api/students \
  -H "Authorization: Bearer invalid_token"

# 测试过期令牌
curl -X GET http://localhost:3000/api/students \
  -H "Authorization: Bearer expired_token"
```

### 3. 权限边界测试
- 学生访问管理功能
- 教师访问系统配置
- 跨班级数据访问

## 📞 技术支持

如果遇到测试问题，请检查：

1. **错误日志**: 查看控制台输出和日志文件
2. **网络连接**: 确保localhost:3000可访问
3. **浏览器**: 建议使用Chrome或Firefox最新版本
4. **缓存清理**: 清除浏览器缓存和cookie

## 🎯 测试完成标志

当以下所有项目都通过时，说明系统测试完成：

✅ 自动化测试通过率 > 95%  
✅ 所有核心功能正常工作  
✅ 权限控制验证通过  
✅ 安全测试无重大问题  
✅ 性能指标符合要求  

**恭喜！您的学习平台已准备就绪！** 🎉