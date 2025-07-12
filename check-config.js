const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

console.log('🔧 LEARNING PLATFORM - CONFIGURATION CHECK\n');

const configs = [
  {
    name: 'MongoDB URI',
    key: 'MONGODB_URI',
    required: true,
    description: 'Database connection string'
  },
  {
    name: 'JWT Secret',
    key: 'JWT_SECRET', 
    required: true,
    description: 'Authentication token secret'
  },
  {
    name: 'Port',
    key: 'PORT',
    required: false,
    description: 'Server port (default: 3000)'
  },
  {
    name: 'Node Environment',
    key: 'NODE_ENV',
    required: false,
    description: 'Environment mode (default: development)'
  },
  {
    name: 'Upload Path',
    key: 'UPLOAD_PATH',
    required: false,
    description: 'File upload directory'
  },
  {
    name: 'Max File Size',
    key: 'MAX_FILE_SIZE',
    required: false,
    description: 'Maximum upload file size'
  },
  {
    name: 'Session Secret',
    key: 'SESSION_SECRET',
    required: false,
    description: 'Session encryption key'
  },
  {
    name: 'Email Host',
    key: 'EMAIL_HOST',
    required: false,
    description: 'SMTP server (optional)'
  },
  {
    name: 'Email User',
    key: 'EMAIL_USER',
    required: false,
    description: 'Email username (optional)'
  },
  {
    name: 'Redis URL',
    key: 'REDIS_URL',
    required: false,
    description: 'Redis cache server (optional)'
  }
];

let allRequired = true;
let warnings = [];

console.log('📋 CONFIGURATION STATUS:\n');

configs.forEach(config => {
  const value = process.env[config.key];
  const hasValue = value && value !== 'your_email@gmail.com' && value !== 'your_email_password' && value !== 'your_session_secret_here';
  
  if (config.required) {
    if (hasValue) {
      console.log(`✅ ${config.name}: Configured`);
    } else {
      console.log(`❌ ${config.name}: MISSING (Required)`);
      allRequired = false;
    }
  } else {
    if (hasValue) {
      console.log(`✅ ${config.name}: Configured`);
    } else {
      console.log(`⚠️  ${config.name}: Not configured (Optional)`);
      warnings.push(config);
    }
  }
});

console.log('\n' + '='.repeat(50));

if (allRequired) {
  console.log('🎉 ALL REQUIRED CONFIGURATIONS ARE SET!');
  
  if (warnings.length > 0) {
    console.log('\n📝 Optional configurations not set:');
    warnings.forEach(w => {
      if (w.key.includes('EMAIL')) {
        console.log(`   • ${w.name}: ${w.description} - Email features disabled`);
      } else if (w.key.includes('REDIS')) {
        console.log(`   • ${w.name}: ${w.description} - Caching disabled`);
      } else {
        console.log(`   • ${w.name}: ${w.description} - Using defaults`);
      }
    });
  }
  
  console.log('\n🚀 SYSTEM READY TO START!');
  console.log('\nNext steps:');
  console.log('1. Ensure MongoDB is running');
  console.log('2. Run: npm run seed');
  console.log('3. Run: npm run dev');
  console.log('4. Open: http://localhost:3000');
  
} else {
  console.log('🚨 MISSING REQUIRED CONFIGURATIONS!');
  console.log('\nPlease check the configurations marked with ❌ above.');
  console.log('Most likely you need to set up MongoDB connection.');
}

console.log('\n' + '='.repeat(50));

// Additional system checks
console.log('\n🔍 SYSTEM CHECKS:\n');

// Check Node.js version
const nodeVersion = process.version;
console.log(`📦 Node.js: ${nodeVersion} ${nodeVersion >= 'v16' ? '✅' : '⚠️  (v16+ recommended)'}`);

// Check if uploads directory exists
const fs = require('fs');
const uploadsPath = process.env.UPLOAD_PATH || './uploads';
const uploadsExists = fs.existsSync(uploadsPath);
console.log(`📁 Uploads directory: ${uploadsExists ? '✅ Exists' : '⚠️  Missing (will be created)'}`);

// Check package.json
const packageExists = fs.existsSync('./package.json');
console.log(`📋 Package.json: ${packageExists ? '✅ Found' : '❌ Missing'}`);

// Check main files
const mainFiles = ['server.js', 'config/database.js', 'src/models/Student.js'];
mainFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`📄 ${file}: ${exists ? '✅' : '❌'}`);
});

console.log('\n💡 TIP: If MongoDB is not running, you can:');
console.log('   • Use MongoDB Atlas (cloud, free)');
console.log('   • Install MongoDB locally');
console.log('   • Use Docker: docker run -d -p 27017:27017 mongo');

console.log('\n📚 For detailed setup instructions, see QUICK_START.md\n');