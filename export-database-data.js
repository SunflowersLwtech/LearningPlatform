#!/usr/bin/env node

/**
 * 导出数据库数据到JSON文件
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function exportDatabaseData() {
  console.log('📤 导出数据库数据到JSON文件');
  console.log('='.repeat(50));
  
  try {
    // 连接数据库
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ 数据库连接成功');
    
    const db = mongoose.connection.db;
    
    // 创建导出目录
    const exportDir = './database-export';
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }
    
    // 获取所有集合
    const collections = await db.listCollections().toArray();
    console.log(`📋 找到 ${collections.length} 个集合`);
    
    const exportData = {
      exportDate: new Date().toISOString(),
      database: db.databaseName,
      collections: {}
    };
    
    // 导出每个集合的数据
    for (const collection of collections) {
      const collectionName = collection.name;
      console.log(`🔄 导出集合: ${collectionName}`);
      
      try {
        const documents = await db.collection(collectionName).find({}).toArray();
        exportData.collections[collectionName] = documents;
        console.log(`   ✅ ${collectionName}: ${documents.length} 条记录`);
      } catch (error) {
        console.log(`   ❌ ${collectionName}: 导出失败 - ${error.message}`);
        exportData.collections[collectionName] = [];
      }
    }
    
    // 保存到JSON文件
    const exportFile = path.join(exportDir, 'learning_platform_data.json');
    fs.writeFileSync(exportFile, JSON.stringify(exportData, null, 2));
    console.log(`✅ 数据已导出到: ${exportFile}`);
    
    // 创建导入脚本
    const importScript = `#!/usr/bin/env node

/**
 * 导入数据到云数据库
 */

const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();

async function importData() {
  try {
    // 检查云数据库URI
    const cloudUri = process.env.CLOUD_MONGODB_URI || process.env.MONGODB_URI;
    if (!cloudUri) {
      console.error('❌ 请设置CLOUD_MONGODB_URI环境变量');
      process.exit(1);
    }
    
    console.log('📥 连接云数据库...');
    await mongoose.connect(cloudUri);
    console.log('✅ 云数据库连接成功');
    
    // 读取导出的数据
    const exportFile = './database-export/learning_platform_data.json';
    if (!fs.existsSync(exportFile)) {
      console.error('❌ 导出文件不存在:', exportFile);
      process.exit(1);
    }
    
    const exportData = JSON.parse(fs.readFileSync(exportFile, 'utf8'));
    console.log(\`📊 准备导入 \${Object.keys(exportData.collections).length} 个集合\`);
    
    const db = mongoose.connection.db;
    
    // 导入每个集合
    for (const [collectionName, documents] of Object.entries(exportData.collections)) {
      if (documents.length === 0) {
        console.log(\`⏭️ 跳过空集合: \${collectionName}\`);
        continue;
      }
      
      console.log(\`🔄 导入集合: \${collectionName} (\${documents.length} 条记录)\`);
      
      try {
        // 清空现有数据
        await db.collection(collectionName).deleteMany({});
        
        // 插入新数据
        await db.collection(collectionName).insertMany(documents);
        console.log(\`   ✅ \${collectionName}: 导入成功\`);
      } catch (error) {
        console.log(\`   ❌ \${collectionName}: 导入失败 - \${error.message}\`);
      }
    }
    
    console.log('🎉 数据导入完成！');
    
  } catch (error) {
    console.error('❌ 导入失败:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

importData();
`;
    
    const importScriptFile = path.join(exportDir, 'import-to-cloud.js');
    fs.writeFileSync(importScriptFile, importScript);
    console.log(`✅ 导入脚本已创建: ${importScriptFile}`);
    
    // 创建使用说明
    const readme = `# 数据库数据导出/导入

## 导出的文件
- \`learning_platform_data.json\`: 完整的数据库数据
- \`import-to-cloud.js\`: 云数据库导入脚本

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
\`\`\`bash
# 设置云数据库连接字符串
export CLOUD_MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/learning_platform"

# 或者直接在.env文件中设置
echo "CLOUD_MONGODB_URI=your-cloud-uri" >> .env

# 运行导入脚本
node database-export/import-to-cloud.js
\`\`\`

### 3. 更新应用配置
更新 \`.env\` 文件中的 \`MONGODB_URI\`:
\`\`\`
MONGODB_URI=your-cloud-mongodb-uri
\`\`\`

## 数据统计
导出时间: ${new Date().toLocaleString()}
数据库: ${db.databaseName}
集合数量: ${collections.length}
总记录数: ${Object.values(exportData.collections).reduce((sum, docs) => sum + docs.length, 0)}

## 集合详情
${Object.entries(exportData.collections).map(([name, docs]) => `- ${name}: ${docs.length} 条记录`).join('\n')}
`;
    
    const readmeFile = path.join(exportDir, 'README.md');
    fs.writeFileSync(readmeFile, readme);
    console.log(`✅ 使用说明已创建: ${readmeFile}`);
    
    // 统计信息
    const totalRecords = Object.values(exportData.collections).reduce((sum, docs) => sum + docs.length, 0);
    const fileSize = (fs.statSync(exportFile).size / 1024 / 1024).toFixed(2);
    
    console.log('\n📊 导出统计:');
    console.log(`   集合数量: ${collections.length}`);
    console.log(`   总记录数: ${totalRecords}`);
    console.log(`   文件大小: ${fileSize} MB`);
    
    console.log('\n🎯 下一步:');
    console.log('   1. 选择云数据库服务 (推荐MongoDB Atlas)');
    console.log('   2. 创建云数据库实例');
    console.log('   3. 设置CLOUD_MONGODB_URI环境变量');
    console.log('   4. 运行: node database-export/import-to-cloud.js');
    console.log('   5. 更新.env中的MONGODB_URI');
    
  } catch (error) {
    console.error('❌ 导出失败:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('📴 数据库连接已关闭');
  }
}

// 运行导出
exportDatabaseData().catch(console.error);
