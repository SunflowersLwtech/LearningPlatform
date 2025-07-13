#!/usr/bin/env node

/**
 * 数据库迁移脚本：更新Discussion模型结构
 * 为现有的讨论回复添加attachments字段
 */

const mongoose = require('mongoose');
require('dotenv').config();

// 连接数据库
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB连接成功');
  } catch (error) {
    console.error('❌ MongoDB连接失败:', error);
    process.exit(1);
  }
}

// 迁移Discussion集合
async function migrateDiscussions() {
  console.log('\n🔄 开始迁移Discussion集合...');
  
  try {
    const db = mongoose.connection.db;
    const collection = db.collection('discussions');
    
    // 查找所有讨论
    const discussions = await collection.find({}).toArray();
    console.log(`📊 找到 ${discussions.length} 个讨论记录`);
    
    let updatedCount = 0;
    
    for (const discussion of discussions) {
      let needsUpdate = false;
      const updates = {};
      
      // 检查posts中的replies是否需要添加attachments字段
      if (discussion.posts && discussion.posts.length > 0) {
        const updatedPosts = discussion.posts.map(post => {
          if (post.replies && post.replies.length > 0) {
            const updatedReplies = post.replies.map(reply => {
              if (!reply.hasOwnProperty('attachments')) {
                needsUpdate = true;
                return {
                  ...reply,
                  attachments: []
                };
              }
              return reply;
            });
            return {
              ...post,
              replies: updatedReplies
            };
          }
          return post;
        });
        
        if (needsUpdate) {
          updates.posts = updatedPosts;
        }
      }
      
      // 如果需要更新，执行更新操作
      if (needsUpdate) {
        await collection.updateOne(
          { _id: discussion._id },
          { $set: updates }
        );
        updatedCount++;
        console.log(`✅ 更新讨论: ${discussion.title || discussion._id}`);
      }
    }
    
    console.log(`\n📈 迁移完成！更新了 ${updatedCount} 个讨论记录`);
    
  } catch (error) {
    console.error('❌ 迁移失败:', error);
    throw error;
  }
}

// 验证迁移结果
async function verifyMigration() {
  console.log('\n🔍 验证迁移结果...');
  
  try {
    const db = mongoose.connection.db;
    const collection = db.collection('discussions');
    
    // 查找有回复的讨论
    const discussionsWithReplies = await collection.find({
      'posts.replies': { $exists: true, $ne: [] }
    }).toArray();
    
    let validCount = 0;
    let invalidCount = 0;
    
    for (const discussion of discussionsWithReplies) {
      for (const post of discussion.posts) {
        if (post.replies && post.replies.length > 0) {
          for (const reply of post.replies) {
            if (reply.hasOwnProperty('attachments')) {
              validCount++;
            } else {
              invalidCount++;
              console.log(`⚠️ 发现未迁移的回复: 讨论 ${discussion.title}, 回复 ${reply._id}`);
            }
          }
        }
      }
    }
    
    console.log(`\n📊 验证结果:`);
    console.log(`   ✅ 已迁移的回复: ${validCount}`);
    console.log(`   ❌ 未迁移的回复: ${invalidCount}`);
    
    if (invalidCount === 0) {
      console.log('🎉 所有数据迁移成功！');
    } else {
      console.log('⚠️ 部分数据迁移失败，需要手动检查');
    }
    
  } catch (error) {
    console.error('❌ 验证失败:', error);
  }
}

// 清理测试数据（可选）
async function cleanupTestData() {
  console.log('\n🧹 清理测试数据...');
  
  try {
    const db = mongoose.connection.db;
    const collection = db.collection('discussions');
    
    // 删除标题包含"测试"的讨论
    const result = await collection.deleteMany({
      title: { $regex: /测试/, $options: 'i' }
    });
    
    console.log(`🗑️ 删除了 ${result.deletedCount} 个测试讨论`);
    
  } catch (error) {
    console.error('❌ 清理失败:', error);
  }
}

// 主函数
async function main() {
  console.log('🚀 Discussion模型迁移脚本');
  console.log('='.repeat(50));
  
  await connectDB();
  
  try {
    // 执行迁移
    await migrateDiscussions();
    
    // 验证迁移结果
    await verifyMigration();
    
    // 询问是否清理测试数据
    console.log('\n❓ 是否需要清理测试数据？');
    console.log('   如果需要，请手动运行: node scripts/migrate-discussion-schema.js --cleanup');
    
    // 检查命令行参数
    if (process.argv.includes('--cleanup')) {
      await cleanupTestData();
    }
    
    console.log('\n✅ 迁移脚本执行完成！');
    
  } catch (error) {
    console.error('\n❌ 迁移过程中发生错误:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('📴 数据库连接已关闭');
  }
}

// 运行脚本
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  migrateDiscussions,
  verifyMigration,
  cleanupTestData
};
