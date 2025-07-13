# 数据库数据导出/导入

## 导出的文件
- `learning_platform_data.json`: 完整的数据库数据
- `import-to-cloud.js`: 云数据库导入脚本

## 使用方法

### 1. 设置云数据库
选择以下任一云数据库服务:

#### MongoDB Atlas (推荐)
1. 访问 https://www.mongodb.com/atlas
2. 创建免费账户 (512MB存储)
3. 创建新集群
4. 获取连接字符串

#### 阿里云MongoDB
1. 登录阿里云控制台
2. 创建MongoDB实例
3. 配置白名单 (0.0.0.0/0)
4. 获取连接地址

### 2. 导入数据到云数据库
```bash
# 设置云数据库连接字符串
export CLOUD_MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/learning_platform"

# 或者直接在.env文件中设置
echo "CLOUD_MONGODB_URI=your-cloud-uri" >> .env

# 运行导入脚本
node database-export/import-to-cloud.js
```

### 3. 更新应用配置
更新 `.env` 文件中的 `MONGODB_URI`:
```
MONGODB_URI=your-cloud-mongodb-uri
```

## 数据统计
导出时间: 7/13/2025, 2:51:12 PM
数据库: learning_platform
集合数量: 11
总记录数: 88

## 集合详情
- classes: 4 条记录
- discussions: 6 条记录
- staffs: 6 条记录
- analytics: 0 条记录
- attendances: 0 条记录
- assignments: 6 条记录
- courses: 3 条记录
- resources: 3 条记录
- submissions: 0 条记录
- grades: 0 条记录
- students: 60 条记录
