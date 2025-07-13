#!/bin/bash

# 学习平台本地开发环境启动脚本

echo "🚀 启动学习平台开发环境..."

# 检查Node.js版本
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js 14+ 版本"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 14 ]; then
    echo "❌ Node.js 版本过低，需要 14+ 版本，当前版本: $(node -v)"
    exit 1
fi

# 检查MongoDB连接
echo "🔍 检查MongoDB连接..."
if ! command -v mongosh &> /dev/null && ! command -v mongo &> /dev/null; then
    echo "⚠️  MongoDB客户端未安装，跳过数据库连接检查"
    echo "   请确保MongoDB正在运行在默认端口 27017"
else
    # 尝试连接MongoDB
    if command -v mongosh &> /dev/null; then
        if ! mongosh --eval "db.runCommand('ping')" &> /dev/null; then
            echo "❌ 无法连接到MongoDB，请确保MongoDB正在运行"
            echo "   默认连接: mongodb://localhost:27017"
            exit 1
        fi
    elif command -v mongo &> /dev/null; then
        if ! mongo --eval "db.runCommand('ping')" &> /dev/null; then
            echo "❌ 无法连接到MongoDB，请确保MongoDB正在运行"
            echo "   默认连接: mongodb://localhost:27017"
            exit 1
        fi
    fi
    echo "✅ MongoDB连接正常"
fi

# 检查依赖包
echo "📦 检查依赖包..."
if [ ! -d "node_modules" ]; then
    echo "🔄 安装依赖包..."
    npm install
fi

# 检查环境配置
echo "⚙️  检查环境配置..."
if [ ! -f ".env" ]; then
    echo "🔧 创建环境配置文件..."
    cat > .env << EOF
# 数据库配置
MONGODB_URI=mongodb://localhost:27017/learning_platform

# JWT配置
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=2h
JWT_REFRESH_EXPIRE=7d

# 服务器配置
PORT=3000
HOST=0.0.0.0
NODE_ENV=development

# 文件上传配置
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# 邮件配置（可选）
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-password
EOF
    echo "✅ 环境配置文件已创建"
else
    echo "✅ 环境配置文件已存在"
fi

# 创建上传目录
echo "📁 创建上传目录..."
mkdir -p uploads/avatars
mkdir -p uploads/assignments
mkdir -p uploads/resources
mkdir -p uploads/general
echo "✅ 上传目录已创建"

# 初始化数据库
echo "🗄️  初始化数据库..."
node scripts/initDb.js

# 启动服务器
echo "🌟 启动开发服务器..."
echo ""
echo "🔗 访问地址:"
echo "   Web界面: http://localhost:3000"
echo "   API文档: http://localhost:3000/api"
echo ""
echo "🔑 默认登录信息:"
echo "   管理员: admin@school.edu / admin123"
echo "   校长: principal@school.edu / admin123" 
echo "   教师: wang@school.edu / admin123"
echo "   学生: 20230001 / 20230001"
echo ""
echo "💡 提示:"
echo "   - 按 Ctrl+C 停止服务器"
echo "   - 修改代码后服务器会自动重启"
echo "   - 查看日志以获取详细信息"
echo ""

# 检查是否有nodemon
if command -v nodemon &> /dev/null; then
    echo "🔄 使用nodemon启动（自动重启）..."
    nodemon server.js
else
    echo "🔄 使用node启动..."
    node server.js
fi