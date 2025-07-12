const dotenv = require('dotenv');
const connectDB = require('./config/database');
const Discussion = require('./src/models/Discussion');
const Resource = require('./src/models/Resource');

dotenv.config();

const testData = async () => {
  try {
    await connectDB();
    
    // 检查讨论数据
    const discussionCount = await Discussion.countDocuments();
    console.log('讨论数量:', discussionCount);
    
    if (discussionCount === 0) {
      console.log('创建测试讨论...');
      const testDiscussion = new Discussion({
        title: '测试讨论',
        content: '这是一个测试讨论的内容，用于验证讨论功能是否正常工作。',
        type: 'general',
        creator: '675fbbdc94074c1bc6b0a2a7', // 使用种子数据中的用户ID
        creatorModel: 'Staff',
        isActive: true,
        isLocked: false,
        lastActivity: new Date()
      });
      await testDiscussion.save();
      console.log('测试讨论创建完成');
    }
    
    // 检查资源数据
    const resourceCount = await Resource.countDocuments();
    console.log('资源数量:', resourceCount);
    
    if (resourceCount === 0) {
      console.log('创建测试资源...');
      const testResource = new Resource({
        title: '测试资源',
        description: '这是一个测试资源，用于验证资源上传和下载功能。',
        subject: '数学',
        grade: '高一',
        type: 'document',
        accessLevel: 'public',
        uploadedBy: '675fbbdc94074c1bc6b0a2a7',
        uploaderModel: 'Staff',
        isActive: true,
        downloads: 0,
        views: 0
      });
      await testResource.save();
      console.log('测试资源创建完成');
    }
    
    console.log('测试数据检查完成');
    process.exit(0);
  } catch (error) {
    console.error('测试失败:', error);
    process.exit(1);
  }
};

testData();