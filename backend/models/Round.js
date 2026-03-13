const { pool } = require('../config/database');

/**
 * Round Model
 */
class Round {
    static async create(roundData, client = pool) {
        try {
            const {
                experienceId, roundNumber, roundType, durationMinutes, result,
                roundDate, topics, questions, difficultyLevel,
                problemStatement, approachUsed, codeSnippet,
                tipsAndInsights, interviewerFeedback, skillsTested,
            } = roundData;

            const query = `
        INSERT INTO rounds (
          experience_id, round_number, round_type, duration_minutes, result,
          round_date, topics, questions, difficulty_level,
          problem_statement, approach_used, code_snippet,
          tips_and_insights, interviewer_feedback, skills_tested,
          created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
        RETURNING id
      `;

            const queryResult = await client.query(query, [
                experienceId, roundNumber, roundType, durationMinutes, result || 'not_evaluated',
                roundDate, JSON.stringify(topics || []), JSON.stringify(questions || []), difficultyLevel || 'medium',
                problemStatement, approachUsed, codeSnippet,
                tipsAndInsights, interviewerFeedback, JSON.stringify(skillsTested || []),
            ]);

            return queryResult.rows[0];
        } catch (error) {
            throw new Error(`Error creating round: ${error.message}`);
        }
    }
}

module.exports = Round;
