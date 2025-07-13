const http = require('http');

async function testStudentPermissions() {
  console.log('🧪 测试学生权限限制...\n');
  
  // 1. 学生登录
  console.log('1. 学生登录...');
  const loginData = JSON.stringify({
    identifier: "20230001",
    password: "20230001", 
    userType: "student"
  });
  
  const loginOptions = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginData)
    }
  };
  
  const loginResponse = await makeRequest(loginOptions, loginData);
  
  if (!loginResponse.success) {
    console.log('❌ 学生登录失败:', loginResponse.message);
    return;
  }
  
  console.log('✅ 学生登录成功');
  console.log('登录响应:', JSON.stringify(loginResponse, null, 2));
  
  const studentToken = loginResponse.data?.accessToken || loginResponse.data?.token || loginResponse.token;
  if (!studentToken) {
    console.log('❌ 未找到token');
    return;
  }
  
  console.log('Token:', studentToken.substring(0, 20) + '...');
  
  // 2. 测试访问权限端点
  console.log('\n2. 测试学生访问权限端点...');
  
  const permissionOptions = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/permissions/permissions',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${studentToken}`
    }
  };
  
  try {
    const permissionResponse = await makeRequest(permissionOptions);
    
    if (permissionResponse.success) {
      console.log('❌ 问题发现: 学生可以访问权限端点 (应该被拒绝)');
      console.log('响应状态: 200 OK');
      console.log('响应消息:', permissionResponse.message);
    } else {
      console.log('✅ 正确: 学生被拒绝访问权限端点');
      console.log('错误消息:', permissionResponse.message);
    }
  } catch (error) {
    if (error.statusCode === 403) {
      console.log('✅ 正确: 学生被拒绝访问权限端点 (403 Forbidden)');
    } else {
      console.log('❓ 意外错误:', error.message);
    }
  }
}

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonResponse = JSON.parse(body);
          if (res.statusCode >= 400) {
            const error = new Error(jsonResponse.message || 'Request failed');
            error.statusCode = res.statusCode;
            error.response = jsonResponse;
            reject(error);
          } else {
            resolve(jsonResponse);
          }
        } catch (err) {
          reject(new Error('Invalid JSON response: ' + body));
        }
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    if (data) {
      req.write(data);
    }
    
    req.end();
  });
}

// 运行测试
testStudentPermissions().catch(console.error); 