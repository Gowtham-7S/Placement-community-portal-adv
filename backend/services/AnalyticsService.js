const { pool } = require('../config/database');

class AnalyticsService {
    /**
     * Get overall dashboard statistics
     */
    static async getOverallStats() {
        try {
            const statsQuery = `
        SELECT
          (SELECT COUNT(*) FROM companies) as total_companies,
          (SELECT COUNT(*) FROM drives) as total_drives,
          (SELECT COUNT(*) FROM experiences) as total_experiences,
          (SELECT COUNT(*) FROM experiences WHERE result = 'pass') as total_selections,
          (SELECT AVG(ctc_offered) FROM experiences WHERE ctc_offered IS NOT NULL) as avg_ctc
      `;

            const result = await pool.query(statsQuery);
            return result.rows[0];
        } catch (error) {
            throw new Error(`Error getting overall stats: ${error.message}`);
        }
    }

    /**
     * Get company-wise placement stats
     */
    static async getCompanyStats() {
        try {
            const query = `
        SELECT 
          company_name, 
          COUNT(*) as total_submissions,
          COUNT(CASE WHEN result = 'pass' THEN 1 END) as selections,
          AVG(confidence_level) as avg_confidence
        FROM experiences
        GROUP BY company_name
        ORDER BY total_submissions DESC
        LIMIT 10
      `;
            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            throw new Error(`Error getting company stats: ${error.message}`);
        }
    }

    /**
     * Get recent activity
     */
    static async getRecentActivity() {
        try {
            const query = `
        SELECT e.id, e.company_name, e.role_applied, e.submitted_at, e.approval_status, u.first_name, u.last_name
        FROM experiences e
        JOIN users u ON e.user_id = u.id
        ORDER BY e.submitted_at DESC
        LIMIT 5
      `;
            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            throw new Error(`Error getting recent activity: ${error.message}`);
        }
    }
}

module.exports = AnalyticsService;
