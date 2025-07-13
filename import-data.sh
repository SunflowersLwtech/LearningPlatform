#!/bin/bash

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
