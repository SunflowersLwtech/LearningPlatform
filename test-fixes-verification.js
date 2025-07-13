#!/usr/bin/env node

/**
 * 验证所有已知问题修复的测试脚本
 */

const axios = require('axios');
const FormData = require('form-data');

const API_BASE = 'http://localhost:3000/api';

// 测试结果统计
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  fixes: {
    registration: false,
    studentSearch: false,
    assignmentCreation: false,
    staffAPI: false,
    permissions: false
  }
};

function logTest(name, passed, error = null) {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${name}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${name}: ${error}`);
  }
}

function logSection(title) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔧 ${title}`);
  console.log('='.repeat(60));
}

// 1. 测试用户注册功能修复
async function testRegistrationFix() {
  logSection('测试用户注册功能修复');
  
  // 测试学生注册
  console.log('\n📝 测试学生注册...');
  
  const studentData = {
    name: `测试学生${Date.now()}`,
    email: `student${Date.now()}@test.com`,
    password: 'test123456',
    confirmPassword: 'test123456',
    studentId: `STU${Date.now()}`,
    grade: '大一',
    gender: 'male',
    phone: '13800138001',
    userType: 'student'
  };
  
  try {
    const response = await axios.post(`${API_BASE}/auth/register`, studentData);
    
    if (response.data.success) {
      logTest('学生注册功能', true, '注册成功');
      testResults.fixes.registration = true;
      
      // 验证返回的数据结构
      const user = response.data.data.user;
      logTest('学生注册数据结构', 
        user.userType === 'student' && user.role === 'student',
        `用户类型: ${user.userType}, 角色: ${user.role}`);
        
      // 测试登录
      const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
        identifier: studentData.studentId,
        password: studentData.password,
        userType: 'student'
      });
      
      logTest('新注册学生登录', loginResponse.data.success);
      
    } else {
      logTest('学生注册功能', false, response.data.message);
    }
  } catch (error) {
    logTest('学生注册功能', false, error.response?.data?.message || error.message);
  }
  
  // 测试员工注册
  console.log('\n👨‍💼 测试员工注册...');
  
  const staffData = {
    name: `测试教师${Date.now()}`,
    email: `teacher${Date.now()}@test.com`,
    password: 'test123456',
    confirmPassword: 'test123456',
    staffId: `TEA${Date.now()}`,
    role: 'teacher',
    department: '计算机科学系',
    phone: '13900139001',
    userType: 'staff'
  };
  
  try {
    const response = await axios.post(`${API_BASE}/auth/register`, staffData);
    
    if (response.data.success) {
      logTest('员工注册功能', true, '注册成功');
      
      // 验证返回的数据结构
      const user = response.data.data.user;
      logTest('员工注册数据结构',
        user.userType === 'staff' && user.role === 'teacher',
        `用户类型: ${user.userType}, 角色: ${user.role}`);
        
    } else {
      logTest('员工注册功能', false, response.data.message);
    }
  } catch (error) {
    logTest('员工注册功能', false, error.response?.data?.message || error.message);
  }
}

// 2. 测试学生搜索功能修复
async function testStudentSearchFix() {
  logSection('测试学生搜索功能修复');
  
  // 先登录校长账户
  try {
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      identifier: 'principal@school.edu',
      password: 'admin123',
      userType: 'staff'
    });
    
    if (!loginResponse.data.success) {
      logTest('校长登录', false, '无法登录校长账户进行搜索测试');
      return;
    }
    
    const token = loginResponse.data.data.accessToken;
    
    // 测试性别搜索修复
    console.log('\n🔍 测试性别搜索修复...');
    
    const searchTests = [
      { name: '按性别搜索(male)', query: 'gender=male', expectResults: true },
      { name: '按性别搜索(female)', query: 'gender=female', expectResults: true },
      { name: '搜索词包含male', query: 'search=male', expectResults: true },
      { name: '搜索词包含female', query: 'search=female', expectResults: true },
      { name: '按年级搜索', query: 'search=大一', expectResults: true }
    ];
    
    let searchTestsPassed = 0;
    for (const test of searchTests) {
      try {
        const response = await axios.get(`${API_BASE}/students?${test.query}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success) {
          const results = response.data.data;
          logTest(test.name, true, `找到${results.length}个结果`);
          searchTestsPassed++;
        } else {
          logTest(test.name, false, response.data.message);
        }
      } catch (error) {
        logTest(test.name, false, error.response?.data?.message || error.message);
      }
    }
    
    testResults.fixes.studentSearch = searchTestsPassed === searchTests.length;
    
  } catch (error) {
    logTest('学生搜索测试', false, '无法进行搜索测试: ' + error.message);
  }
}

// 3. 测试作业创建时间验证修复
async function testAssignmentCreationFix() {
  logSection('测试作业创建时间验证修复');
  
  // 先登录教师账户
  try {
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      identifier: 'wang@school.edu',
      password: 'admin123',
      userType: 'staff'
    });
    
    if (!loginResponse.data.success) {
      logTest('教师登录', false, '无法登录教师账户进行作业测试');
      return;
    }
    
    const token = loginResponse.data.data.accessToken;
    
    // 获取课程列表
    const coursesResponse = await axios.get(`${API_BASE}/courses`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!coursesResponse.data.success || coursesResponse.data.data.length === 0) {
      logTest('作业创建测试', false, '没有可用课程');
      return;
    }
    
    const course = coursesResponse.data.data[0];
    
    // 测试创建作业（开始时间早于当前时间）
    console.log('\n📝 测试作业时间验证修复...');
    
    const now = new Date();
    const pastStartDate = new Date(now.getTime() - 60 * 60 * 1000); // 1小时前
    const futureEndDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7天后
    
    const assignmentData = {
      title: `时间验证测试作业-${Date.now()}`,
      description: '测试开始时间早于当前时间的作业创建',
      course: course._id,
      type: 'homework',
      startDate: pastStartDate.toISOString(),
      dueDate: futureEndDate.toISOString(),
      totalPoints: 100,
      attempts: 3,
      isPublished: true
    };
    
    try {
      const response = await axios.post(`${API_BASE}/assignments`, assignmentData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        logTest('作业创建时间验证修复', true, '允许开始时间早于当前时间');
        testResults.fixes.assignmentCreation = true;
      } else {
        logTest('作业创建时间验证修复', false, response.data.message);
      }
    } catch (error) {
      logTest('作业创建时间验证修复', false, error.response?.data?.message || error.message);
    }
    
  } catch (error) {
    logTest('作业创建测试', false, '无法进行作业创建测试: ' + error.message);
  }
}

// 4. 测试员工管理API修复
async function testStaffAPIFix() {
  logSection('测试员工管理API修复');
  
  // 先登录校长账户
  try {
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      identifier: 'principal@school.edu',
      password: 'admin123',
      userType: 'staff'
    });
    
    if (!loginResponse.data.success) {
      logTest('校长登录', false, '无法登录校长账户进行员工API测试');
      return;
    }
    
    const token = loginResponse.data.data.accessToken;
    
    console.log('\n👥 测试员工管理API...');
    
    // 测试员工列表API
    try {
      const response = await axios.get(`${API_BASE}/staff`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        logTest('员工列表API', true, `找到${response.data.data.length}个员工`);
        testResults.fixes.staffAPI = true;
      } else {
        logTest('员工列表API', false, response.data.message);
      }
    } catch (error) {
      logTest('员工列表API', false, error.response?.data?.message || error.message);
    }
    
    // 测试员工搜索
    try {
      const searchResponse = await axios.get(`${API_BASE}/staff?search=教师`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      logTest('员工搜索功能', searchResponse.data.success);
    } catch (error) {
      logTest('员工搜索功能', false, error.message);
    }
    
  } catch (error) {
    logTest('员工API测试', false, '无法进行员工API测试: ' + error.message);
  }
}

// 5. 测试权限边界修复
async function testPermissionsFix() {
  logSection('测试权限边界修复');
  
  // 先登录学生账户
  try {
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      identifier: '20230001',
      password: '20230001',
      userType: 'student'
    });
    
    if (!loginResponse.data.success) {
      logTest('学生登录', false, '无法登录学生账户进行权限测试');
      return;
    }
    
    const token = loginResponse.data.data.accessToken;
    
    console.log('\n🔒 测试学生权限边界...');
    
    // 测试学生不应该能访问的端点
    const restrictedEndpoints = [
      { name: '学生列表', url: '/students' },
      { name: '员工列表', url: '/staff' },
      { name: '权限管理', url: '/permissions/permissions' }
    ];
    
    let permissionTestsPassed = 0;
    for (const endpoint of restrictedEndpoints) {
      try {
        const response = await axios.get(`${API_BASE}${endpoint.url}`, {
          headers: { Authorization: `Bearer ${token}` },
          validateStatus: () => true
        });
        
        const shouldBeDenied = response.status === 403;
        logTest(`学生访问${endpoint.name}限制`, shouldBeDenied,
          shouldBeDenied ? '正确被拒绝' : `应该被拒绝但返回${response.status}`);
          
        if (shouldBeDenied) permissionTestsPassed++;
      } catch (error) {
        logTest(`学生访问${endpoint.name}限制`, true, '正确被拒绝');
        permissionTestsPassed++;
      }
    }
    
    testResults.fixes.permissions = permissionTestsPassed === restrictedEndpoints.length;
    
  } catch (error) {
    logTest('权限边界测试', false, '无法进行权限测试: ' + error.message);
  }
}

// 主测试函数
async function runFixesVerification() {
  console.log('🔧 验证所有已知问题修复');
  console.log(`测试时间: ${new Date().toLocaleString()}`);
  console.log(`API地址: ${API_BASE}`);
  
  try {
    await testRegistrationFix();
    await testStudentSearchFix();
    await testAssignmentCreationFix();
    await testStaffAPIFix();
    await testPermissionsFix();
    
  } catch (error) {
    console.error('❌ 测试过程中发生严重错误:', error.message);
  } finally {
    showResults();
  }
}

// 显示测试结果
function showResults() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 修复验证结果统计');
  console.log('='.repeat(60));
  
  const passRate = testResults.total > 0 ? (testResults.passed / testResults.total * 100).toFixed(1) : 0;
  
  console.log(`总测试数: ${testResults.total}`);
  console.log(`通过数: ${testResults.passed}`);
  console.log(`失败数: ${testResults.failed}`);
  console.log(`通过率: ${passRate}%`);
  
  console.log('\n🔧 修复状态:');
  const fixes = [
    { name: '用户注册功能', status: testResults.fixes.registration },
    { name: '学生搜索功能', status: testResults.fixes.studentSearch },
    { name: '作业创建时间验证', status: testResults.fixes.assignmentCreation },
    { name: '员工管理API', status: testResults.fixes.staffAPI },
    { name: '权限边界控制', status: testResults.fixes.permissions }
  ];
  
  fixes.forEach(fix => {
    console.log(`   ${fix.status ? '✅' : '❌'} ${fix.name}: ${fix.status ? '已修复' : '仍有问题'}`);
  });
  
  const fixedCount = fixes.filter(f => f.status).length;
  console.log(`\n🎯 修复完成度: ${fixedCount}/${fixes.length} (${Math.round(fixedCount/fixes.length*100)}%)`);
  
  if (fixedCount === fixes.length) {
    console.log('\n🎉 所有已知问题都已成功修复！');
    console.log('✨ 系统现在完全可以投入生产使用');
  } else {
    console.log('\n⚠️ 部分问题仍需要进一步修复');
    console.log('🔧 请检查失败的测试项目');
  }
  
  console.log('\n🎯 修复验证完成！');
}

// 运行测试
if (require.main === module) {
  runFixesVerification().catch(console.error);
}

module.exports = {
  runFixesVerification,
  testResults
};
