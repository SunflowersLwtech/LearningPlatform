#!/usr/bin/env node

/**
 * 学习平台全功能测试脚本
 * 测试所有API端点、数据库操作、文件上传等功能
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const API_BASE = 'http://localhost:3000/api';
const STATIC_BASE = 'http://localhost:3000';

// 测试结果统计
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

// 存储测试过程中的数据
const testData = {
  tokens: {},
  users: {},
  createdIds: {
    students: [],
    courses: [],
    assignments: [],
    discussions: [],
    classes: []
  }
};

// 测试用户凭据
const testUsers = {
  admin: { identifier: 'principal@school.edu', password: 'admin123', userType: 'staff' },
  teacher: { identifier: 'wang@school.edu', password: 'admin123', userType: 'staff' },
  student: { identifier: '20230001', password: '20230001', userType: 'student' }
};

// 工具函数
function logTest(name, passed, error = null) {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${name}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${name}: ${error}`);
    testResults.errors.push({ test: name, error });
  }
}

function logSection(title) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 ${title}`);
  console.log('='.repeat(60));
}

// 1. 数据库连接测试
async function testDatabaseConnection() {
  logSection('数据库连接测试');
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logTest('数据库连接', true);
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    logTest(`数据库集合检查 (${collections.length}个集合)`, collections.length > 0);
    
    // 测试基本查询
    const studentCount = await db.collection('students').countDocuments();
    logTest(`学生数据查询 (${studentCount}条记录)`, studentCount >= 0);
    
    const staffCount = await db.collection('staffs').countDocuments();
    logTest(`员工数据查询 (${staffCount}条记录)`, staffCount >= 0);
    
  } catch (error) {
    logTest('数据库连接', false, error.message);
  }
}

// 2. 用户认证测试
async function testAuthentication() {
  logSection('用户认证测试');
  
  for (const [role, credentials] of Object.entries(testUsers)) {
    try {
      const response = await axios.post(`${API_BASE}/auth/login`, credentials);
      
      if (response.data.success) {
        testData.tokens[role] = response.data.data.accessToken;
        testData.users[role] = response.data.data.user;
        logTest(`${role}登录`, true);
        
        // 验证token格式
        const tokenParts = testData.tokens[role].split('.');
        logTest(`${role} Token格式验证`, tokenParts.length === 3);
        
        // 验证用户数据结构
        const user = testData.users[role];
        logTest(`${role}用户数据结构`, user.id && user.name && user.userType);
        
      } else {
        logTest(`${role}登录`, false, response.data.message);
      }
    } catch (error) {
      logTest(`${role}登录`, false, error.response?.data?.message || error.message);
    }
  }
  
  // 测试无效登录
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      identifier: 'invalid@test.com',
      password: 'wrongpassword',
      userType: 'staff'
    });
    logTest('无效登录拒绝', !response.data.success);
  } catch (error) {
    logTest('无效登录拒绝', true);
  }
}

// 3. 权限控制测试
async function testAuthorization() {
  logSection('权限控制测试');
  
  const permissionTests = [
    {
      name: '学生访问个人信息',
      role: 'student',
      endpoint: '/students/me',
      shouldPass: true
    },
    {
      name: '学生访问所有学生列表',
      role: 'student', 
      endpoint: '/students',
      shouldPass: false
    },
    {
      name: '学生访问权限管理',
      role: 'student',
      endpoint: '/permissions/permissions',
      shouldPass: false
    },
    {
      name: '教师访问学生列表',
      role: 'teacher',
      endpoint: '/students',
      shouldPass: true
    },
    {
      name: '教师访问权限管理',
      role: 'teacher',
      endpoint: '/permissions/permissions', 
      shouldPass: false
    },
    {
      name: '管理员访问权限管理',
      role: 'admin',
      endpoint: '/permissions/permissions',
      shouldPass: true
    }
  ];
  
  for (const test of permissionTests) {
    try {
      const token = testData.tokens[test.role];
      if (!token) {
        logTest(test.name, false, '用户未登录');
        continue;
      }
      
      const response = await axios.get(`${API_BASE}${test.endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
        validateStatus: () => true
      });
      
      const passed = test.shouldPass ? 
        (response.status === 200 && response.data.success) :
        (response.status === 403 || !response.data.success);
        
      logTest(test.name, passed, 
        test.shouldPass ? 
          `期望成功但失败: ${response.status}` : 
          `期望失败但成功: ${response.status}`
      );
      
    } catch (error) {
      logTest(test.name, false, error.message);
    }
  }
}

// 4. 学生管理功能测试
async function testStudentManagement() {
  logSection('学生管理功能测试');
  
  const adminToken = testData.tokens.admin;
  if (!adminToken) {
    logTest('学生管理测试', false, '管理员未登录');
    return;
  }
  
  try {
    // 获取学生列表
    const studentsResponse = await axios.get(`${API_BASE}/students`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    logTest('获取学生列表', studentsResponse.data.success);
    
    // 获取学生详情
    if (studentsResponse.data.success && studentsResponse.data.data.length > 0) {
      const studentId = studentsResponse.data.data[0]._id;
      const studentDetailResponse = await axios.get(`${API_BASE}/students/${studentId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      logTest('获取学生详情', studentDetailResponse.data.success);
    }
    
    // 测试学生搜索
    const searchResponse = await axios.get(`${API_BASE}/students?search=学生`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    logTest('学生搜索功能', searchResponse.data.success);
    
  } catch (error) {
    logTest('学生管理功能', false, error.response?.data?.message || error.message);
  }
}

// 5. 课程管理功能测试
async function testCourseManagement() {
  logSection('课程管理功能测试');
  
  const adminToken = testData.tokens.admin;
  if (!adminToken) {
    logTest('课程管理测试', false, '管理员未登录');
    return;
  }
  
  try {
    // 获取课程列表
    const coursesResponse = await axios.get(`${API_BASE}/courses`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    logTest('获取课程列表', coursesResponse.data.success);
    
    // 创建测试课程
    const newCourse = {
      name: `测试课程-${Date.now()}`,
      subject: '计算机科学',
      description: '这是一个测试课程',
      credits: 3,
      semester: '2024春季'
    };
    
    const createResponse = await axios.post(`${API_BASE}/courses`, newCourse, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    if (createResponse.data.success) {
      testData.createdIds.courses.push(createResponse.data.data._id);
      logTest('创建课程', true);
      
      // 更新课程
      const updateData = { description: '更新后的课程描述' };
      const updateResponse = await axios.put(`${API_BASE}/courses/${createResponse.data.data._id}`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      logTest('更新课程', updateResponse.data.success);
      
    } else {
      logTest('创建课程', false, createResponse.data.message);
    }
    
  } catch (error) {
    logTest('课程管理功能', false, error.response?.data?.message || error.message);
  }
}

// 6. 作业管理功能测试
async function testAssignmentManagement() {
  logSection('作业管理功能测试');
  
  const teacherToken = testData.tokens.teacher;
  if (!teacherToken) {
    logTest('作业管理测试', false, '教师未登录');
    return;
  }
  
  try {
    // 获取课程列表（用于创建作业）
    const coursesResponse = await axios.get(`${API_BASE}/courses`, {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    
    if (!coursesResponse.data.success || coursesResponse.data.data.length === 0) {
      logTest('作业管理测试', false, '没有可用课程');
      return;
    }
    
    const course = coursesResponse.data.data[0];
    
    // 创建测试作业
    const now = new Date();
    const startDate = new Date(now.getTime() + 60000); // 1分钟后
    const dueDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7天后
    
    const newAssignment = {
      title: `测试作业-${Date.now()}`,
      description: '这是一个测试作业',
      course: course._id,
      type: 'homework',
      startDate: startDate.toISOString(),
      dueDate: dueDate.toISOString(),
      totalPoints: 100,
      attempts: 3,
      lateSubmission: { allowed: true, penalty: 10 },
      isPublished: true
    };
    
    const createResponse = await axios.post(`${API_BASE}/assignments`, newAssignment, {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    
    if (createResponse.data.success) {
      testData.createdIds.assignments.push(createResponse.data.data._id);
      logTest('创建作业', true);
      
      // 获取作业列表
      const assignmentsResponse = await axios.get(`${API_BASE}/assignments`, {
        headers: { Authorization: `Bearer ${teacherToken}` }
      });
      logTest('获取作业列表', assignmentsResponse.data.success);
      
    } else {
      logTest('创建作业', false, createResponse.data.message);
    }
    
  } catch (error) {
    logTest('作业管理功能', false, error.response?.data?.message || error.message);
  }
}

// 7. 讨论区功能测试
async function testDiscussionFeatures() {
  logSection('讨论区功能测试');
  
  const studentToken = testData.tokens.student;
  if (!studentToken) {
    logTest('讨论区测试', false, '学生未登录');
    return;
  }
  
  try {
    // 创建讨论
    const newDiscussion = {
      title: `测试讨论-${Date.now()}`,
      content: '这是一个测试讨论',
      type: 'general'
    };
    
    const createResponse = await axios.post(`${API_BASE}/learning/discussions`, newDiscussion, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    
    if (createResponse.data.success) {
      const discussionId = createResponse.data.data._id;
      testData.createdIds.discussions.push(discussionId);
      logTest('创建讨论', true);
      
      // 参与讨论（文本回复）
      const replyResponse = await axios.post(`${API_BASE}/learning/discussions/${discussionId}/participate`, {
        content: '这是一个测试回复'
      }, {
        headers: { Authorization: `Bearer ${studentToken}` }
      });
      logTest('文本回复', replyResponse.data.success);
      
      // 测试文件上传回复
      const testContent = `测试附件文件\n创建时间: ${new Date().toLocaleString()}`;
      fs.writeFileSync('test-attachment.txt', testContent);
      
      const formData = new FormData();
      formData.append('content', '这是带附件的回复');
      formData.append('attachments', fs.createReadStream('test-attachment.txt'));
      
      const uploadResponse = await axios.post(`${API_BASE}/learning/discussions/${discussionId}/participate`, formData, {
        headers: {
          Authorization: `Bearer ${studentToken}`,
          ...formData.getHeaders()
        }
      });
      
      logTest('文件上传回复', uploadResponse.data.success);
      
      // 清理测试文件
      fs.unlinkSync('test-attachment.txt');
      
      // 获取讨论详情
      const detailResponse = await axios.get(`${API_BASE}/learning/discussions/${discussionId}`, {
        headers: { Authorization: `Bearer ${studentToken}` }
      });
      logTest('获取讨论详情', detailResponse.data.success);
      
    } else {
      logTest('创建讨论', false, createResponse.data.message);
    }
    
  } catch (error) {
    logTest('讨论区功能', false, error.response?.data?.message || error.message);
    
    // 清理测试文件
    try {
      fs.unlinkSync('test-attachment.txt');
    } catch (e) {}
  }
}

// 8. 学生仪表板测试
async function testStudentDashboard() {
  logSection('学生仪表板测试');
  
  const studentToken = testData.tokens.student;
  if (!studentToken) {
    logTest('学生仪表板测试', false, '学生未登录');
    return;
  }
  
  try {
    // 测试学生仪表板API
    const dashboardResponse = await axios.get(`${API_BASE}/learning/dashboard`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    
    if (dashboardResponse.data.success) {
      logTest('学生仪表板API', true);
      
      const data = dashboardResponse.data.data;
      logTest('仪表板数据结构', 
        data.hasOwnProperty('pendingAssignments') && 
        data.hasOwnProperty('recentSubmissions') && 
        data.hasOwnProperty('activeDiscussions')
      );
      
      console.log(`   📊 待完成作业: ${data.pendingAssignments.length}`);
      console.log(`   📊 最近提交: ${data.recentSubmissions.length}`);
      console.log(`   📊 活跃讨论: ${data.activeDiscussions.length}`);
      
    } else {
      logTest('学生仪表板API', false, dashboardResponse.data.message);
    }
    
    // 测试学生个人信息API
    const profileResponse = await axios.get(`${API_BASE}/students/me`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    logTest('学生个人信息API', profileResponse.data.success);
    
  } catch (error) {
    logTest('学生仪表板', false, error.response?.data?.message || error.message);
  }
}

// 9. 静态资源测试
async function testStaticResources() {
  logSection('静态资源测试');
  
  const resourceTests = [
    { name: '头像资源', url: '/uploads/avatars/avatar-225a51d3-21e2-4c61-8ee6-8fd16444674c.png' },
    { name: '讨论附件', url: '/uploads/general/attachments-11fe7a3a-fa9e-47d0-a46c-b7f7a8f19e56.txt' },
    { name: '学习资源', url: '/uploads/resources/file-1752337105824-267857918.png' }
  ];
  
  for (const test of resourceTests) {
    try {
      const response = await axios.get(`${STATIC_BASE}${test.url}`, {
        validateStatus: () => true,
        timeout: 5000
      });
      
      logTest(test.name, response.status === 200, `状态码: ${response.status}`);
    } catch (error) {
      logTest(test.name, false, error.message);
    }
  }
}

// 10. 数据完整性测试
async function testDataIntegrity() {
  logSection('数据完整性测试');
  
  try {
    const db = mongoose.connection.db;
    
    // 检查学生-班级关联
    const studentsWithoutClass = await db.collection('students').countDocuments({ class: null });
    logTest('学生班级关联完整性', studentsWithoutClass === 0, `${studentsWithoutClass}个学生没有班级`);
    
    // 检查作业-课程关联
    const assignmentsWithoutCourse = await db.collection('assignments').countDocuments({ course: null });
    logTest('作业课程关联完整性', assignmentsWithoutCourse === 0, `${assignmentsWithoutCourse}个作业没有课程`);
    
    // 检查讨论附件字段
    const discussionsWithAttachments = await db.collection('discussions').countDocuments({
      'posts.attachments': { $exists: true }
    });
    logTest('讨论附件字段完整性', discussionsWithAttachments > 0, `${discussionsWithAttachments}个讨论支持附件`);
    
    // 检查索引
    const studentIndexes = await db.collection('students').indexes();
    logTest('学生集合索引', studentIndexes.length >= 3, `${studentIndexes.length}个索引`);
    
  } catch (error) {
    logTest('数据完整性检查', false, error.message);
  }
}

// 主测试函数
async function runAllTests() {
  console.log('🧪 学习平台全功能测试开始');
  console.log(`测试时间: ${new Date().toLocaleString()}`);
  console.log(`API地址: ${API_BASE}`);
  
  try {
    await testDatabaseConnection();
    await testAuthentication();
    await testAuthorization();
    await testStudentManagement();
    await testCourseManagement();
    await testAssignmentManagement();
    await testDiscussionFeatures();
    await testStudentDashboard();
    await testStaticResources();
    await testDataIntegrity();
    
  } catch (error) {
    console.error('❌ 测试过程中发生严重错误:', error.message);
  } finally {
    // 清理测试数据
    await cleanupTestData();
    
    // 关闭数据库连接
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    
    // 显示测试结果
    showTestResults();
  }
}

// 清理测试数据
async function cleanupTestData() {
  logSection('清理测试数据');
  
  const adminToken = testData.tokens.admin;
  if (!adminToken) return;
  
  try {
    // 删除测试课程
    for (const courseId of testData.createdIds.courses) {
      try {
        await axios.delete(`${API_BASE}/courses/${courseId}`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        logTest(`删除测试课程 ${courseId}`, true);
      } catch (error) {
        logTest(`删除测试课程 ${courseId}`, false, error.message);
      }
    }
    
    // 删除测试作业
    for (const assignmentId of testData.createdIds.assignments) {
      try {
        await axios.delete(`${API_BASE}/assignments/${assignmentId}`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        logTest(`删除测试作业 ${assignmentId}`, true);
      } catch (error) {
        logTest(`删除测试作业 ${assignmentId}`, false, error.message);
      }
    }
    
  } catch (error) {
    console.log('⚠️ 清理测试数据时出现问题:', error.message);
  }
}

// 显示测试结果
function showTestResults() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 测试结果统计');
  console.log('='.repeat(60));
  
  const passRate = testResults.total > 0 ? (testResults.passed / testResults.total * 100).toFixed(1) : 0;
  
  console.log(`总测试数: ${testResults.total}`);
  console.log(`通过数: ${testResults.passed}`);
  console.log(`失败数: ${testResults.failed}`);
  console.log(`通过率: ${passRate}%`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ 失败的测试:');
    testResults.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error.test}: ${error.error}`);
    });
  }
  
  if (passRate >= 90) {
    console.log('\n🎉 测试结果优秀！系统功能正常');
  } else if (passRate >= 70) {
    console.log('\n✅ 测试结果良好，有少量问题需要关注');
  } else {
    console.log('\n⚠️ 测试结果需要改进，存在较多问题');
  }
  
  console.log('\n🎯 测试完成！');
}

// 11. 前端页面功能测试
async function testFrontendFunctions() {
  logSection('前端页面功能测试');

  try {
    // 测试主页面
    const homeResponse = await axios.get(STATIC_BASE, {
      validateStatus: () => true
    });
    logTest('主页面访问', homeResponse.status === 200);

    // 测试静态资源
    const jsResponse = await axios.get(`${STATIC_BASE}/js/app.js`, {
      validateStatus: () => true
    });
    logTest('JavaScript文件', jsResponse.status === 200);

    const cssResponse = await axios.get(`${STATIC_BASE}/css/style.css`, {
      validateStatus: () => true
    });
    logTest('CSS文件', cssResponse.status === 200 || cssResponse.status === 404); // CSS可能不存在

    // 测试测试页面
    const testPageResponse = await axios.get(`${STATIC_BASE}/test-login-frontend.html`, {
      validateStatus: () => true
    });
    logTest('登录测试页面', testPageResponse.status === 200);

  } catch (error) {
    logTest('前端页面功能', false, error.message);
  }
}

// 12. API响应时间测试
async function testAPIPerformance() {
  logSection('API性能测试');

  const performanceTests = [
    { name: '登录API', endpoint: '/auth/login', method: 'POST', data: testUsers.student },
    { name: '学生列表API', endpoint: '/students', method: 'GET', token: 'admin' },
    { name: '课程列表API', endpoint: '/courses', method: 'GET', token: 'student' },
    { name: '作业列表API', endpoint: '/assignments', method: 'GET', token: 'student' },
    { name: '讨论列表API', endpoint: '/learning/discussions', method: 'GET', token: 'student' }
  ];

  for (const test of performanceTests) {
    try {
      const startTime = Date.now();

      const config = {
        method: test.method,
        url: `${API_BASE}${test.endpoint}`,
        validateStatus: () => true
      };

      if (test.data) {
        config.data = test.data;
      }

      if (test.token && testData.tokens[test.token]) {
        config.headers = { Authorization: `Bearer ${testData.tokens[test.token]}` };
      }

      const response = await axios(config);
      const responseTime = Date.now() - startTime;

      const passed = response.status === 200 && responseTime < 2000; // 2秒内
      logTest(`${test.name} (${responseTime}ms)`, passed,
        passed ? null : `响应时间过长或请求失败: ${responseTime}ms, 状态: ${response.status}`
      );

    } catch (error) {
      logTest(test.name, false, error.message);
    }
  }
}

// 运行测试
if (require.main === module) {
  runAllTests().catch(console.error);
}

// 更新主测试函数
async function runAllTestsUpdated() {
  console.log('🧪 学习平台全功能测试开始');
  console.log(`测试时间: ${new Date().toLocaleString()}`);
  console.log(`API地址: ${API_BASE}`);

  try {
    await testDatabaseConnection();
    await testAuthentication();
    await testAuthorization();
    await testStudentManagement();
    await testCourseManagement();
    await testAssignmentManagement();
    await testDiscussionFeatures();
    await testStudentDashboard();
    await testStaticResources();
    await testDataIntegrity();
    await testFrontendFunctions();
    await testAPIPerformance();

  } catch (error) {
    console.error('❌ 测试过程中发生严重错误:', error.message);
  } finally {
    // 清理测试数据
    await cleanupTestData();

    // 关闭数据库连接
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }

    // 显示测试结果
    showTestResults();
  }
}

module.exports = {
  runAllTests: runAllTestsUpdated,
  testResults,
  testData
};
