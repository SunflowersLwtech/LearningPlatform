#!/usr/bin/env node

/**
 * 简化的讨论区文件上传测试
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const API_BASE = 'http://localhost:3000/api';

async function testDiscussionUpload() {
  console.log('🧪 测试讨论区文件上传功能\n');
  
  try {
    // 1. 登录获取token
    console.log('🔐 登录...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      identifier: 'principal@school.edu',
      password: 'admin123',
      userType: 'staff'
    });
    
    if (!loginResponse.data.success) {
      throw new Error('登录失败');
    }
    
    const token = loginResponse.data.data.accessToken;
    console.log('✅ 登录成功');
    
    // 2. 创建讨论
    console.log('\n💬 创建讨论...');
    const discussionResponse = await axios.post(`${API_BASE}/learning/discussions`, {
      title: '文件上传测试讨论',
      content: '这是一个用于测试文件上传功能的讨论',
      type: 'general'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!discussionResponse.data.success) {
      throw new Error('创建讨论失败: ' + discussionResponse.data.message);
    }
    
    const discussionId = discussionResponse.data.data._id;
    console.log(`✅ 讨论创建成功，ID: ${discussionId}`);
    
    // 3. 创建测试文件
    console.log('\n📄 创建测试文件...');
    const testContent = `测试文件内容
创建时间: ${new Date().toLocaleString()}
用途: 验证讨论区文件上传功能`;
    
    fs.writeFileSync('test-upload.txt', testContent);
    console.log('✅ 测试文件创建成功');
    
    // 4. 测试纯文本回复（无文件）
    console.log('\n💭 测试纯文本回复...');
    const textResponse = await axios.post(`${API_BASE}/learning/discussions/${discussionId}/participate`, {
      content: '这是一个纯文本回复，没有附件'
    }, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (textResponse.data.success) {
      console.log('✅ 纯文本回复成功');
    } else {
      console.log('❌ 纯文本回复失败:', textResponse.data.message);
    }
    
    // 5. 测试文件上传回复
    console.log('\n📎 测试文件上传回复...');
    const formData = new FormData();
    formData.append('content', '这是一个带附件的回复');
    formData.append('attachments', fs.createReadStream('test-upload.txt'));
    
    const uploadResponse = await axios.post(`${API_BASE}/learning/discussions/${discussionId}/participate`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        ...formData.getHeaders()
      }
    });
    
    if (uploadResponse.data.success) {
      console.log('✅ 文件上传回复成功');
      console.log('📋 回复详情:');
      
      // 获取讨论详情查看上传结果
      const detailResponse = await axios.get(`${API_BASE}/learning/discussions/${discussionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (detailResponse.data.success) {
        const discussion = detailResponse.data.data;
        console.log(`   总回复数: ${discussion.posts.length}`);
        
        discussion.posts.forEach((post, index) => {
          console.log(`   回复 ${index + 1}: ${post.content}`);
          if (post.attachments && post.attachments.length > 0) {
            post.attachments.forEach(att => {
              console.log(`     📎 附件: ${att.name} (${att.type})`);
              console.log(`     🔗 URL: ${att.url}`);
            });
          }
        });
      }
    } else {
      console.log('❌ 文件上传回复失败:', uploadResponse.data.message);
      console.log('错误详情:', uploadResponse.data.error);
    }
    
    // 6. 清理测试文件
    console.log('\n🧹 清理测试文件...');
    fs.unlinkSync('test-upload.txt');
    console.log('✅ 测试文件已删除');
    
    console.log('\n🎯 测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
    
    // 清理测试文件
    try {
      fs.unlinkSync('test-upload.txt');
    } catch (e) {
      // 忽略清理错误
    }
  }
}

// 运行测试
testDiscussionUpload();
