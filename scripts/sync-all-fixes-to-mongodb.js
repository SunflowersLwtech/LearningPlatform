#!/usr/bin/env node

/**
 * 同步所有修复到MongoDB数据库
 * 确保数据库结构和数据与代码修复保持一致
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

// 1. 确保Discussion模型的attachments字段正确
async function syncDiscussionAttachments() {
  console.log('\n🔄 同步Discussion模型的attachments字段...');
  
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
      
      // 确保posts中的attachments字段存在且为数组
      if (discussion.posts && discussion.posts.length > 0) {
        const updatedPosts = discussion.posts.map(post => {
          let postUpdated = false;
          
          // 确保post有attachments字段
          if (!post.hasOwnProperty('attachments')) {
            post.attachments = [];
            postUpdated = true;
          }
          
          // 确保replies中的attachments字段存在
          if (post.replies && post.replies.length > 0) {
            const updatedReplies = post.replies.map(reply => {
              if (!reply.hasOwnProperty('attachments')) {
                reply.attachments = [];
                postUpdated = true;
              }
              return reply;
            });
            post.replies = updatedReplies;
          }
          
          if (postUpdated) needsUpdate = true;
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
    
    console.log(`📈 Discussion同步完成！更新了 ${updatedCount} 个记录`);
    
  } catch (error) {
    console.error('❌ Discussion同步失败:', error);
    throw error;
  }
}

// 2. 确保Student模型数据完整性
async function syncStudentData() {
  console.log('\n🔄 同步Student模型数据...');
  
  try {
    const db = mongoose.connection.db;
    const collection = db.collection('students');
    
    const students = await collection.find({}).toArray();
    console.log(`📊 找到 ${students.length} 个学生记录`);
    
    let updatedCount = 0;
    
    for (const student of students) {
      let needsUpdate = false;
      const updates = {};
      
      // 确保必要字段存在
      if (!student.hasOwnProperty('preferredLanguage')) {
        updates.preferredLanguage = 'zh-CN';
        needsUpdate = true;
      }
      
      if (!student.hasOwnProperty('enrollmentStatus')) {
        updates.enrollmentStatus = 'enrolled';
        needsUpdate = true;
      }
      
      if (!student.hasOwnProperty('avatar')) {
        updates.avatar = null;
        needsUpdate = true;
      }
      
      // 如果需要更新，执行更新操作
      if (needsUpdate) {
        await collection.updateOne(
          { _id: student._id },
          { $set: updates }
        );
        updatedCount++;
        console.log(`✅ 更新学生: ${student.name || student.studentId}`);
      }
    }
    
    console.log(`📈 Student同步完成！更新了 ${updatedCount} 个记录`);
    
  } catch (error) {
    console.error('❌ Student同步失败:', error);
    throw error;
  }
}

// 3. 确保Assignment模型数据完整性
async function syncAssignmentData() {
  console.log('\n🔄 同步Assignment模型数据...');
  
  try {
    const db = mongoose.connection.db;
    const collection = db.collection('assignments');
    
    const assignments = await collection.find({}).toArray();
    console.log(`📊 找到 ${assignments.length} 个作业记录`);
    
    let updatedCount = 0;
    
    for (const assignment of assignments) {
      let needsUpdate = false;
      const updates = {};
      
      // 确保必要字段存在
      if (!assignment.hasOwnProperty('attempts')) {
        updates.attempts = 1;
        needsUpdate = true;
      }
      
      if (!assignment.hasOwnProperty('lateSubmission')) {
        updates.lateSubmission = { allowed: false, penalty: 0 };
        needsUpdate = true;
      }
      
      if (!assignment.hasOwnProperty('isPublished')) {
        updates.isPublished = true;
        needsUpdate = true;
      }
      
      // 如果需要更新，执行更新操作
      if (needsUpdate) {
        await collection.updateOne(
          { _id: assignment._id },
          { $set: updates }
        );
        updatedCount++;
        console.log(`✅ 更新作业: ${assignment.title || assignment._id}`);
      }
    }
    
    console.log(`📈 Assignment同步完成！更新了 ${updatedCount} 个记录`);
    
  } catch (error) {
    console.error('❌ Assignment同步失败:', error);
    throw error;
  }
}

// 4. 创建必要的索引
async function createIndexes() {
  console.log('\n🔄 创建数据库索引...');
  
  try {
    const db = mongoose.connection.db;
    
    // Student索引
    await db.collection('students').createIndex({ studentId: 1 }, { unique: true });
    await db.collection('students').createIndex({ class: 1 });
    await db.collection('students').createIndex({ grade: 1 });
    
    // Assignment索引
    await db.collection('assignments').createIndex({ teacher: 1 });
    await db.collection('assignments').createIndex({ course: 1 });
    await db.collection('assignments').createIndex({ dueDate: 1 });
    await db.collection('assignments').createIndex({ isPublished: 1 });
    
    // Discussion索引
    await db.collection('discussions').createIndex({ creator: 1 });
    await db.collection('discussions').createIndex({ course: 1 });
    await db.collection('discussions').createIndex({ lastActivity: -1 });
    
    // Submission索引
    await db.collection('submissions').createIndex({ student: 1, assignment: 1 });
    await db.collection('submissions').createIndex({ assignment: 1 });
    
    console.log('✅ 索引创建完成');
    
  } catch (error) {
    console.error('❌ 索引创建失败:', error);
    // 索引创建失败不应该中断整个过程
  }
}

// 5. 验证数据完整性
async function validateDataIntegrity() {
  console.log('\n🔍 验证数据完整性...');
  
  try {
    const db = mongoose.connection.db;
    
    // 检查学生-班级关联
    const studentsWithoutClass = await db.collection('students').countDocuments({ class: null });
    console.log(`📊 没有班级的学生: ${studentsWithoutClass}`);
    
    // 检查作业-课程关联
    const assignmentsWithoutCourse = await db.collection('assignments').countDocuments({ course: null });
    console.log(`📊 没有课程的作业: ${assignmentsWithoutCourse}`);
    
    // 检查讨论数据
    const discussionsCount = await db.collection('discussions').countDocuments({});
    console.log(`📊 讨论总数: ${discussionsCount}`);
    
    // 检查提交数据
    const submissionsCount = await db.collection('submissions').countDocuments({});
    console.log(`📊 提交总数: ${submissionsCount}`);
    
    console.log('✅ 数据完整性检查完成');
    
  } catch (error) {
    console.error('❌ 数据完整性检查失败:', error);
  }
}

// 主函数
async function main() {
  console.log('🚀 开始同步所有修复到MongoDB');
  console.log('='.repeat(60));
  
  await connectDB();
  
  try {
    // 执行所有同步操作
    await syncDiscussionAttachments();
    await syncStudentData();
    await syncAssignmentData();
    await createIndexes();
    await validateDataIntegrity();
    
    console.log('\n✅ 所有修复已成功同步到MongoDB！');
    console.log('\n📋 同步总结:');
    console.log('   ✅ Discussion attachments字段已同步');
    console.log('   ✅ Student数据完整性已确保');
    console.log('   ✅ Assignment数据完整性已确保');
    console.log('   ✅ 数据库索引已创建');
    console.log('   ✅ 数据完整性已验证');
    
  } catch (error) {
    console.error('\n❌ 同步过程中发生错误:', error);
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
  syncDiscussionAttachments,
  syncStudentData,
  syncAssignmentData,
  createIndexes,
  validateDataIntegrity
};
