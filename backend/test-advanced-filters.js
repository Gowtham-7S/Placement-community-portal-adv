const axios = require('axios');
const API_URL = 'http://localhost:5000/api';

async function testFilters() {
    console.log('Testing Advanced Filters...');

    try {
        // 1. Admin Login
        console.log('\n--- 1. Admin Login ---');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'john@placement.com',
            password: 'password123'
        });
        const token = loginRes.data.data.token;
        console.log('Login successful. Token acquired.');

        const config = {
            headers: { Authorization: `Bearer ${token}` }
        };

        // 2. Test Drives filter by CTC Minimum  (assuming some drives exist)
        console.log('\n--- 2. Fetch Drives with CTC >= 10 ---');
        const drivesRes = await axios.get(`${API_URL}/admin/drives?ctc_min=10`, config);
        console.log('Drives count with CTC >= 10:', drivesRes.data.data.length);

        if (drivesRes.data.data.length > 0) {
            const minCTC = Math.min(...drivesRes.data.data.map(d => parseFloat(d.ctc || 0)));
            console.log(`Smallest CTC found in filtered list: ${minCTC}`);
            if (minCTC < 10) {
                console.error('ERROR: Filter returned CTC < 10!');
            } else {
                console.log('SUCCESS: CTC filter works.');
            }
        } else {
            console.log('No drives found >= 10 LPA. Try inserting some to fully test.');
        }

        // 3. Test Dependencies
        console.log('\n--- 3. Fetch Pending Approvals with date filtering ---');
        // Using an arbitrary range
        const oldDate = '2024-01-01';
        const futureDate = '2027-01-01';
        const pendingRes = await axios.get(`${API_URL}/admin/submissions/pending?date_from=${oldDate}&date_to=${futureDate}`, config);
        console.log('Pending Submissions in date range:', pendingRes.data.total);

        console.log('\nAll APIs successfully responded without errors.');
    } catch (err) {
        if (err.response) {
            console.error('API Error:', err.response.status, err.response.data);
        } else {
            console.error('Request Error:', err.message);
        }
    }
}

testFilters();
