#!/usr/bin/env node

/**
 * 安全配置检查脚本
 * 检查环境变量和系统安全配置
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🔐 学习平台安全配置检查');
console.log('='.repeat(50));

// 检查.env文件是否存在
const envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env文件不存在');
  console.log('💡 请复制.env.example为.env并配置相应值');
  process.exit(1);
}

// 加载环境变量
require('dotenv').config();

const checks = [];

// 检查JWT密钥
function checkJWTSecret() {
  const jwtSecret = process.env.JWT_SECRET;
  
  if (!jwtSecret) {
    return { status: '❌', message: 'JWT_SECRET未设置' };
  }
  
  if (jwtSecret.includes('your_jwt_secret') || jwtSecret.includes('here')) {
    return { status: '⚠️', message: 'JWT_SECRET使用默认值，请更换为随机密钥' };
  }
  
  if (jwtSecret.length < 32) {
    return { status: '⚠️', message: `JWT_SECRET长度不足 (${jwtSecret.length}/32)` };
  }
  
  // 检查字符复杂度
  const hasUpper = /[A-Z]/.test(jwtSecret);
  const hasLower = /[a-z]/.test(jwtSecret);
  const hasNumber = /[0-9]/.test(jwtSecret);
  
  if (!hasUpper || !hasLower || !hasNumber) {
    return { status: '⚠️', message: 'JWT_SECRET应包含大小写字母和数字' };
  }
  
  return { status: '✅', message: `JWT_SECRET配置良好 (${jwtSecret.length}字符)` };
}

// 检查Session密钥
function checkSessionSecret() {
  const sessionSecret = process.env.SESSION_SECRET;
  
  if (!sessionSecret) {
    return { status: '❌', message: 'SESSION_SECRET未设置' };
  }
  
  if (sessionSecret.includes('your_session_secret') || sessionSecret.includes('here')) {
    return { status: '⚠️', message: 'SESSION_SECRET使用默认值，请更换为随机密钥' };
  }
  
  if (sessionSecret.length < 32) {
    return { status: '⚠️', message: `SESSION_SECRET长度不足 (${sessionSecret.length}/32)` };
  }
  
  return { status: '✅', message: `SESSION_SECRET配置良好 (${sessionSecret.length}字符)` };
}

// 检查数据库配置
function checkDatabaseConfig() {
  const mongoUri = process.env.MONGODB_URI;
  
  if (!mongoUri) {
    return { status: '❌', message: 'MONGODB_URI未设置' };
  }
  
  if (mongoUri.includes('localhost') && process.env.NODE_ENV === 'production') {
    return { status: '⚠️', message: '生产环境不应使用localhost数据库' };
  }
  
  return { status: '✅', message: 'MONGODB_URI配置正常' };
}

// 检查Node环境
function checkNodeEnv() {
  const nodeEnv = process.env.NODE_ENV;
  
  if (!nodeEnv) {
    return { status: '⚠️', message: 'NODE_ENV未设置，默认为development' };
  }
  
  if (nodeEnv === 'production') {
    return { status: '✅', message: '生产环境配置' };
  }
  
  return { status: '✅', message: `开发环境配置 (${nodeEnv})` };
}

// 检查文件权限
function checkFilePermissions() {
  try {
    const envStats = fs.statSync(envPath);
    const mode = envStats.mode & parseInt('777', 8);
    
    if (mode > parseInt('600', 8)) {
      return { status: '⚠️', message: '.env文件权限过于宽松，建议设置为600' };
    }
    
    return { status: '✅', message: '.env文件权限配置安全' };
  } catch (error) {
    return { status: '❌', message: '无法检查.env文件权限' };
  }
}

// 执行所有检查
const securityChecks = [
  { name: 'JWT密钥', check: checkJWTSecret },
  { name: 'Session密钥', check: checkSessionSecret },
  { name: '数据库配置', check: checkDatabaseConfig },
  { name: 'Node环境', check: checkNodeEnv },
  { name: '文件权限', check: checkFilePermissions }
];

console.log('\n📋 安全检查结果:');
console.log('-'.repeat(50));

let passCount = 0;
let warnCount = 0;
let failCount = 0;

securityChecks.forEach(({ name, check }) => {
  const result = check();
  console.log(`${result.status} ${name}: ${result.message}`);
  
  if (result.status === '✅') passCount++;
  else if (result.status === '⚠️') warnCount++;
  else failCount++;
});

console.log('\n📊 检查统计:');
console.log(`   通过: ${passCount}`);
console.log(`   警告: ${warnCount}`);
console.log(`   失败: ${failCount}`);

// 生成新密钥的建议
if (warnCount > 0 || failCount > 0) {
  console.log('\n🔧 修复建议:');
  console.log('生成新的JWT密钥:');
  console.log(`   JWT_SECRET=${crypto.randomBytes(24).toString('base64').replace(/[^a-zA-Z0-9]/g, '')}`);
  console.log('生成新的Session密钥:');
  console.log(`   SESSION_SECRET=${crypto.randomBytes(24).toString('base64').replace(/[^a-zA-Z0-9]/g, '')}`);
}

if (failCount === 0) {
  console.log('\n🎉 安全配置检查通过！');
} else {
  console.log('\n⚠️ 发现安全问题，请及时修复');
  process.exit(1);
}
