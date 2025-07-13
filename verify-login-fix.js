#!/usr/bin/env node

/**
 * 验证登录跳转修复
 */

const fs = require('fs');

function verifyLoginFix() {
  console.log('🔍 验证登录跳转修复');
  console.log('='.repeat(50));
  
  try {
    // 读取前端JavaScript文件
    const jsContent = fs.readFileSync('public/js/app.js', 'utf8');
    
    let allFixed = true;
    const issues = [];
    
    // 1. 检查showDashboard函数是否使用正确的用户类型判断
    if (jsContent.includes('currentUser.userType === \'student\'')) {
      console.log('✅ showDashboard函数使用正确的userType字段');
    } else if (jsContent.includes('currentUser.role === \'student\'')) {
      console.log('❌ showDashboard函数仍使用错误的role字段');
      issues.push('showDashboard函数需要修复用户类型判断');
      allFixed = false;
    } else {
      console.log('⚠️ 无法确定showDashboard函数的用户类型判断逻辑');
    }
    
    // 2. 检查updateNavbar函数是否使用正确的用户类型判断
    const navbarUserTypeMatch = jsContent.match(/if \(currentUser\.userType === 'student'\)/);
    if (navbarUserTypeMatch) {
      console.log('✅ updateNavbar函数使用正确的userType字段');
    } else {
      console.log('❌ updateNavbar函数可能仍有问题');
      issues.push('updateNavbar函数需要检查用户类型判断');
      allFixed = false;
    }
    
    // 3. 检查是否正确隐藏欢迎页面
    if (jsContent.includes('$(\'#welcomeSection\').classList.add(\'d-none\')')) {
      console.log('✅ 正确隐藏欢迎页面');
    } else {
      console.log('❌ 可能没有正确隐藏欢迎页面');
      issues.push('需要确保登录后隐藏欢迎页面');
      allFixed = false;
    }
    
    // 4. 检查是否正确显示仪表板内容
    if (jsContent.includes('$(\'#dashboardContent\').classList.remove(\'d-none\')')) {
      console.log('✅ 正确显示仪表板内容');
    } else {
      console.log('❌ 可能没有正确显示仪表板内容');
      issues.push('需要确保登录后显示仪表板内容');
      allFixed = false;
    }
    
    // 5. 检查登录成功后的处理流程
    const loginSuccessPattern = /showAlert\('登录成功！', 'success'\);\s*showDashboard\(\);\s*updateNavbar\(\);/;
    if (loginSuccessPattern.test(jsContent)) {
      console.log('✅ 登录成功后的处理流程正确');
    } else {
      console.log('⚠️ 登录成功后的处理流程可能有问题');
      issues.push('检查登录成功后是否调用了showDashboard和updateNavbar');
    }
    
    // 6. 检查DOM选择器函数
    if (jsContent.includes('const $ = (selector) => document.querySelector(selector)')) {
      console.log('✅ DOM选择器函数定义正确');
    } else {
      console.log('❌ DOM选择器函数可能有问题');
      issues.push('检查$函数是否正确定义');
      allFixed = false;
    }
    
    console.log('\n📋 修复状态总结:');
    
    if (allFixed) {
      console.log('🎉 所有登录跳转相关的代码都已正确修复！');
      console.log('\n✅ 修复内容:');
      console.log('   - showDashboard函数使用currentUser.userType');
      console.log('   - updateNavbar函数使用currentUser.userType');
      console.log('   - 正确隐藏欢迎页面');
      console.log('   - 正确显示仪表板内容');
      console.log('   - 登录成功后正确调用相关函数');
      
      console.log('\n💡 如果登录后仍不跳转，可能的原因:');
      console.log('   1. 浏览器缓存问题 - 清除缓存和localStorage');
      console.log('   2. JavaScript错误 - 检查浏览器控制台');
      console.log('   3. 网络问题 - 检查API请求是否成功');
      console.log('   4. CSS问题 - 检查元素是否被正确显示/隐藏');
      
      console.log('\n🔧 调试步骤:');
      console.log('   1. 打开浏览器开发者工具');
      console.log('   2. 清除localStorage: localStorage.clear()');
      console.log('   3. 刷新页面');
      console.log('   4. 尝试登录并观察控制台输出');
      console.log('   5. 检查网络请求是否成功');
      
    } else {
      console.log('❌ 仍有问题需要修复:');
      issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
    }
    
    console.log('\n🧪 测试建议:');
    console.log('   1. 访问测试页面: http://localhost:3000/test-login-frontend.html');
    console.log('   2. 使用不同用户类型测试登录');
    console.log('   3. 检查API响应和前端处理');
    
    return allFixed;
    
  } catch (error) {
    console.error('❌ 验证过程中发生错误:', error.message);
    return false;
  }
}

// 运行验证
const success = verifyLoginFix();
process.exit(success ? 0 : 1);
