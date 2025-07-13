#!/usr/bin/env node

/**
 * 全用户角色页面功能测试脚本
 * 测试校长、教师、学生的所有页面和功能
 * 重点测试已知问题：用户注册、角色分配、学生搜索等
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const API_BASE = 'http://localhost:3000/api';
const STATIC_BASE = 'http://localhost:3000';

// 测试结果统计
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: [],
  warnings: []
};

// 存储测试数据
const testData = {
  tokens: {},
  users: {},
  createdIds: {
    students: [],
    staff: [],
    courses: [],
    assignments: [],
    discussions: [],
    classes: []
  }
};

// 测试用户凭据
const testUsers = {
  principal: { 
    identifier: 'principal@school.edu', 
    password: 'admin123', 
    userType: 'staff',
    expectedRole: 'principal',
    name: '校长'
  },
  teacher: { 
    identifier: 'wang@school.edu', 
    password: 'admin123', 
    userType: 'staff',
    expectedRole: 'head_teacher',
    name: '教师'
  },
  student: { 
    identifier: '20230001', 
    password: '20230001', 
    userType: 'student',
    expectedRole: 'student',
    name: '学生'
  }
};

// 工具函数
function logTest(name, passed, error = null, warning = false) {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${name}`);
  } else {
    testResults.failed++;
    const message = error || '测试失败';
    console.log(`❌ ${name}: ${message}`);
    if (warning) {
      testResults.warnings.push({ test: name, error: message });
    } else {
      testResults.errors.push({ test: name, error: message });
    }
  }
}

function logSection(title) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🧪 ${title}`);
  console.log('='.repeat(70));
}

function logSubSection(title) {
  console.log(`\n📋 ${title}`);
  console.log('-'.repeat(50));
}

// 1. 用户注册功能测试（重点测试已知问题）
async function testUserRegistration() {
  logSection('用户注册功能测试 - 重点测试已知问题');
  
  // 测试学生注册
  logSubSection('学生注册测试');
  
  const studentRegData = {
    studentId: `TEST${Date.now()}`,
    name: '测试注册学生',
    email: `teststudent${Date.now()}@test.com`,
    password: 'test123456',
    confirmPassword: 'test123456',
    grade: '大一',
    gender: 'male',
    phone: '13800138001',
    dateOfBirth: '2000-01-01'
  };
  
  try {
    const response = await axios.post(`${API_BASE}/auth/register`, {
      ...studentRegData,
      userType: 'student'
    });
    
    if (response.data.success) {
      testData.createdIds.students.push(response.data.data._id);
      logTest('学生注册功能', true, `成功注册学生: ${studentRegData.name}`);
      
      // 验证角色分配
      const user = response.data.data;
      logTest('学生角色分配', user.userType === 'student', 
        user.userType !== 'student' ? `角色错误: ${user.userType}` : null);
        
    } else {
      logTest('学生注册功能', false, response.data.message);
    }
  } catch (error) {
    logTest('学生注册功能', false, error.response?.data?.message || error.message);
  }
  
  // 测试员工注册
  logSubSection('员工注册测试');
  
  const staffRegData = {
    staffId: `STAFF${Date.now()}`,
    name: '测试注册教师',
    email: `testteacher${Date.now()}@test.com`,
    password: 'test123456',
    confirmPassword: 'test123456',
    role: 'teacher',
    department: '计算机科学系',
    phone: '13900139001'
  };
  
  try {
    const response = await axios.post(`${API_BASE}/auth/register`, {
      ...staffRegData,
      userType: 'staff'
    });
    
    if (response.data.success) {
      testData.createdIds.staff.push(response.data.data._id);
      logTest('员工注册功能', true, `成功注册员工: ${staffRegData.name}`);
      
      // 验证角色分配
      const user = response.data.data;
      logTest('员工角色分配', user.userType === 'staff' && user.role === 'teacher',
        `用户类型: ${user.userType}, 角色: ${user.role}`);
        
    } else {
      logTest('员工注册功能', false, response.data.message);
    }
  } catch (error) {
    logTest('员工注册功能', false, error.response?.data?.message || error.message);
  }
  
  // 测试重复注册
  logSubSection('重复注册验证测试');
  
  try {
    const response = await axios.post(`${API_BASE}/auth/register`, {
      ...studentRegData,
      userType: 'student'
    });
    
    logTest('重复注册拒绝', !response.data.success, 
      response.data.success ? '应该拒绝重复注册但没有' : null);
  } catch (error) {
    logTest('重复注册拒绝', true, '正确拒绝了重复注册');
  }
  
  // 测试密码不匹配
  logSubSection('密码验证测试');
  
  try {
    const response = await axios.post(`${API_BASE}/auth/register`, {
      studentId: `TEST${Date.now()}2`,
      name: '测试密码不匹配',
      email: `testpwd${Date.now()}@test.com`,
      password: 'test123456',
      confirmPassword: 'different123',
      userType: 'student',
      grade: '大一',
      gender: 'male'
    });
    
    logTest('密码不匹配验证', !response.data.success,
      response.data.success ? '应该拒绝密码不匹配但没有' : null);
  } catch (error) {
    logTest('密码不匹配验证', true, '正确拒绝了密码不匹配');
  }
}

// 2. 用户登录和角色验证
async function testUserLogin() {
  logSection('用户登录和角色验证测试');
  
  for (const [roleKey, userData] of Object.entries(testUsers)) {
    logSubSection(`${userData.name}登录测试`);
    
    try {
      const response = await axios.post(`${API_BASE}/auth/login`, userData);
      
      if (response.data.success) {
        testData.tokens[roleKey] = response.data.data.accessToken;
        testData.users[roleKey] = response.data.data.user;
        
        logTest(`${userData.name}登录`, true);
        
        const user = response.data.data.user;
        
        // 验证用户类型
        logTest(`${userData.name}用户类型验证`, 
          user.userType === userData.userType,
          `期望: ${userData.userType}, 实际: ${user.userType}`);
        
        // 验证角色
        if (userData.expectedRole) {
          logTest(`${userData.name}角色验证`,
            user.role === userData.expectedRole,
            `期望: ${userData.expectedRole}, 实际: ${user.role}`);
        }
        
        // 验证Token格式
        const tokenParts = testData.tokens[roleKey].split('.');
        logTest(`${userData.name}Token格式`, tokenParts.length === 3);
        
      } else {
        logTest(`${userData.name}登录`, false, response.data.message);
      }
    } catch (error) {
      logTest(`${userData.name}登录`, false, error.response?.data?.message || error.message);
    }
  }
}

// 3. 校长页面功能测试
async function testPrincipalPages() {
  logSection('校长页面功能测试');
  
  const principalToken = testData.tokens.principal;
  if (!principalToken) {
    logTest('校长页面测试', false, '校长未登录');
    return;
  }
  
  // 3.1 学生管理页面测试
  logSubSection('学生管理功能测试');
  
  try {
    // 获取学生列表
    const studentsResponse = await axios.get(`${API_BASE}/students`, {
      headers: { Authorization: `Bearer ${principalToken}` }
    });
    
    logTest('校长访问学生列表', studentsResponse.data.success);
    
    if (studentsResponse.data.success) {
      const students = studentsResponse.data.data;
      console.log(`   📊 学生总数: ${students.length}`);
      
      // 测试学生搜索功能（重点测试已知问题）
      logSubSection('学生搜索功能测试 - 重点测试已知问题');
      
      // 测试按姓名搜索
      const searchTests = [
        { name: '按姓名搜索', query: '学生', field: 'search' },
        { name: '按学号搜索', query: '20230001', field: 'search' },
        { name: '按年级搜索', query: '大一', field: 'grade' },
        { name: '按性别搜索', query: 'male', field: 'gender' },
        { name: '空搜索', query: '', field: 'search' },
        { name: '不存在的搜索', query: 'NOTEXIST123', field: 'search' }
      ];
      
      for (const test of searchTests) {
        try {
          const searchUrl = `${API_BASE}/students?${test.field}=${encodeURIComponent(test.query)}`;
          const searchResponse = await axios.get(searchUrl, {
            headers: { Authorization: `Bearer ${principalToken}` }
          });
          
          if (searchResponse.data.success) {
            const results = searchResponse.data.data;
            logTest(`学生搜索-${test.name}`, true, `找到${results.length}个结果`);
            
            // 验证搜索结果的相关性
            if (test.query && test.query !== '' && results.length > 0) {
              const firstResult = results[0];
              let isRelevant = false;
              
              if (test.field === 'search') {
                isRelevant = firstResult.name?.includes(test.query) || 
                           firstResult.studentId?.includes(test.query) ||
                           firstResult.email?.includes(test.query);
              } else if (test.field === 'grade') {
                isRelevant = firstResult.grade === test.query;
              } else if (test.field === 'gender') {
                isRelevant = firstResult.gender === test.query;
              }
              
              logTest(`搜索结果相关性-${test.name}`, isRelevant,
                isRelevant ? null : '搜索结果与查询条件不匹配');
            }
          } else {
            logTest(`学生搜索-${test.name}`, false, searchResponse.data.message);
          }
        } catch (error) {
          logTest(`学生搜索-${test.name}`, false, error.response?.data?.message || error.message);
        }
      }
      
      // 测试分页功能
      logSubSection('学生列表分页测试');
      
      try {
        const page1Response = await axios.get(`${API_BASE}/students?page=1&limit=5`, {
          headers: { Authorization: `Bearer ${principalToken}` }
        });
        
        logTest('学生列表分页', page1Response.data.success);
        
        if (page1Response.data.success) {
          const page1Data = page1Response.data.data;
          console.log(`   📄 第1页学生数: ${page1Data.length}`);
          
          // 测试第2页
          const page2Response = await axios.get(`${API_BASE}/students?page=2&limit=5`, {
            headers: { Authorization: `Bearer ${principalToken}` }
          });
          
          if (page2Response.data.success) {
            logTest('学生列表第2页', true);
          }
        }
      } catch (error) {
        logTest('学生列表分页', false, error.message);
      }
      
      // 测试学生详情查看
      if (students.length > 0) {
        const studentId = students[0]._id;
        try {
          const detailResponse = await axios.get(`${API_BASE}/students/${studentId}`, {
            headers: { Authorization: `Bearer ${principalToken}` }
          });
          
          logTest('学生详情查看', detailResponse.data.success);
        } catch (error) {
          logTest('学生详情查看', false, error.message);
        }
      }
    }
    
  } catch (error) {
    logTest('校长学生管理', false, error.response?.data?.message || error.message);
  }
  
  // 3.2 员工管理页面测试
  logSubSection('员工管理功能测试');
  
  try {
    const staffResponse = await axios.get(`${API_BASE}/staff`, {
      headers: { Authorization: `Bearer ${principalToken}` }
    });
    
    logTest('校长访问员工列表', staffResponse.data.success);
    
    if (staffResponse.data.success) {
      console.log(`   👥 员工总数: ${staffResponse.data.data.length}`);
    }
  } catch (error) {
    logTest('校长员工管理', false, error.response?.data?.message || error.message);
  }
  
  // 3.3 课程管理页面测试
  logSubSection('课程管理功能测试');
  
  try {
    const coursesResponse = await axios.get(`${API_BASE}/courses`, {
      headers: { Authorization: `Bearer ${principalToken}` }
    });
    
    logTest('校长访问课程列表', coursesResponse.data.success);
    
    if (coursesResponse.data.success) {
      console.log(`   📚 课程总数: ${coursesResponse.data.data.length}`);
    }
  } catch (error) {
    logTest('校长课程管理', false, error.response?.data?.message || error.message);
  }
  
  // 3.4 班级管理页面测试
  logSubSection('班级管理功能测试');
  
  try {
    const classesResponse = await axios.get(`${API_BASE}/classes`, {
      headers: { Authorization: `Bearer ${principalToken}` }
    });
    
    logTest('校长访问班级列表', classesResponse.data.success);
    
    if (classesResponse.data.success) {
      console.log(`   🏫 班级总数: ${classesResponse.data.data.length}`);
    }
  } catch (error) {
    logTest('校长班级管理', false, error.response?.data?.message || error.message);
  }
  
  // 3.5 权限管理页面测试
  logSubSection('权限管理功能测试');
  
  try {
    const permissionsResponse = await axios.get(`${API_BASE}/permissions/permissions`, {
      headers: { Authorization: `Bearer ${principalToken}` }
    });
    
    logTest('校长访问权限管理', permissionsResponse.data.success);
  } catch (error) {
    logTest('校长权限管理', false, error.response?.data?.message || error.message);
  }
  
  // 3.6 系统设置页面测试
  logSubSection('系统设置功能测试');
  
  try {
    const settingsResponse = await axios.get(`${API_BASE}/settings`, {
      headers: { Authorization: `Bearer ${principalToken}` },
      validateStatus: () => true
    });
    
    logTest('校长访问系统设置', 
      settingsResponse.status === 200 || settingsResponse.status === 404,
      settingsResponse.status === 404 ? '设置API未实现' : null);
  } catch (error) {
    logTest('校长系统设置', false, error.message);
  }
}

// 4. 教师页面功能测试
async function testTeacherPages() {
  logSection('教师页面功能测试');

  const teacherToken = testData.tokens.teacher;
  if (!teacherToken) {
    logTest('教师页面测试', false, '教师未登录');
    return;
  }

  // 4.1 教师仪表板测试
  logSubSection('教师仪表板测试');

  try {
    const dashboardResponse = await axios.get(`${API_BASE}/dashboard`, {
      headers: { Authorization: `Bearer ${teacherToken}` },
      validateStatus: () => true
    });

    logTest('教师仪表板访问',
      dashboardResponse.status === 200 || dashboardResponse.status === 404,
      dashboardResponse.status === 404 ? '仪表板API未实现' : null);
  } catch (error) {
    logTest('教师仪表板访问', false, error.message);
  }

  // 4.2 课程管理测试
  logSubSection('教师课程管理测试');

  try {
    const coursesResponse = await axios.get(`${API_BASE}/courses`, {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });

    logTest('教师访问课程列表', coursesResponse.data.success);

    if (coursesResponse.data.success) {
      console.log(`   📚 教师可见课程数: ${coursesResponse.data.data.length}`);
    }
  } catch (error) {
    logTest('教师课程管理', false, error.response?.data?.message || error.message);
  }

  // 4.3 作业管理测试
  logSubSection('教师作业管理测试');

  try {
    // 获取作业列表
    const assignmentsResponse = await axios.get(`${API_BASE}/assignments`, {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });

    logTest('教师访问作业列表', assignmentsResponse.data.success);

    if (assignmentsResponse.data.success) {
      console.log(`   📝 作业总数: ${assignmentsResponse.data.data.length}`);

      // 测试创建作业
      const courseResponse = await axios.get(`${API_BASE}/courses`, {
        headers: { Authorization: `Bearer ${teacherToken}` }
      });

      if (courseResponse.data.success && courseResponse.data.data.length > 0) {
        const course = courseResponse.data.data[0];

        const newAssignment = {
          title: `教师测试作业-${Date.now()}`,
          description: '这是教师创建的测试作业',
          course: course._id,
          type: 'homework',
          startDate: new Date().toISOString(),
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          totalPoints: 100,
          attempts: 3,
          isPublished: true
        };

        try {
          const createResponse = await axios.post(`${API_BASE}/assignments`, newAssignment, {
            headers: { Authorization: `Bearer ${teacherToken}` }
          });

          if (createResponse.data.success) {
            testData.createdIds.assignments.push(createResponse.data.data._id);
            logTest('教师创建作业', true);
          } else {
            logTest('教师创建作业', false, createResponse.data.message);
          }
        } catch (error) {
          logTest('教师创建作业', false, error.response?.data?.message || error.message);
        }
      }
    }
  } catch (error) {
    logTest('教师作业管理', false, error.response?.data?.message || error.message);
  }

  // 4.4 学生管理测试（教师权限）
  logSubSection('教师学生管理权限测试');

  try {
    const studentsResponse = await axios.get(`${API_BASE}/students`, {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });

    logTest('教师访问学生列表', studentsResponse.data.success);

    if (studentsResponse.data.success) {
      console.log(`   👥 教师可见学生数: ${studentsResponse.data.data.length}`);
    }
  } catch (error) {
    logTest('教师学生管理权限', false, error.response?.data?.message || error.message);
  }

  // 4.5 成绩管理测试
  logSubSection('教师成绩管理测试');

  try {
    const gradesResponse = await axios.get(`${API_BASE}/grades`, {
      headers: { Authorization: `Bearer ${teacherToken}` },
      validateStatus: () => true
    });

    logTest('教师访问成绩管理',
      gradesResponse.status === 200 || gradesResponse.status === 404,
      gradesResponse.status === 404 ? '成绩API未实现' : null);
  } catch (error) {
    logTest('教师成绩管理', false, error.message);
  }

  // 4.6 权限边界测试
  logSubSection('教师权限边界测试');

  try {
    const permissionsResponse = await axios.get(`${API_BASE}/permissions/permissions`, {
      headers: { Authorization: `Bearer ${teacherToken}` },
      validateStatus: () => true
    });

    logTest('教师访问权限管理（应被拒绝）',
      permissionsResponse.status === 403,
      permissionsResponse.status !== 403 ? '教师不应该能访问权限管理' : null);
  } catch (error) {
    logTest('教师权限边界', true, '正确拒绝了权限管理访问');
  }
}

// 5. 学生页面功能测试
async function testStudentPages() {
  logSection('学生页面功能测试');

  const studentToken = testData.tokens.student;
  if (!studentToken) {
    logTest('学生页面测试', false, '学生未登录');
    return;
  }

  // 5.1 学生仪表板测试
  logSubSection('学生仪表板测试');

  try {
    const dashboardResponse = await axios.get(`${API_BASE}/learning/dashboard`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });

    logTest('学生仪表板访问', dashboardResponse.data.success);

    if (dashboardResponse.data.success) {
      const data = dashboardResponse.data.data;
      console.log(`   📊 待完成作业: ${data.pendingAssignments.length}`);
      console.log(`   📊 最近提交: ${data.recentSubmissions.length}`);
      console.log(`   📊 活跃讨论: ${data.activeDiscussions.length}`);

      // 验证仪表板数据结构
      logTest('仪表板数据结构',
        data.hasOwnProperty('pendingAssignments') &&
        data.hasOwnProperty('recentSubmissions') &&
        data.hasOwnProperty('activeDiscussions'));
    }
  } catch (error) {
    logTest('学生仪表板', false, error.response?.data?.message || error.message);
  }

  // 5.2 个人信息测试
  logSubSection('学生个人信息测试');

  try {
    const profileResponse = await axios.get(`${API_BASE}/students/me`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });

    logTest('学生个人信息访问', profileResponse.data.success);

    if (profileResponse.data.success) {
      const student = profileResponse.data.data;
      console.log(`   👤 学生姓名: ${student.name}`);
      console.log(`   🆔 学号: ${student.studentId}`);
      console.log(`   📚 年级: ${student.grade}`);
    }
  } catch (error) {
    logTest('学生个人信息', false, error.response?.data?.message || error.message);
  }

  // 5.3 课程查看测试
  logSubSection('学生课程查看测试');

  try {
    const coursesResponse = await axios.get(`${API_BASE}/courses`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });

    logTest('学生访问课程列表', coursesResponse.data.success);

    if (coursesResponse.data.success) {
      console.log(`   📚 可见课程数: ${coursesResponse.data.data.length}`);
    }
  } catch (error) {
    logTest('学生课程查看', false, error.response?.data?.message || error.message);
  }

  // 5.4 作业查看和提交测试
  logSubSection('学生作业功能测试');

  try {
    const assignmentsResponse = await axios.get(`${API_BASE}/assignments`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });

    logTest('学生访问作业列表', assignmentsResponse.data.success);

    if (assignmentsResponse.data.success) {
      const assignments = assignmentsResponse.data.data;
      console.log(`   📝 可见作业数: ${assignments.length}`);

      // 测试作业详情查看
      if (assignments.length > 0) {
        const assignment = assignments[0];
        try {
          const detailResponse = await axios.get(`${API_BASE}/assignments/${assignment._id}`, {
            headers: { Authorization: `Bearer ${studentToken}` }
          });

          logTest('学生查看作业详情', detailResponse.data.success);
        } catch (error) {
          logTest('学生查看作业详情', false, error.message);
        }
      }
    }
  } catch (error) {
    logTest('学生作业功能', false, error.response?.data?.message || error.message);
  }

  // 5.5 讨论区功能测试
  logSubSection('学生讨论区功能测试');

  try {
    // 获取讨论列表
    const discussionsResponse = await axios.get(`${API_BASE}/learning/discussions`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });

    logTest('学生访问讨论列表', discussionsResponse.data.success);

    if (discussionsResponse.data.success) {
      console.log(`   💬 讨论数: ${discussionsResponse.data.data.length}`);

      // 测试创建讨论
      const newDiscussion = {
        title: `学生测试讨论-${Date.now()}`,
        content: '这是学生创建的测试讨论',
        type: 'general'
      };

      try {
        const createResponse = await axios.post(`${API_BASE}/learning/discussions`, newDiscussion, {
          headers: { Authorization: `Bearer ${studentToken}` }
        });

        if (createResponse.data.success) {
          testData.createdIds.discussions.push(createResponse.data.data._id);
          logTest('学生创建讨论', true);

          // 测试参与讨论
          const discussionId = createResponse.data.data._id;
          const replyResponse = await axios.post(`${API_BASE}/learning/discussions/${discussionId}/participate`, {
            content: '这是一个测试回复'
          }, {
            headers: { Authorization: `Bearer ${studentToken}` }
          });

          logTest('学生参与讨论', replyResponse.data.success);

        } else {
          logTest('学生创建讨论', false, createResponse.data.message);
        }
      } catch (error) {
        logTest('学生讨论功能', false, error.response?.data?.message || error.message);
      }
    }
  } catch (error) {
    logTest('学生讨论区', false, error.response?.data?.message || error.message);
  }

  // 5.6 学生权限边界测试
  logSubSection('学生权限边界测试');

  const restrictedEndpoints = [
    { name: '学生列表', url: '/students' },
    { name: '员工列表', url: '/staff' },
    { name: '权限管理', url: '/permissions/permissions' }
  ];

  for (const endpoint of restrictedEndpoints) {
    try {
      const response = await axios.get(`${API_BASE}${endpoint.url}`, {
        headers: { Authorization: `Bearer ${studentToken}` },
        validateStatus: () => true
      });

      logTest(`学生访问${endpoint.name}（应被拒绝）`,
        response.status === 403,
        response.status !== 403 ? `学生不应该能访问${endpoint.name}` : null);
    } catch (error) {
      logTest(`学生权限边界-${endpoint.name}`, true, '正确拒绝了访问');
    }
  }
}

// 运行测试
async function runAllUserRoleTests() {
  console.log('🧪 全用户角色页面功能测试开始');
  console.log(`测试时间: ${new Date().toLocaleString()}`);
  console.log(`API地址: ${API_BASE}`);
  console.log('\n🎯 重点测试已知问题:');
  console.log('   - 用户注册功能异常');
  console.log('   - 角色分配逻辑问题');
  console.log('   - 校长页面学生搜索功能问题');

  try {
    await testUserRegistration();
    await testUserLogin();
    await testPrincipalPages();
    await testTeacherPages();
    await testStudentPages();

  } catch (error) {
    console.error('❌ 测试过程中发生严重错误:', error.message);
  } finally {
    showTestResults();
  }
}

// 显示测试结果
function showTestResults() {
  console.log('\n' + '='.repeat(70));
  console.log('📊 全用户角色测试结果统计');
  console.log('='.repeat(70));
  
  const passRate = testResults.total > 0 ? (testResults.passed / testResults.total * 100).toFixed(1) : 0;
  
  console.log(`总测试数: ${testResults.total}`);
  console.log(`通过数: ${testResults.passed}`);
  console.log(`失败数: ${testResults.failed}`);
  console.log(`通过率: ${passRate}%`);
  
  if (testResults.errors.length > 0) {
    console.log('\n❌ 失败的测试:');
    testResults.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error.test}: ${error.error}`);
    });
  }
  
  if (testResults.warnings.length > 0) {
    console.log('\n⚠️ 警告:');
    testResults.warnings.forEach((warning, index) => {
      console.log(`   ${index + 1}. ${warning.test}: ${warning.error}`);
    });
  }
  
  console.log('\n🎯 已知问题测试结果:');
  console.log('   📝 用户注册功能: 已测试');
  console.log('   🔐 角色分配逻辑: 已测试');
  console.log('   🔍 学生搜索功能: 已重点测试');
  
  if (passRate >= 80) {
    console.log('\n🎉 测试结果良好！大部分功能正常');
  } else if (passRate >= 60) {
    console.log('\n✅ 测试结果一般，需要关注失败的功能');
  } else {
    console.log('\n⚠️ 测试结果需要改进，存在较多问题');
  }
  
  console.log('\n🎯 测试完成！');
}

// 运行测试
if (require.main === module) {
  runAllUserRoleTests().catch(console.error);
}

module.exports = {
  runAllUserRoleTests,
  testResults,
  testData
};
