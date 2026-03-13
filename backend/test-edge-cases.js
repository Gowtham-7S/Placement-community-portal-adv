const { pool } = require('./config/database');
const DriveService = require('./services/DriveService');
const ExperienceService = require('./services/ExperienceService');
const Company = require('./models/Company');
const User = require('./models/User');

async function testEdgeCases() {
    console.log('--- Testing Edge Cases ---');
    let client, user, company, drive, experience;
    try {
        // 1. Create a mock user
        user = await User.create({
            email: `test_user_${Date.now()}@example.com`,
            passwordHash: 'dummy_hash',
            firstName: 'Test',
            lastName: 'User',
            role: 'student'
        });
        console.log('User created:', user.id);

        // 2. Create a mock company
        const companyQuery = `
      INSERT INTO companies (name, industry, Website, description, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id
    `;
        const companyRes = await pool.query(companyQuery, [`Test Co ${Date.now()}`, 'Tech', 'https', 'desc']);
        company = companyRes.rows[0];
        console.log('Company created:', company.id);

        // 3. Create a drive
        drive = await DriveService.createDrive({
            company_id: company.id,
            role_name: 'SDE',
            interview_date: new Date().toISOString()
        }, user.id); // Assuming user.id can be admin for now, but creating doesn't check role strictly in service layer
        console.log('Drive created:', drive.id);

        // 4. Submit Experience
        experience = await ExperienceService.submitExperience(user.id, {
            drive_id: drive.id,
            company_name: 'Test Co',
            role_applied: 'SDE',
            result: 'pass',
            overall_difficulty: 'medium'
        });
        console.log('Experience submitted:', experience.id);

        // 5. Test Duplicate Submission
        console.log('\\n[TEST 1] Duplicate Submission');
        try {
            await ExperienceService.submitExperience(user.id, {
                drive_id: drive.id,
                company_name: 'Test Co',
                role_applied: 'SDE',
                result: 'pass',
                overall_difficulty: 'medium'
            });
            console.error('❌ Duplicate Submission test failed (no error thrown)');
        } catch (err) {
            if (err.message.includes('already submitted')) {
                console.log('✅ Duplicate Submission test passed:', err.message);
            } else {
                console.error('❌ Duplicate Submission test failed (wrong error):', err.message);
            }
        }

        // 6. Test Drive Deletion
        console.log('\\n[TEST 2] Drive Deletion Constraints');
        try {
            await DriveService.deleteDrive(drive.id);
            console.error('❌ Drive Deletion test failed (no error thrown)');
        } catch (err) {
            if (err.message.includes('Cannot delete drive')) {
                console.log('✅ Drive Deletion test passed:', err.message);
            } else {
                console.error('❌ Drive Deletion test failed (wrong error):', err.message);
            }
        }

    } catch (err) {
        console.error('Unhandled script error:', err);
    } finally {
        console.log('\\n--- Cleanup ---');
        if (experience) await pool.query('DELETE FROM experiences WHERE id = $1', [experience.id]);
        if (drive) await pool.query('DELETE FROM drives WHERE id = $1', [drive.id]);
        if (company) await pool.query('DELETE FROM companies WHERE id = $1', [company.id]);
        if (user) await pool.query('DELETE FROM users WHERE id = $1', [user.id]);
        pool.end();
    }
}

testEdgeCases();
