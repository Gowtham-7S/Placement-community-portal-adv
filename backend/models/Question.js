const { pool } = require('../config/database');

/**
 * Question Model
 */
class Question {
    static async create(questionData, client = pool) {
        try {
            const {
                roundId, questionText, category, subcategory, difficulty,
                answerProvided, answerQuality, isCommon,
            } = questionData;

            const query = `
        INSERT INTO questions (
          round_id, question_text, category, subcategory, difficulty,
          answer_provided, answer_quality, is_common, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        RETURNING id
      `;

            const result = await client.query(query, [
                roundId, questionText, category, subcategory, difficulty || 'medium',
                answerProvided, answerQuality || 'good', isCommon || false,
            ]);

            return result.rows[0];
        } catch (error) {
            throw new Error(`Error creating question: ${error.message}`);
        }
    }
}

module.exports = Question;
