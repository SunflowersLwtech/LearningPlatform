const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

// 测试用户凭据
const users = {
  student: { identifier: '20230001', password: '20230001', userType: 'student' },
  teacher: { identifier: 'liu@school.edu', password: 'admin123', userType: 'staff' },
  principal: { identifier: 'principal@school.edu', password: 'admin123', userType: 'staff' }
};

// 登录函数
async function login(identifier, password, userType) {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, { 
      identifier, 
      password, 
      userType 
    });
    return response.data.data.accessToken;
  } catch (error) {
    console.error(`登录失败 (${identifier}):`, error.response?.data?.message || error.message);
    return null;
  }
}

// 测试权限端点
async function testPermissionEndpoints(userType, token) {
  console.log(`\n=== 测试 ${userType} 用户的权限访问 ===`);
  
  const endpoints = [
    { name: '获取所有权限列表', method: 'GET', url: '/permissions/permissions' },
    { name: '获取角色权限配置', method: 'GET', url: '/permissions/roles' },
    { name: '获取用户权限信息', method: 'GET', url: '/permissions/user' },
    { name: '检查权限', method: 'POST', url: '/permissions/check', data: { permissions: ['user:read'] } }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const config = {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000
      };
      
      let response;
      if (endpoint.method === 'GET') {
        response = await axios.get(`${API_URL}${endpoint.url}`, config);
      } else {
        response = await axios.post(`${API_URL}${endpoint.url}`, endpoint.data, config);
      }
      
      console.log(`✅ ${endpoint.name}: 访问成功`);
      if (endpoint.url === '/permissions/user') {
        console.log(`   - 用户类型: ${response.data.data.userType || 'staff'}`);
        console.log(`   - 权限数量: ${response.data.data.permissions?.length || 0}`);
      }
    } catch (error) {
      if (error.response?.status === 403) {
        console.log(`❌ ${endpoint.name}: 访问被拒绝 (403) - ${error.response.data.message}`);
      } else if (error.code === 'ECONNREFUSED') {
        console.log(`⚠️  ${endpoint.name}: 服务器未运行 - ${error.message}`);
      } else {
        console.log(`⚠️  ${endpoint.name}: 其他错误 - ${error.response?.data?.message || error.message}`);
      }
    }
  }
}

// 测试学生数据访问权限
async function testStudentDataAccess(token) {
  console.log(`\n=== 测试学生数据访问权限 ===`);
  
  const endpoints = [
    { name: '获取学生列表', method: 'GET', url: '/students' },
    { name: '获取其他学生信息', method: 'GET', url: '/students/507f1f77bcf86cd799439011' },
    { name: '创建学生', method: 'POST', url: '/students', data: { name: 'Test Student', studentId: 'TEST001' } }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const config = {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000
      };
      
      let response;
      if (endpoint.method === 'GET') {
        response = await axios.get(`${API_URL}${endpoint.url}`, config);
      } else {
        response = await axios.post(`${API_URL}${endpoint.url}`, endpoint.data, config);
      }
      
      console.log(`✅ ${endpoint.name}: 访问成功 (这可能是安全漏洞)`);
    } catch (error) {
      if (error.response?.status === 403) {
        console.log(`✅ ${endpoint.name}: 正确拒绝访问 (403) - ${error.response.data.message}`);
      } else {
        console.log(`⚠️  ${endpoint.name}: 其他错误 - ${error.response?.data?.message || error.message}`);
      }
    }
  }
}

// 检查服务器状态
async function checkServerStatus() {
  try {
    const response = await axios.get(`${API_URL}/auth/roles`, { timeout: 3000 });
    console.log('✅ 服务器正在运行');
    return true;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ 服务器未运行，请先启动服务器');
    } else {
      console.log('⚠️  服务器状态检查失败:', error.message);
    }
    return false;
  }
}

// 主测试函数
async function runTests() {
  console.log('开始权限测试...\n');
  
  // 检查服务器状态
  const serverRunning = await checkServerStatus();
  if (!serverRunning) {
    console.log('\n请先启动服务器: npm start 或 node server.js');
    return;
  }
  
  // 测试学生用户
  const studentToken = await login(users.student.identifier, users.student.password, users.student.userType);
  if (studentToken) {
    await testPermissionEndpoints('学生', studentToken);
    await testStudentDataAccess(studentToken);
  }
  
  // 测试教师用户
  const teacherToken = await login(users.teacher.identifier, users.teacher.password, users.teacher.userType);
  if (teacherToken) {
    await testPermissionEndpoints('教师', teacherToken);
  }
  
  // 测试校长用户
  const principalToken = await login(users.principal.identifier, users.principal.password, users.principal.userType);
  if (principalToken) {
    await testPermissionEndpoints('校长', principalToken);
  }
  
  console.log('\n权限测试完成！');
  console.log('\n预期结果:');
  console.log('- 学生: 只能访问自己的权限信息，不能访问权限列表和角色配置');
  console.log('- 教师: 可以访问部分权限端点，但不能访问系统级权限配置');
  console.log('- 校长: 可以访问所有权限管理功能');
  console.log('- 学生不应该能够访问其他学生的数据或管理功能');
}

// 运行测试
runTests().catch(console.error); 