const mongoose = require('mongoose');

const testConnections = async () => {
  const uris = [
    'mongodb://localhost:27017/learning_platform',
    'mongodb://127.0.0.1:27017/learning_platform',
    'mongodb://host.docker.internal:27017/learning_platform',
    'mongodb://172.17.0.1:27017/learning_platform'
  ];

  console.log('🔍 Testing MongoDB connections from WSL2...\n');

  for (const uri of uris) {
    try {
      console.log(`⏳ Testing: ${uri}`);
      await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 3000
      });
      
      console.log('✅ SUCCESS! Connection established');
      console.log(`📊 Database: ${mongoose.connection.name}`);
      console.log(`🖥️  Host: ${mongoose.connection.host}:${mongoose.connection.port}`);
      
      await mongoose.disconnect();
      
      // Update .env with working URI
      const fs = require('fs');
      let envContent = fs.readFileSync('.env', 'utf8');
      envContent = envContent.replace(
        /MONGODB_URI=.*/,
        `MONGODB_URI=${uri}`
      );
      fs.writeFileSync('.env', envContent);
      
      console.log(`✅ Updated .env with working URI: ${uri}`);
      console.log('\n🚀 Ready to start Learning Platform!\n');
      return uri;
      
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
      await mongoose.disconnect().catch(() => {});
    }
  }
  
  console.log('\n🚨 All MongoDB connection attempts failed!');
  console.log('\n💡 Possible solutions:');
  console.log('1. Check if Docker container is really running:');
  console.log('   docker ps | findstr learning-mongodb');
  console.log('2. Try port forwarding in Windows PowerShell (as Admin):');
  console.log('   netsh interface portproxy add v4tov4 listenport=27017 listenaddress=0.0.0.0 connectport=27017 connectaddress=127.0.0.1');
  console.log('3. Restart Docker Desktop completely');
  console.log('4. Use MongoDB Atlas (cloud) instead');
  
  return null;
};

testConnections().then((workingUri) => {
  if (workingUri) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}).catch((error) => {
  console.error('Test failed:', error.message);
  process.exit(1);
});