// Mock database for testing without MongoDB
const mockDB = {
  connected: false,
  
  connect: () => {
    console.log('📧 MongoDB not available - using mock database for testing');
    console.log('🔗 Mock database connected successfully');
    mockDB.connected = true;
    return Promise.resolve();
  },
  
  disconnect: () => {
    console.log('Mock database disconnected');
    mockDB.connected = false;
    return Promise.resolve();
  }
};

module.exports = mockDB;