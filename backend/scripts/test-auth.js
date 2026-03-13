const axios = require('axios');

const API_URL = 'http://localhost:5000/api/auth';

// Generate a random email to allow repeated testing
const randomId = Math.floor(Math.random() * 10000);
const testUser = {
  first_name: 'Test',
  last_name: `User${randomId}`,
  email: `testuser${randomId}@example.com`,
  password: 'password123',
  role: 'student',
  phone: '9876543210',
  department: 'CSE',
  batch_year: 2025
};

async function testAuthFlow() {
  console.log('------------------------------------------------');
  console.log('🔐 Authentication Flow Test');
  console.log('------------------------------------------------');
  console.log(`Target: ${API_URL}`);
  console.log(`User:   ${testUser.email}`);

  try {
    // 1. Test Registration
    console.log('\n1️⃣  Attempting Registration...');
    const regRes = await axios.post(`${API_URL}/register`, testUser);
    console.log('✅ Registration Successful!');
    console.log(`   Message: ${regRes.data.message}`);
    console.log(`   User ID: ${regRes.data.user.id}`);

    // 2. Test Login
    console.log('\n2️⃣  Attempting Login...');
    const loginRes = await axios.post(`${API_URL}/login`, {
      email: testUser.email,
      password: testUser.password
    });
    console.log('✅ Login Successful!');
    console.log(`   Token Received: ${loginRes.data.token ? 'Yes (Bearer ...)' : 'No ❌'}`);
    console.log(`   Role: ${loginRes.data.user.role}`);

  } catch (error) {
    console.error('\n❌ Test Failed');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.error(`   Error: ${error.message}`);
    }
  }
  console.log('\n------------------------------------------------');
}

testAuthFlow();