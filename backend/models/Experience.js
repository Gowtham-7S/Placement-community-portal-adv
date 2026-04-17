const { pool } = require('../config/database');

/**
 * Experience Model
 */
const toConsonantSignature = (value = '') => {
  const cleaned = String(value).toLowerCase().replace(/[^a-z]/g, '');
  if (!cleaned) return '';

  const first = cleaned[0];
  const restWithoutVowels = cleaned.slice(1).replace(/[aeiou]/g, '');
  const combined = `${first}${restWithoutVowels}`;

  return combined.replace(/(.)\1+/g, '$1');
};

const phoneticExpr = (fieldSql) => `
  LOWER(
    REGEXP_REPLACE(
      LEFT(REGEXP_REPLACE(COALESCE(${fieldSql}, ''), '[^a-zA-Z]', '', 'g'), 1) ||
      REGEXP_REPLACE(
        SUBSTRING(REGEXP_REPLACE(COALESCE(${fieldSql}, ''), '[^a-zA-Z]', '', 'g') FROM 2),
        '[aeiouAEIOU]',
        '',
        'g'
      ),
      '(.)\\1+',
      '\\1',
      'g'
    )
  )
`;

class Experience {
  static async findById(id) {
    try {
      const query = `
        SELECT id, user_id, drive_id, company_name, role_applied, result, selected, 
               offer_received, ctc_offered, is_anonymous, approval_status, submitted_at, 
               approved_at, created_at
        FROM experiences WHERE id = $1
      `;
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error finding experience: ${error.message}`);
    }
  }

  static async countByDriveId(driveId) {
    try {
      const query = 'SELECT COUNT(*) as total FROM experiences WHERE drive_id = $1';
      const result = await pool.query(query, [driveId]);
      return parseInt(result.rows[0].total) || 0;
    } catch (error) {
      throw new Error(`Error counting experiences by drive: ${error.message}`);
    }
  }

  static async findByUserAndDrive(userId, driveId) {
    try {
      if (!driveId) return null;
      const query = 'SELECT id FROM experiences WHERE user_id = $1 AND drive_id = $2 LIMIT 1';
      const result = await pool.query(query, [userId, driveId]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error checking duplicate experience: ${error.message}`);
    }
  }

  static async create(experienceData, client = pool) {
    try {
      const {
        userId, driveId, companyName, roleApplied, result: interviewResult, offerReceived, ctcOffered, isAnonymous,
        interviewDuration, overallDifficulty, overallFeedback, confidenceLevel
      } = experienceData;

      const query = `
        INSERT INTO experiences (
          user_id, drive_id, company_name, role_applied, result, 
          offer_received, ctc_offered, is_anonymous, approval_status, 
          interview_duration, overall_difficulty, overall_feedback, confidence_level,
          submitted_at, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9, $10, $11, $12, NOW(), NOW(), NOW())
        RETURNING id, company_name, role_applied, approval_status, submitted_at
      `;

      const result = await client.query(query, [
        userId, driveId, companyName, roleApplied, interviewResult,
        offerReceived || false, ctcOffered || null, isAnonymous || false,
        interviewDuration, overallDifficulty, overallFeedback, confidenceLevel
      ]);

      return result.rows[0];
    } catch (error) {
      throw new Error(`Error creating experience: ${error.message}`);
    }
  }

  static async getByUserId(userId, limit = 20, offset = 0) {
    try {
      const countQuery = 'SELECT COUNT(*) as total FROM experiences WHERE user_id = $1';
      const dataQuery = `
        SELECT id, company_name, role_applied, result, approval_status, submitted_at 
        FROM experiences WHERE user_id = $1 
        ORDER BY submitted_at DESC LIMIT $2 OFFSET $3
      `;

      const countResult = await pool.query(countQuery, [userId]);
      const dataResult = await pool.query(dataQuery, [userId, limit, offset]);

      return {
        total: parseInt(countResult.rows[0].total),
        data: dataResult.rows,
      };
    } catch (error) {
      throw new Error(`Error fetching experiences: ${error.message}`);
    }
  }

  static async getByApprovalStatus(status, limit = 20, offset = 0, filters = {}) {
    try {
      // null status means fetch all, otherwise filter by specific status
      const statusFilter = status ? 'WHERE approval_status = $1' : 'WHERE 1=1';
      const baseValues = status ? [status] : [];
      let paramIndex = status ? 2 : 1;
      console.log('Experience.getByApprovalStatus - status:', status, 'statusFilter:', statusFilter, 'baseValues:', baseValues, 'filters:', filters); // Debug log

      let countQuery = `SELECT COUNT(*) as total FROM experiences ${statusFilter}`;
      let dataQuery = `
        SELECT 
          e.id, e.user_id, e.company_name, e.role_applied, e.result, e.approval_status, e.submitted_at, 
          e.ctc_offered, e.interview_duration, e.overall_difficulty, e.overall_feedback, e.confidence_level,
          e.offer_received, e.is_anonymous, e.rejection_reason, e.admin_comments,
          u.first_name, u.last_name, u.register_number
        FROM experiences e
        LEFT JOIN users u ON e.user_id = u.id
        ${statusFilter}
      `;
      const countValues = [...baseValues];
      const values = [...baseValues];

      if (filters.company_name) {
        const searchTerm = filters.company_name.trim();
        if (searchTerm) {
          console.log('Applying search for term:', searchTerm); // Debug log
          // Split search term by spaces and search for each word
          const searchWords = searchTerm.split(/\s+/).filter(word => word.length > 0);
          console.log('Search words:', searchWords); // Debug log
          let searchConditions = '';
          
          for (const word of searchWords) {
            const fuzzyKey = toConsonantSignature(word);
            const likeParam = paramIndex;
            let fuzzyParam = null;

            if (fuzzyKey) {
              fuzzyParam = paramIndex + 1;
            }

            if (searchConditions) searchConditions += ' OR ';
            searchConditions += `(
              company_name ILIKE $${likeParam} OR
              u.first_name ILIKE $${likeParam} OR
              u.last_name ILIKE $${likeParam} OR
              u.register_number ILIKE $${likeParam} OR
              CONCAT(u.first_name, ' ', u.last_name) ILIKE $${likeParam}
              ${fuzzyParam ? ` OR ${phoneticExpr('u.first_name')} = $${fuzzyParam}
              OR ${phoneticExpr('u.last_name')} = $${fuzzyParam}
              OR ${phoneticExpr("CONCAT(u.first_name, ' ', u.last_name)")} = $${fuzzyParam}` : ''}
            )`;

            countValues.push(`%${word}%`);
            values.push(`%${word}%`);

            if (fuzzyParam) {
              countValues.push(fuzzyKey);
              values.push(fuzzyKey);
              paramIndex += 2;
            } else {
              paramIndex++;
            }
          }
          
          console.log('Search conditions:', searchConditions); // Debug log
          console.log('Values:', values); // Debug log
          countQuery += ` AND (${searchConditions})`;
          dataQuery += ` AND (${searchConditions})`;
        }
      }

      if (filters.date_from) {
        countQuery += ` AND submitted_at >= $${paramIndex}`;
        dataQuery += ` AND submitted_at >= $${paramIndex}`;
        countValues.push(filters.date_from);
        values.push(filters.date_from);
        paramIndex++;
      }

      if (filters.date_to) {
        countQuery += ` AND submitted_at <= $${paramIndex}`;
        dataQuery += ` AND submitted_at <= $${paramIndex}`;
        countValues.push(filters.date_to);
        values.push(filters.date_to);
        paramIndex++;
      }

      if (filters.ctc_min) {
        countQuery += ` AND ctc_offered >= $${paramIndex}`;
        dataQuery += ` AND ctc_offered >= $${paramIndex}`;
        countValues.push(filters.ctc_min);
        values.push(filters.ctc_min);
        paramIndex++;
      }

      dataQuery += ` ORDER BY submitted_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      values.push(limit, offset);

      const countResult = await pool.query(countQuery, countValues);
      const dataResult = await pool.query(dataQuery, values);

      return {
        total: parseInt(countResult.rows[0].total),
        data: dataResult.rows,
      };
    } catch (error) {
      throw new Error(`Error fetching experiences by status: ${error.message}`);
    }
  }

  static async updateApprovalStatus(id, status, approvedBy, comment = null) {
    try {
      const normalizedStatus = String(status || '').toLowerCase();
      const isRejected = normalizedStatus === 'rejected';
      const adminComment = isRejected ? null : (comment || null);
      const rejectionReason = isRejected ? (comment || null) : null;

      const query = `
        UPDATE experiences 
        SET approval_status = $1, approved_by = $2, approved_at = NOW(),
            admin_comments = $3, rejection_reason = $4, updated_at = NOW()
        WHERE id = $5
        RETURNING id, approval_status, approved_at
      `;

      const result = await pool.query(query, [status, approvedBy, adminComment, rejectionReason, id]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error updating approval status: ${error.message}`);
    }
  }

  static async update(id, updates) {
    try {
      const allowedFields = ['result', 'selected', 'offer_received', 'ctc_offered', 'overall_feedback', 'overall_difficulty', 'confidence_level'];
      const updateKeys = Object.keys(updates).filter((key) => allowedFields.includes(key));

      if (updateKeys.length === 0) return this.findById(id);

      let query = 'UPDATE experiences SET ';
      const values = [];
      let paramIndex = 1;

      updateKeys.forEach((key, index) => {
        query += `${key} = $${paramIndex}`;
        if (index < updateKeys.length - 1) query += ', ';
        values.push(updates[key]);
        paramIndex++;
      });

      query += ', updated_at = NOW() WHERE id = $' + paramIndex;
      values.push(id);
      query += ' RETURNING id, approval_status';

      const result = await pool.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error updating experience: ${error.message}`);
    }
  }

  static async delete(id) {
    try {
      const query = 'DELETE FROM experiences WHERE id = $1 RETURNING id';
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error deleting experience: ${error.message}`);
    }
  }

  static async getDetailedExperience(experienceId) {
    try {
      // Get experience with user details
      const experienceQuery = `
        SELECT 
          e.id, e.user_id, e.company_name, e.role_applied, e.result, e.approval_status, e.submitted_at, 
          e.ctc_offered, e.interview_duration, e.overall_difficulty, e.overall_feedback, e.confidence_level,
          e.offer_received, e.is_anonymous, e.rejection_reason, e.admin_comments,
          u.first_name, u.last_name, u.register_number
        FROM experiences e
        LEFT JOIN users u ON e.user_id = u.id
        WHERE e.id = $1
      `;
      const experienceResult = await pool.query(experienceQuery, [experienceId]);
      const experience = experienceResult.rows[0];

      if (!experience) return null;

      // Get rounds with questions
      const roundsQuery = `
        SELECT 
          r.id, r.round_number, r.round_type, r.duration_minutes, r.result, r.round_date,
          r.topics, r.questions, r.difficulty_level, r.problem_statement, r.approach_used,
          r.code_snippet, r.test_cases_passed, r.test_cases_total, r.tips_and_insights,
          r.common_mistakes, r.interviewer_feedback, r.interviewer_name, r.skills_tested,
          COALESCE(
            json_agg(
              json_build_object(
                'id', q.id,
                'question_text', q.question_text,
                'category', q.category,
                'subcategory', q.subcategory,
                'difficulty', q.difficulty,
                'answer_provided', q.answer_provided,
                'answer_quality', q.answer_quality,
                'is_common', q.is_common
              )
            ) FILTER (WHERE q.id IS NOT NULL),
            '[]'::json
          ) as detailed_questions
        FROM rounds r
        LEFT JOIN questions q ON r.id = q.round_id
        WHERE r.experience_id = $1
        GROUP BY r.id, r.round_number, r.round_type, r.duration_minutes, r.result, r.round_date,
                 r.topics, r.questions, r.difficulty_level, r.problem_statement, r.approach_used,
                 r.code_snippet, r.test_cases_passed, r.test_cases_total, r.tips_and_insights,
                 r.common_mistakes, r.interviewer_feedback, r.interviewer_name, r.skills_tested
        ORDER BY r.round_number
      `;
      const roundsResult = await pool.query(roundsQuery, [experienceId]);
      experience.rounds = roundsResult.rows;

      return experience;
    } catch (error) {
      throw new Error(`Error getting detailed experience: ${error.message}`);
    }
  }
}

module.exports = Experience;
