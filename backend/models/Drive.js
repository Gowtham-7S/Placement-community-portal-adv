const { pool } = require('../config/database');

/**
 * Drive Model
 */
class Drive {
  static async findById(id) {
    try {
      const query = `
        SELECT d.id, d.company_id, c.name as company_name, d.role_name, d.ctc,
               d.interview_date, d.registration_deadline, d.total_positions, d.filled_positions,
               d.round_count, d.drive_status, d.requirements, d.eligible_batches, d.location,
               d.mode, d.created_at,
               CASE
                 WHEN d.drive_status = 'cancelled' THEN 'cancelled'
                 WHEN MAX(dr.expected_date) IS NULL THEN
                   CASE
                     WHEN d.interview_date IS NULL THEN d.drive_status
                     WHEN d.interview_date < CURRENT_DATE THEN 'completed'
                     WHEN d.interview_date > CURRENT_DATE THEN 'upcoming'
                     ELSE 'ongoing'
                   END
                 WHEN MAX(dr.expected_date) < CURRENT_DATE THEN 'completed'
                 WHEN MIN(dr.expected_date) > CURRENT_DATE THEN 'upcoming'
                 ELSE 'ongoing'
               END AS computed_status,
               COALESCE(
                 json_agg(
                   json_build_object(
                     'id', dr.id,
                     'round_number', dr.round_number,
                     'round_name', dr.round_name,
                     'round_description', dr.round_description,
                     'mode', dr.mode,
                     'expected_date', dr.expected_date
                   ) ORDER BY dr.round_number
                 ) FILTER (WHERE dr.id IS NOT NULL),
                 '[]'::json
               ) AS rounds
        FROM drives d
        JOIN companies c ON d.company_id = c.id
        LEFT JOIN drive_rounds dr ON dr.drive_id = d.id
        WHERE d.id = $1
        GROUP BY d.id, c.name
      `;
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error finding drive: ${error.message}`);
    }
  }

  static async create(driveData, client = pool) {
    try {
      const {
        company_id, role_name, ctc, interview_date, registration_deadline,
        total_positions, round_count, requirements, eligible_batches, location, mode, drive_status
      } = driveData;

      const query = `
        INSERT INTO drives (company_id, role_name, ctc, interview_date, 
                          registration_deadline, total_positions, round_count, 
                          requirements, eligible_batches, location, mode, drive_status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
        RETURNING id, company_id, role_name, interview_date, drive_status
      `;

      const result = await client.query(query, [
        company_id, role_name, ctc || null, interview_date,
        registration_deadline || null, total_positions || null, round_count || null,
        requirements || null, eligible_batches || null, location || null, mode || 'online',
        drive_status || 'upcoming'
      ]);

      return result.rows[0];
    } catch (error) {
      throw new Error(`Error creating drive: ${error.message}`);
    }
  }

  static async getByCompanyId(companyId, limit = 20, offset = 0) {
    try {
      const countQuery = 'SELECT COUNT(*) as total FROM drives WHERE company_id = $1 AND drive_status != $2';
      const dataQuery = `
        SELECT id, company_id, role_name, ctc_min, ctc_max, interview_date, drive_status 
        FROM drives WHERE company_id = $1 AND drive_status != $2
        ORDER BY interview_date DESC LIMIT $3 OFFSET $4
      `;

      const countResult = await pool.query(countQuery, [companyId, 'cancelled']);
      const dataResult = await pool.query(dataQuery, [companyId, 'cancelled', limit, offset]);

      return {
        total: parseInt(countResult.rows[0].total),
        data: dataResult.rows,
      };
    } catch (error) {
      throw new Error(`Error fetching drives: ${error.message}`);
    }
  }

  static async getUpcoming(limit = 20, offset = 0) {
    try {
      const countQuery = 'SELECT COUNT(*) as total FROM drives WHERE drive_status IN ($1, $2)';
      const dataQuery = `
        SELECT id, company_id, role_name, ctc_min, ctc_max, interview_date, mode 
        FROM drives WHERE drive_status IN ($1, $2)
        ORDER BY interview_date ASC LIMIT $3 OFFSET $4
      `;

      const countResult = await pool.query(countQuery, ['upcoming', 'ongoing']);
      const dataResult = await pool.query(dataQuery, ['upcoming', 'ongoing', limit, offset]);

      return {
        total: parseInt(countResult.rows[0].total),
        data: dataResult.rows,
      };
    } catch (error) {
      throw new Error(`Error fetching upcoming drives: ${error.message}`);
    }
  }

  static async update(id, updates, client = pool) {
    try {
      const allowedFields = [
        'role_name',
        'ctc',
        'drive_status',
        'filled_positions',
        'total_positions',
        'requirements',
        'eligible_batches',
        'registration_deadline',
        'interview_date',
        'mode',
        'location',
        'round_count',
      ];
      const updateKeys = Object.keys(updates).filter((key) => allowedFields.includes(key));

      if (updateKeys.length === 0) return this.findById(id);

      let query = 'UPDATE drives SET ';
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
      query += ' RETURNING id, drive_status';

      const result = await client.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error updating drive: ${error.message}`);
    }
  }

  static async getAll(limit = 20, offset = 0, filters = {}) {
    try {
      const statusCase = `
        CASE
          WHEN d.drive_status = 'cancelled' THEN 'cancelled'
          WHEN MAX(dr.expected_date) IS NULL THEN
            CASE
              WHEN d.interview_date IS NULL THEN d.drive_status
              WHEN d.interview_date < CURRENT_DATE THEN 'completed'
              WHEN d.interview_date > CURRENT_DATE THEN 'upcoming'
              ELSE 'ongoing'
            END
          WHEN MAX(dr.expected_date) < CURRENT_DATE THEN 'completed'
          WHEN MIN(dr.expected_date) > CURRENT_DATE THEN 'upcoming'
          ELSE 'ongoing'
        END
      `;

      let query = `
        SELECT d.id, d.company_id, c.name as company_name, d.role_name, d.ctc,
               d.interview_date, d.drive_status, d.filled_positions, d.total_positions, d.created_at,
               ${statusCase} AS computed_status
        FROM drives d
        JOIN companies c ON d.company_id = c.id
        LEFT JOIN drive_rounds dr ON dr.drive_id = d.id
        WHERE 1=1
      `;
      const values = [];
      let paramIndex = 1;

      if (filters.company_id) {
        query += ` AND d.company_id = $${paramIndex}`;
        values.push(filters.company_id);
        paramIndex++;
      }

      if (filters.date_from) {
        query += ` AND d.interview_date >= $${paramIndex}`;
        values.push(filters.date_from);
        paramIndex++;
      }

      if (filters.date_to) {
        query += ` AND d.interview_date <= $${paramIndex}`;
        values.push(filters.date_to);
        paramIndex++;
      }

      if (filters.ctc_min) {
        query += ` AND d.ctc >= $${paramIndex}`;
        values.push(filters.ctc_min);
        paramIndex++;
      }

      if (filters.ctc_max) {
        query += ` AND d.ctc <= $${paramIndex}`;
        values.push(filters.ctc_max);
        paramIndex++;
      }

      if (filters.batch) {
        query += ` AND d.eligible_batches ILIKE $${paramIndex}`;
        values.push(`%${filters.batch}%`);
        paramIndex++;
      }

      query += ` GROUP BY d.id, c.name`;

      if (filters.status) {
        query += ` HAVING ${statusCase} = $${paramIndex}`;
        values.push(filters.status);
        paramIndex++;
      }

      query += ` ORDER BY d.interview_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      values.push(limit, offset);

      // Get total count for pagination
      let countQuery = `
        SELECT COUNT(*) as total
        FROM (
          SELECT d.id, ${statusCase} AS computed_status
          FROM drives d
          LEFT JOIN drive_rounds dr ON dr.drive_id = d.id
          WHERE 1=1
      `;
      const countValues = [];
      let countParamIndex = 1;

      if (filters.company_id) {
        countQuery += ` AND d.company_id = $${countParamIndex}`;
        countValues.push(filters.company_id);
        countParamIndex++;
      }

      if (filters.date_from) {
        countQuery += ` AND d.interview_date >= $${countParamIndex}`;
        countValues.push(filters.date_from);
        countParamIndex++;
      }

      if (filters.date_to) {
        countQuery += ` AND d.interview_date <= $${countParamIndex}`;
        countValues.push(filters.date_to);
        countParamIndex++;
      }

      if (filters.ctc_min) {
        countQuery += ` AND d.ctc >= $${countParamIndex}`;
        countValues.push(filters.ctc_min);
        countParamIndex++;
      }

      if (filters.ctc_max) {
        countQuery += ` AND d.ctc <= $${countParamIndex}`;
        countValues.push(filters.ctc_max);
        countParamIndex++;
      }

      if (filters.batch) {
        countQuery += ` AND d.eligible_batches ILIKE $${countParamIndex}`;
        countValues.push(`%${filters.batch}%`);
        countParamIndex++;
      }

      countQuery += ` GROUP BY d.id`;

      if (filters.status) {
        countQuery += ` HAVING ${statusCase} = $${countParamIndex}`;
        countValues.push(filters.status);
        countParamIndex++;
      }

      countQuery += `) AS derived`;

      const [dataResult, countResult] = await Promise.all([
        pool.query(query, values),
        pool.query(countQuery, countValues)
      ]);

      return {
        total: parseInt(countResult.rows[0].total),
        data: dataResult.rows,
      };
    } catch (error) {
      throw new Error(`Error fetching all drives: ${error.message}`);
    }
  }

  static async delete(id) {
    try {
      const query = 'DELETE FROM drives WHERE id = $1 RETURNING id';
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error deleting drive: ${error.message}`);
    }
  }
}

module.exports = Drive;
