const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:5000/api/auth/register';

/**
 * Test Script for Register API
 * Verifies alignment with validationMiddleware.js and setup_database.sql
 */
const runTests = async () => {
  console.log('🚀 Starting Register API Tests...\n');

  // TEST CASE 1: Valid Student Registration
  // Matches 'users' table schema and 'registerValidation' rules
  const validPayload = {
    email: `student_${Date.now()}@test.com`, // Unique email
    password: 'Password@123',               // Meets regex (Upper, Number, Special, Min 8)
    first_name: 'Test',                     // Min 2 chars
    last_name: 'User',                      // Min 2 chars
    role: 'student',                        // In ('admin', 'student', 'junior')
    phone: '9876543210',                    // Valid mobile phone
    department: 'Computer Science',         // Optional string
    batch_year: 2024                        // Int between 2000-2100
  };

  try {
    console.log('1️⃣  Testing Valid Registration...');
    const response = await axios.post(API_URL, validPayload);
    console.log('✅ Success! Status:', response.status);
    console.log('   User:', response.data.user.email);
    console.log('   Token:', response.data.tokens.accessToken ? 'Received' : 'Missing');
  } catch (error) {
    console.error('❌ Failed:', error.response ? error.response.data : error.message);
  }

  console.log('\n--------------------------------\n');

  // TEST CASE 2: Validation Errors
  // Intentionally violating validation rules to ensure middleware works
  const invalidPayload = {
    email: 'not-an-email',                  // Invalid email
    password: 'weak',                       // Weak password
    first_name: 'A',                        // Too short
    role: 'superadmin'                      // Invalid role (not in DB check constraint)
  };

  try {
    console.log('2️⃣  Testing Validation Logic...');
    await axios.post(API_URL, invalidPayload);
    console.log('❌ Failed: Should have returned 400 Bad Request');
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('✅ Validation Caught Errors Correctly!');
      console.log('   Errors:', JSON.stringify(error.response.data.errors, null, 2));
    } else {
      console.error('❌ Unexpected Error:', error.message);
    }
  }
};

runTests();
