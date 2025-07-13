#!/usr/bin/env node

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
    console.log(`📊 准备导入 ${Object.keys(exportData.collections).length} 个集合`);
    
    const db = mongoose.connection.db;
    
    // 导入每个集合
    for (const [collectionName, documents] of Object.entries(exportData.collections)) {
      if (documents.length === 0) {
        console.log(`⏭️ 跳过空集合: ${collectionName}`);
        continue;
      }
      
      console.log(`🔄 导入集合: ${collectionName} (${documents.length} 条记录)`);
      
      try {
        // 清空现有数据
        await db.collection(collectionName).deleteMany({});
        
        // 插入新数据
        await db.collection(collectionName).insertMany(documents);
        console.log(`   ✅ ${collectionName}: 导入成功`);
      } catch (error) {
        console.log(`   ❌ ${collectionName}: 导入失败 - ${error.message}`);
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
