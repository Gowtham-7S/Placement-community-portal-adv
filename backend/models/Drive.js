const { pool } = require('../config/database');

/**
 * Drive Model
 */
class Drive {
  static async findBatchByValue(batch) {
    try {
      const result = await pool.query(
        'SELECT id, batch, is_active, created_at, updated_at FROM drive_batches WHERE batch = $1',
        [batch]
      );
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error finding drive batch: ${error.message}`);
    }
  }

  static async createBatch(batch) {
    try {
      const result = await pool.query(
        `INSERT INTO drive_batches (batch, is_active, created_at, updated_at)
         VALUES ($1, TRUE, NOW(), NOW())
         RETURNING id, batch, is_active, created_at, updated_at`,
        [batch]
      );
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error creating drive batch: ${error.message}`);
    }
  }

  static async reactivateBatch(id) {
    try {
      const result = await pool.query(
        `UPDATE drive_batches
         SET is_active = TRUE, updated_at = NOW()
         WHERE id = $1
         RETURNING id, batch, is_active, created_at, updated_at`,
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error reactivating drive batch: ${error.message}`);
    }
  }

  static async getBatchOptions() {
    try {
      const query = `
        SELECT
          db.id,
          db.batch,
          db.is_active,
          COUNT(d.id)::int AS drive_count
        FROM drive_batches db
        LEFT JOIN drives d
          ON TRIM(COALESCE(d.batch, d.eligible_batches, '')) = db.batch
        WHERE db.is_active = TRUE
        GROUP BY db.id, db.batch, db.is_active
        ORDER BY db.batch ASC
      `;

      const result = await pool.query(query);
      return result.rows.map((row) => ({
        id: row.id,
        batch: row.batch,
        is_active: row.is_active,
        drive_count: Number(row.drive_count || 0),
      }));
    } catch (error) {
      throw new Error(`Error fetching drive batches: ${error.message}`);
    }
  }

  static async findById(id) {
    try {
      const query = `
        SELECT d.id, d.company_id, c.name as company_name, d.role_name, d.ctc,
               d.interview_date, d.registration_deadline, d.total_positions, d.filled_positions,
               d.round_count, d.drive_status, d.requirements, d.batch, d.eligible_batches, d.location,
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
        total_positions, round_count, requirements, batch, eligible_batches, location, mode, drive_status
      } = driveData;

      const query = `
        INSERT INTO drives (company_id, role_name, ctc, interview_date, 
                          registration_deadline, total_positions, round_count, 
                          requirements, batch, eligible_batches, location, mode, drive_status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
        RETURNING id, company_id, role_name, batch, interview_date, drive_status
      `;

      const result = await client.query(query, [
        company_id, role_name, ctc || null, interview_date,
        registration_deadline || null, total_positions || null, round_count || null,
        requirements || null, batch, eligible_batches || null, location || null, mode || 'online',
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
        'batch',
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
      const scheduleStartExpr = `COALESCE(MIN(dr.expected_date), d.interview_date)`;
      const scheduleEndExpr = `COALESCE(MAX(dr.expected_date), d.interview_date)`;

      let query = `
        SELECT d.id, d.company_id, c.name as company_name, d.role_name, d.ctc,
               d.interview_date, d.drive_status, d.filled_positions, d.total_positions, d.mode, d.created_at,
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
        query += ` AND TRIM(COALESCE(d.batch, d.eligible_batches, '')) = $${paramIndex}`;
        values.push(filters.batch);
        paramIndex++;
      }

      query += ` GROUP BY d.id, c.name`;

      const havingClauses = [];

      if (filters.date_from) {
        havingClauses.push(`${scheduleEndExpr} >= $${paramIndex}`);
        values.push(filters.date_from);
        paramIndex++;
      }

      if (filters.date_to) {
        havingClauses.push(`${scheduleStartExpr} <= $${paramIndex}`);
        values.push(filters.date_to);
        paramIndex++;
      }

      if (filters.status) {
        havingClauses.push(`${statusCase} = $${paramIndex}`);
        values.push(filters.status);
        paramIndex++;
      }

      if (havingClauses.length > 0) {
        query += ` HAVING ${havingClauses.join(' AND ')}`;
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
        countQuery += ` AND TRIM(COALESCE(d.batch, d.eligible_batches, '')) = $${countParamIndex}`;
        countValues.push(filters.batch);
        countParamIndex++;
      }

      countQuery += ` GROUP BY d.id`;

      const countHavingClauses = [];

      if (filters.date_from) {
        countHavingClauses.push(`${scheduleEndExpr} >= $${countParamIndex}`);
        countValues.push(filters.date_from);
        countParamIndex++;
      }

      if (filters.date_to) {
        countHavingClauses.push(`${scheduleStartExpr} <= $${countParamIndex}`);
        countValues.push(filters.date_to);
        countParamIndex++;
      }

      if (filters.status) {
        countHavingClauses.push(`${statusCase} = $${countParamIndex}`);
        countValues.push(filters.status);
        countParamIndex++;
      }

      if (countHavingClauses.length > 0) {
        countQuery += ` HAVING ${countHavingClauses.join(' AND ')}`;
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
