const mongoose = require('mongoose');

async function testMongoDB() {
  const testURIs = [
    'mongodb://localhost:27017/learning_platform',
    'mongodb://127.0.0.1:27017/learning_platform'
  ];

  console.log('🔍 Testing MongoDB connections...\n');

  for (const uri of testURIs) {
    try {
      console.log(`⏳ Trying: ${uri}`);
      await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 3000
      });
      
      console.log('✅ MongoDB connection successful!');
      console.log(`📊 Connected to: ${mongoose.connection.name}`);
      console.log(`🖥️  Host: ${mongoose.connection.host}:${mongoose.connection.port}`);
      
      await mongoose.disconnect();
      console.log('✅ Test completed successfully\n');
      
      console.log('🚀 Ready to start the full application!');
      console.log('Run: npm run seed && npm run dev');
      return true;
      
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
      await mongoose.disconnect().catch(() => {});
    }
  }
  
  console.log('\n🚨 MongoDB not available locally');
  console.log('\n📋 Options to proceed:');
  console.log('1. Install MongoDB locally (requires sudo)');
  console.log('2. Use MongoDB Atlas (cloud, free)');
  console.log('3. Use Docker Desktop');
  console.log('\nSee QUICK_START.md for detailed instructions');
  
  return false;
}

testMongoDB().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('💥 Test failed:', error.message);
  process.exit(1);
});