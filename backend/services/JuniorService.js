const { pool } = require('../config/database');

class JuniorService {
    /**
     * Get approved experiences grouped by company with insights
     *
     * NOTE: Prior versions averaged ctc_offered values from experiences. 2026-03-04
     * the API now returns the CTC declared on the associated drive (max value if
     * multiple) under the `avg_ctc` field so juniors see the company-offered figure.
     */
    static async getCompanyInsights(limit = 20, offset = 0) {
        try {
            const query = `
        SELECT
          e.company_name,
          COUNT(*) AS total_submissions,
          COUNT(CASE WHEN e.result = 'pass' THEN 1 END) AS selections,
          ROUND(
            COUNT(CASE WHEN e.result = 'pass' THEN 1 END)::numeric / NULLIF(COUNT(*), 0) * 100, 1
          ) AS selection_rate,
          ROUND(AVG(e.confidence_level)::numeric, 1) AS avg_confidence,
          -- use the CTC value declared on the drive instead of averaging reported CTCs
          ROUND(MAX(d.ctc)::numeric, 2) AS avg_ctc,
          MAX(e.submitted_at) AS last_submission,
          json_agg(DISTINCT e.overall_difficulty) FILTER (WHERE e.overall_difficulty IS NOT NULL) AS difficulties
        FROM experiences e
        LEFT JOIN drives d ON e.drive_id = d.id
        WHERE e.approval_status = 'accepted'
        GROUP BY e.company_name
        ORDER BY total_submissions DESC
        LIMIT $1 OFFSET $2
      `;
            const countQuery = `
        SELECT COUNT(DISTINCT company_name) AS total
        FROM experiences WHERE approval_status = 'accepted'
      `;
            const [result, countResult] = await Promise.all([
                pool.query(query, [limit, offset]),
                pool.query(countQuery),
            ]);
            return {
                data: result.rows,
                total: parseInt(countResult.rows[0].total),
            };
        } catch (error) {
            throw new Error(`Error fetching company insights: ${error.message}`);
        }
    }

    /**
     * Get all public experiences for a specific company (approved + non-anonymous)
     */
    static async getExperiencesByCompany(companyName, limit = 20, offset = 0) {
        try {
            const query = `
        SELECT
          e.id, e.company_name, e.role_applied, e.result, e.overall_difficulty,
          e.overall_feedback, e.confidence_level, e.ctc_offered,
          e.interview_duration, e.submitted_at,
          CASE WHEN e.is_anonymous THEN 'Anonymous' ELSE u.first_name || ' ' || u.last_name END AS author,
          (
            SELECT json_agg(round_data ORDER BY (round_data->>'round_number')::int)
            FROM (
              SELECT json_build_object(
                'round_number', r.round_number,
                'round_type', r.round_type,
                'difficulty_level', r.difficulty_level,
                'duration_minutes', r.duration_minutes,
                'tips_and_insights', r.tips_and_insights,
                'topics', r.topics,
                'skills_tested', r.skills_tested,
                'questions_jsonb', r.questions,
                'questions', (
                  SELECT json_agg(json_build_object(
                    'question_text', q.question_text,
                    'category', q.category,
                    'difficulty', q.difficulty,
                    'answer_provided', q.answer_provided,
                    'is_common', q.is_common
                  ) ORDER BY q.id)
                  FROM questions q WHERE q.round_id = r.id
                )
              ) AS round_data
              FROM rounds r WHERE r.experience_id = e.id
            ) rd
          ) AS rounds
        FROM experiences e
        LEFT JOIN users u ON e.user_id = u.id
        WHERE e.approval_status = 'accepted'
          AND LOWER(e.company_name) = LOWER($1)
        ORDER BY e.submitted_at DESC
        LIMIT $2 OFFSET $3
      `;
            const countQuery = `
        SELECT COUNT(*) AS total FROM experiences
        WHERE approval_status = 'accepted' AND LOWER(company_name) = LOWER($1)
      `;
            const [result, countResult] = await Promise.all([
                pool.query(query, [companyName, limit, offset]),
                pool.query(countQuery, [companyName]),
            ]);
            return {
                data: result.rows,
                total: parseInt(countResult.rows[0].total),
            };
        } catch (error) {
            throw new Error(`Error fetching experiences for company: ${error.message}`);
        }
    }


    /**
     * Get overall approved placement statistics (safe for juniors to view)
     */
    static async getPublicStats() {
        try {
            const query = `
        SELECT
          (SELECT COUNT(*) FROM companies WHERE is_active = true) AS total_companies,
          (SELECT COUNT(*) FROM drives WHERE drive_status IN ('upcoming','ongoing')) AS active_drives,
          (SELECT COUNT(*) FROM experiences WHERE approval_status = 'accepted') AS total_experiences,
          (SELECT COUNT(*) FROM experiences WHERE approval_status = 'accepted' AND result = 'pass') AS total_selections,
          (SELECT ROUND(AVG(ctc_offered)::numeric, 2) FROM experiences WHERE approval_status = 'accepted' AND ctc_offered IS NOT NULL) AS avg_ctc
      `;
            const result = await pool.query(query);
            return result.rows[0];
        } catch (error) {
            throw new Error(`Error fetching public stats: ${error.message}`);
        }
    }

    /**
     * Get trending topics across approved experiences
     */
    static async getTrendingTopics(limit = 10) {
        try {
            const query = `
        SELECT topic, COUNT(*) AS frequency
        FROM (
          SELECT jsonb_array_elements_text(r.topics) AS topic
          FROM rounds r
          JOIN experiences e ON r.experience_id = e.id
          WHERE e.approval_status = 'accepted'
            AND r.topics IS NOT NULL
            AND jsonb_array_length(r.topics) > 0
        ) t
        GROUP BY topic
        ORDER BY frequency DESC
        LIMIT $1
      `;
            const result = await pool.query(query, [limit]);
            return result.rows;
        } catch (error) {
            throw new Error(`Error fetching trending topics: ${error.message}`);
        }
    }
}

module.exports = JuniorService;
