const { pool } = require('../config/database');
const ExperienceService = require('../services/ExperienceService');

const mockExperienceData = {
    drive_id: null, // Optional
    company_name: "Test Company " + Date.now(),
    role_applied: "SDE",
    result: "pass",
    selected: true,
    offer_received: true,
    ctc_offered: 15.5,
    is_anonymous: false,
    interview_duration: 60,
    overall_difficulty: "medium",
    overall_feedback: "Great process",
    confidence_level: 8,
    rounds: [
        {
            round_number: 1,
            round_type: "Technical",
            duration_minutes: 45,
            difficulty_level: "medium",
            topics: ["DSA", "System Design"],
            questions_list: [
                {
                    question_text: "Reverse a linked list",
                    difficulty: "easy",
                    category: "DSA"
                },
                {
                    question_text: "Design a URL shortener",
                    difficulty: "medium",
                    category: "System Design"
                }
            ]
        },
        {
            round_number: 2,
            round_type: "HR",
            duration_minutes: 30,
            difficulty_level: "easy",
            questions_list: [
                {
                    question_text: "Why this company?",
                    difficulty: "easy",
                    category: "Behavioral"
                }
            ]
        }
    ]
};

async function testSubmission() {
    try {
        console.log("Testing Experience Submission...");

        // We need a valid user ID. Assuming user ID 1 exists or creating a dummy one might be needed.
        // For now, let's try with ID 1. If it fails, we know DB constraint is working.
        // A better approach is to query for a user first.
        const userRes = await pool.query("SELECT id FROM users LIMIT 1");
        let userId = userRes.rows[0]?.id;

        if (!userId) {
            console.log("No users found. Creating a test user...");
            const newUser = await pool.query(`
         INSERT INTO users (email, password_hash, first_name, last_name, role)
         VALUES ('test@example.com', 'hash', 'Test', 'User', 'student')
         RETURNING id
       `);
            userId = newUser.rows[0].id;
        }

        console.log(`Using User ID: ${userId}`);

        const experience = await ExperienceService.submitExperience(userId, mockExperienceData);
        console.log("Submission Successful!");
        console.log("Experience ID:", experience.id);

        // Verify Rounds
        const roundsRes = await pool.query("SELECT * FROM rounds WHERE experience_id = $1", [experience.id]);
        console.log(`Saved ${roundsRes.rows.length} rounds.`);

        // Verify Questions
        for (const round of roundsRes.rows) {
            const qRes = await pool.query("SELECT * FROM questions WHERE round_id = $1", [round.id]);
            console.log(`Round ${round.round_number} has ${qRes.rows.length} questions.`);
        }

    } catch (error) {
        console.error("Test Failed:", error);
    } finally {
        await pool.end();
    }
}

testSubmission();
