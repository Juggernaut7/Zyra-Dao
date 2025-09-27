// Simple test script to verify backend is working
const axios = require('axios');

async function testBackend() {
  try {
    console.log('🧪 Testing backend connection...');
    
    // Test health endpoint
    const healthResponse = await axios.get('http://localhost:5000/api/health');
    console.log('✅ Health check:', healthResponse.data);
    
    // Test proposals endpoint
    const proposalsResponse = await axios.get('http://localhost:5000/api/proposals');
    console.log('✅ Proposals endpoint:', proposalsResponse.status);
    
    console.log('🎉 Backend is working correctly!');
  } catch (error) {
    console.error('❌ Backend test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testBackend();
