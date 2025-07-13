#!/usr/bin/env node

/**
 * 快速功能测试脚本
 * 用于日常开发中的快速功能验证
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';
const STATIC_BASE = 'http://localhost:3000';

async function quickTest() {
  console.log('⚡ 学习平台快速功能测试');
  console.log('='.repeat(40));
  
  let allPassed = true;
  
  try {
    // 1. 服务器连通性测试
    console.log('\n🌐 服务器连通性测试...');
    try {
      const response = await axios.get(STATIC_BASE, { timeout: 5000 });
      console.log('✅ 服务器正常运行');
    } catch (error) {
      console.log('❌ 服务器连接失败');
      allPassed = false;
    }
    
    // 2. API基础测试
    console.log('\n🔌 API基础测试...');
    try {
      const response = await axios.post(`${API_BASE}/auth/login`, {
        identifier: 'invalid',
        password: 'invalid',
        userType: 'staff'
      }, { validateStatus: () => true });
      
      if (response.status === 401 || response.status === 400) {
        console.log('✅ API正常响应');
      } else {
        console.log('⚠️ API响应异常');
      }
    } catch (error) {
      console.log('❌ API连接失败');
      allPassed = false;
    }
    
    // 3. 用户登录测试
    console.log('\n👤 用户登录测试...');
    const testUsers = [
      { name: '学生', credentials: { identifier: '20230001', password: '20230001', userType: 'student' } },
      { name: '教师', credentials: { identifier: 'wang@school.edu', password: 'admin123', userType: 'staff' } }
    ];
    
    for (const user of testUsers) {
      try {
        const response = await axios.post(`${API_BASE}/auth/login`, user.credentials);
        if (response.data.success) {
          console.log(`✅ ${user.name}登录正常`);
        } else {
          console.log(`❌ ${user.name}登录失败`);
          allPassed = false;
        }
      } catch (error) {
        console.log(`❌ ${user.name}登录错误`);
        allPassed = false;
      }
    }
    
    // 4. 静态资源测试
    console.log('\n📁 静态资源测试...');
    const resources = [
      '/js/app.js',
      '/uploads/avatars/avatar-225a51d3-21e2-4c61-8ee6-8fd16444674c.png'
    ];
    
    for (const resource of resources) {
      try {
        const response = await axios.get(`${STATIC_BASE}${resource}`, { 
          validateStatus: () => true,
          timeout: 3000 
        });
        if (response.status === 200) {
          console.log(`✅ ${resource.split('/').pop()} 可访问`);
        } else {
          console.log(`⚠️ ${resource.split('/').pop()} 访问异常 (${response.status})`);
        }
      } catch (error) {
        console.log(`❌ ${resource.split('/').pop()} 访问失败`);
      }
    }
    
    // 5. 数据库连接测试
    console.log('\n🗄️ 数据库连接测试...');
    try {
      const mongoose = require('mongoose');
      require('dotenv').config();
      
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ 数据库连接正常');
      
      const db = mongoose.connection.db;
      const collections = await db.listCollections().toArray();
      console.log(`✅ 数据库集合正常 (${collections.length}个)`);
      
      await mongoose.disconnect();
    } catch (error) {
      console.log('❌ 数据库连接失败');
      allPassed = false;
    }
    
    // 6. 核心功能快速验证
    console.log('\n⚡ 核心功能快速验证...');
    
    // 登录并获取token
    try {
      const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
        identifier: '20230001',
        password: '20230001',
        userType: 'student'
      });
      
      if (loginResponse.data.success) {
        const token = loginResponse.data.data.accessToken;
        
        // 测试学生仪表板
        const dashboardResponse = await axios.get(`${API_BASE}/learning/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (dashboardResponse.data.success) {
          console.log('✅ 学生仪表板正常');
        } else {
          console.log('❌ 学生仪表板异常');
          allPassed = false;
        }
        
        // 测试个人信息
        const profileResponse = await axios.get(`${API_BASE}/students/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (profileResponse.data.success) {
          console.log('✅ 个人信息API正常');
        } else {
          console.log('❌ 个人信息API异常');
          allPassed = false;
        }
        
      } else {
        console.log('❌ 无法获取测试token');
        allPassed = false;
      }
    } catch (error) {
      console.log('❌ 核心功能测试失败');
      allPassed = false;
    }
    
    // 测试结果
    console.log('\n' + '='.repeat(40));
    if (allPassed) {
      console.log('🎉 快速测试全部通过！系统运行正常');
      console.log('✅ 所有核心功能正常工作');
      console.log('🚀 系统可以正常使用');
    } else {
      console.log('⚠️ 快速测试发现问题');
      console.log('💡 建议运行完整测试: node test-all-functions.js');
      console.log('🔧 或检查服务器和数据库状态');
    }
    
    console.log('\n📋 测试完成时间:', new Date().toLocaleString());
    
  } catch (error) {
    console.error('❌ 快速测试过程中发生错误:', error.message);
    allPassed = false;
  }
  
  return allPassed;
}

// 如果直接运行此脚本
if (require.main === module) {
  quickTest().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('测试失败:', error);
    process.exit(1);
  });
}

module.exports = { quickTest };
