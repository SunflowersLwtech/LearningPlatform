#!/usr/bin/env node

/**
 * 准备部署脚本 - 数据库迁移和配置
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function prepareForDeployment() {
  console.log('🚀 准备部署 - 数据库迁移和配置');
  console.log('='.repeat(60));
  
  // 1. 检查当前配置
  console.log('\n📋 当前配置检查:');
  
  const envPath = '.env';
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    console.log('✅ .env文件存在');
    
    if (envContent.includes('localhost')) {
      console.log('⚠️ 当前使用本地数据库配置');
    } else {
      console.log('✅ 已配置远程数据库');
    }
  } else {
    console.log('❌ .env文件不存在');
  }
  
  // 2. 创建数据备份
  console.log('\n💾 创建数据备份:');
  
  try {
    // 创建备份目录
    const backupDir = './database-backup';
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    console.log('📁 备份目录已创建');
    
    // 导出数据库
    console.log('🔄 正在导出数据库...');
    const mongoUri = 'mongodb://admin:liuwei20060607@localhost:27017/learning_platform?authSource=admin';
    
    try {
      execSync(`mongodump --uri="${mongoUri}" --out="${backupDir}"`, { stdio: 'inherit' });
      console.log('✅ 数据库备份完成');
    } catch (error) {
      console.log('⚠️ 数据库备份失败，可能需要手动备份');
      console.log('   备份命令: mongodump --uri="mongodb://admin:liuwei20060607@localhost:27017/learning_platform?authSource=admin" --out=./database-backup');
    }
    
  } catch (error) {
    console.log('⚠️ 备份过程中出现问题:', error.message);
  }
  
  // 3. 创建云数据库配置模板
  console.log('\n☁️ 创建云数据库配置模板:');
  
  const cloudEnvTemplate = `# 生产环境配置模板
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# MongoDB Atlas 配置示例
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/learning_platform?retryWrites=true&w=majority

# 阿里云MongoDB配置示例  
# MONGODB_URI=mongodb://<username>:<password>@dds-xxxxx.mongodb.rds.aliyuncs.com:3717,dds-xxxxx.mongodb.rds.aliyuncs.com:3717/learning_platform?replicaSet=mgset-xxxxx

# 腾讯云MongoDB配置示例
# MONGODB_URI=mongodb://<username>:<password>@10.x.x.x:27017/learning_platform

# JWT和Session密钥 (生产环境请更换)
JWT_SECRET=oqGVqDWpktW3kIWCzkA0XCz22X1SKaey
SESSION_SECRET=h6td3dejHC2QWVbQREHGlrpsFySN83We

# 文件上传配置
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# 邮件配置 (可选)
# EMAIL_HOST=smtp.gmail.com
# EMAIL_PORT=587
# EMAIL_USER=your-email@gmail.com
# EMAIL_PASS=your-app-password
`;
  
  fs.writeFileSync('.env.production', cloudEnvTemplate);
  console.log('✅ 生产环境配置模板已创建: .env.production');
  
  // 4. 创建部署脚本
  console.log('\n📜 创建部署脚本:');
  
  const deployScript = `#!/bin/bash

# 学习平台部署脚本

echo "🚀 开始部署学习平台..."

# 1. 安装依赖
echo "📦 安装依赖..."
npm install --production

# 2. 创建必要目录
echo "📁 创建目录..."
mkdir -p uploads/avatars
mkdir -p uploads/general
mkdir -p uploads/resources
mkdir -p logs

# 3. 设置权限
echo "🔐 设置权限..."
chmod 755 uploads
chmod 755 uploads/avatars
chmod 755 uploads/general
chmod 755 uploads/resources

# 4. 复制生产环境配置
if [ -f ".env.production" ]; then
    echo "⚙️ 使用生产环境配置..."
    cp .env.production .env
else
    echo "⚠️ 警告: 没有找到生产环境配置文件"
fi

# 5. 测试数据库连接
echo "🗄️ 测试数据库连接..."
node -e "
const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ 数据库连接成功');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ 数据库连接失败:', err.message);
    process.exit(1);
  });
"

if [ $? -eq 0 ]; then
    echo "✅ 数据库连接测试通过"
else
    echo "❌ 数据库连接测试失败，请检查配置"
    exit 1
fi

# 6. 启动应用
echo "🎯 启动应用..."
if command -v pm2 &> /dev/null; then
    echo "使用PM2启动..."
    pm2 start server.js --name "learning-platform"
    pm2 save
else
    echo "使用Node.js直接启动..."
    node server.js
fi

echo "🎉 部署完成！"
`;
  
  fs.writeFileSync('deploy.sh', deployScript);
  execSync('chmod +x deploy.sh');
  console.log('✅ 部署脚本已创建: deploy.sh');
  
  // 5. 创建Docker配置
  console.log('\n🐳 创建Docker配置:');
  
  const dockerfile = `FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm install --production

# 复制应用代码
COPY . .

# 创建上传目录
RUN mkdir -p uploads/avatars uploads/general uploads/resources

# 设置权限
RUN chmod 755 uploads uploads/avatars uploads/general uploads/resources

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["node", "server.js"]
`;
  
  fs.writeFileSync('Dockerfile', dockerfile);
  console.log('✅ Dockerfile已创建');
  
  const dockerCompose = `version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    volumes:
      - ./uploads:/app/uploads
    restart: unless-stopped
    depends_on:
      - mongodb

  mongodb:
    image: mongo:6.0
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=liuwei20060607
      - MONGO_INITDB_DATABASE=learning_platform
    volumes:
      - mongodb_data:/data/db
      - ./database-backup:/backup
    restart: unless-stopped

volumes:
  mongodb_data:
`;
  
  fs.writeFileSync('docker-compose.yml', dockerCompose);
  console.log('✅ docker-compose.yml已创建');
  
  // 6. 创建数据导入脚本
  console.log('\n📥 创建数据导入脚本:');
  
  const importScript = `#!/bin/bash

# 数据导入脚本

echo "📥 开始导入数据到云数据库..."

# 检查备份文件
if [ ! -d "database-backup/learning_platform" ]; then
    echo "❌ 没有找到备份文件，请先运行数据备份"
    exit 1
fi

# 读取云数据库URI
if [ -z "$CLOUD_MONGODB_URI" ]; then
    echo "请设置云数据库URI环境变量:"
    echo "export CLOUD_MONGODB_URI='mongodb+srv://username:password@cluster.mongodb.net/learning_platform'"
    exit 1
fi

echo "🔄 正在导入数据..."
mongorestore --uri="$CLOUD_MONGODB_URI" --drop database-backup/learning_platform

if [ $? -eq 0 ]; then
    echo "✅ 数据导入成功"
else
    echo "❌ 数据导入失败"
    exit 1
fi

echo "🎉 数据迁移完成！"
`;
  
  fs.writeFileSync('import-data.sh', importScript);
  execSync('chmod +x import-data.sh');
  console.log('✅ 数据导入脚本已创建: import-data.sh');
  
  // 7. 创建部署指南
  console.log('\n📖 创建部署指南:');
  
  const deploymentGuide = `# 学习平台部署指南

## 📋 部署前准备

### 1. 数据库迁移

#### 选项A: MongoDB Atlas (推荐)
1. 访问 https://www.mongodb.com/atlas
2. 创建免费账户
3. 创建新集群
4. 获取连接字符串
5. 更新 .env.production 中的 MONGODB_URI

#### 选项B: 阿里云MongoDB
1. 登录阿里云控制台
2. 创建MongoDB实例
3. 配置白名单
4. 获取连接地址
5. 更新 .env.production 中的 MONGODB_URI

### 2. 数据导入
\`\`\`bash
# 设置云数据库URI
export CLOUD_MONGODB_URI='your-cloud-mongodb-uri'

# 导入数据
./import-data.sh
\`\`\`

## 🚀 部署方式

### 方式1: 传统服务器部署
\`\`\`bash
# 1. 上传代码到服务器
scp -r . user@server:/path/to/app

# 2. 连接服务器
ssh user@server

# 3. 进入应用目录
cd /path/to/app

# 4. 运行部署脚本
./deploy.sh
\`\`\`

### 方式2: Docker部署
\`\`\`bash
# 1. 构建镜像
docker build -t learning-platform .

# 2. 运行容器
docker run -d -p 3000:3000 --env-file .env learning-platform

# 或使用docker-compose
docker-compose up -d
\`\`\`

### 方式3: 云平台部署

#### Vercel部署
1. 安装Vercel CLI: \`npm i -g vercel\`
2. 登录: \`vercel login\`
3. 部署: \`vercel\`

#### Railway部署
1. 访问 https://railway.app
2. 连接GitHub仓库
3. 配置环境变量
4. 自动部署

#### Heroku部署
1. 安装Heroku CLI
2. 登录: \`heroku login\`
3. 创建应用: \`heroku create your-app-name\`
4. 配置环境变量: \`heroku config:set MONGODB_URI=your-uri\`
5. 部署: \`git push heroku main\`

## ⚙️ 环境变量配置

生产环境需要配置以下环境变量:
- \`MONGODB_URI\`: 云数据库连接字符串
- \`JWT_SECRET\`: JWT密钥
- \`SESSION_SECRET\`: Session密钥
- \`NODE_ENV\`: production

## 🔧 部署后检查

1. 访问应用URL
2. 测试登录功能
3. 检查数据库连接
4. 验证文件上传
5. 测试所有功能模块

## 📊 监控和维护

- 使用PM2进行进程管理
- 配置日志记录
- 设置健康检查
- 定期备份数据库

## 🆘 故障排除

常见问题和解决方案:
1. 数据库连接失败 - 检查URI和网络
2. 文件上传失败 - 检查目录权限
3. 登录问题 - 检查JWT配置
4. 静态资源404 - 检查静态文件配置
`;
  
  fs.writeFileSync('DEPLOYMENT.md', deploymentGuide);
  console.log('✅ 部署指南已创建: DEPLOYMENT.md');
  
  // 8. 总结
  console.log('\n🎯 部署准备完成！');
  console.log('\n📁 已创建的文件:');
  console.log('   ✅ database-backup/ - 数据库备份');
  console.log('   ✅ .env.production - 生产环境配置模板');
  console.log('   ✅ deploy.sh - 部署脚本');
  console.log('   ✅ import-data.sh - 数据导入脚本');
  console.log('   ✅ Dockerfile - Docker配置');
  console.log('   ✅ docker-compose.yml - Docker Compose配置');
  console.log('   ✅ DEPLOYMENT.md - 部署指南');
  
  console.log('\n📋 下一步操作:');
  console.log('   1. 选择云数据库服务 (MongoDB Atlas推荐)');
  console.log('   2. 创建云数据库实例');
  console.log('   3. 更新.env.production中的MONGODB_URI');
  console.log('   4. 运行数据导入脚本');
  console.log('   5. 选择部署平台并部署');
  
  console.log('\n💡 推荐部署平台:');
  console.log('   - Railway (简单易用)');
  console.log('   - Vercel (前端友好)');
  console.log('   - Heroku (经典选择)');
  console.log('   - 阿里云/腾讯云 (国内访问快)');
  
  console.log('\n🎉 系统已准备好部署到云端！');
}

// 运行准备脚本
prepareForDeployment();
