const { pool } = require('../config/database');

/**
 * Company Model
 */
class Company {
  static async ensureBatchSchema() {
    try {
      await pool.query(`
        ALTER TABLE companies
        ADD COLUMN IF NOT EXISTS batch VARCHAR(9)
      `);

      await pool.query(`
        UPDATE companies
        SET batch = '2023-2027'
        WHERE batch IS NULL
      `);

      await pool.query(`
        ALTER TABLE companies
        ALTER COLUMN batch SET NOT NULL
      `);

      await pool.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1
            FROM pg_constraint
            WHERE conname = 'companies_name_batch_unique'
          ) THEN
            ALTER TABLE companies
            ADD CONSTRAINT companies_name_batch_unique UNIQUE (name, batch);
          END IF;
        END $$;
      `);

      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_companies_batch
        ON companies(batch)
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS company_batches (
          id SERIAL PRIMARY KEY,
          batch VARCHAR(9) UNIQUE NOT NULL,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_company_batches_batch
        ON company_batches(batch)
      `);

      await pool.query(`
        INSERT INTO company_batches (batch)
        SELECT DISTINCT batch
        FROM companies
        WHERE batch IS NOT NULL
        ON CONFLICT (batch) DO NOTHING
      `);
    } catch (error) {
      throw new Error(`Error ensuring company batch schema: ${error.message}`);
    }
  }

  static async findBatchByValue(batch) {
    try {
      await this.ensureBatchSchema();
      const result = await pool.query(
        'SELECT id, batch, is_active, created_at, updated_at FROM company_batches WHERE batch = $1',
        [batch]
      );
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error finding company batch: ${error.message}`);
    }
  }

  static async createBatch(batch) {
    try {
      await this.ensureBatchSchema();
      const result = await pool.query(
        `INSERT INTO company_batches (batch, is_active, created_at, updated_at)
         VALUES ($1, true, NOW(), NOW())
         RETURNING id, batch, is_active, created_at, updated_at`,
        [batch]
      );
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error creating company batch: ${error.message}`);
    }
  }

  static async reactivateBatch(id) {
    try {
      await this.ensureBatchSchema();
      const result = await pool.query(
        `UPDATE company_batches
         SET is_active = true, updated_at = NOW()
         WHERE id = $1
         RETURNING id, batch, is_active, created_at, updated_at`,
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error reactivating company batch: ${error.message}`);
    }
  }

  static async findById(id) {
    try {
      const query = `
        SELECT 
          c.id, c.name, c.batch, c.description, c.website, c.parent_org, c.overall_description,
          c.headquarters, c.industry, c.company_size, c.founded_year, c.total_employees,
          c.is_active, c.created_at, c.updated_at,
          jr.title AS job_title, jr.eligibility AS job_eligibility, jr.compensation AS job_compensation, jr.bonuses AS job_bonuses,
          i.duration AS internship_duration, i.schedule AS internship_schedule, i.stipend AS internship_stipend,
          sp.steps AS selection_steps,
          l.city AS location_city, l.address AS location_address
        FROM companies c
        LEFT JOIN company_job_roles jr ON jr.company_id = c.id
        LEFT JOIN company_internships i ON i.company_id = c.id
        LEFT JOIN company_selection_process sp ON sp.company_id = c.id
        LEFT JOIN company_locations l ON l.company_id = c.id
        WHERE c.id = $1
      `;
      const result = await pool.query(query, [id]);
      const row = result.rows[0] || null;
      if (!row) return null;

      return {
        id: row.id,
        name: row.name,
        batch: row.batch,
        description: row.description,
        website: row.website,
        parent_org: row.parent_org,
        overall_description: row.overall_description,
        headquarters: row.headquarters,
        industry: row.industry,
        company_size: row.company_size,
        founded_year: row.founded_year,
        total_employees: row.total_employees,
        is_active: row.is_active,
        created_at: row.created_at,
        updated_at: row.updated_at,
        job_role: {
          title: row.job_title,
          eligibility: row.job_eligibility,
          compensation: row.job_compensation,
          bonuses: row.job_bonuses,
        },
        internship: {
          duration: row.internship_duration,
          schedule: row.internship_schedule,
          stipend: row.internship_stipend,
        },
        selection_process: {
          steps: row.selection_steps,
        },
        location: {
          city: row.location_city,
          address: row.location_address,
        },
      };
    } catch (error) {
      throw new Error(`Error finding company: ${error.message}`);
    }
  }

  static async findByName(name, batch) {
    try {
      const query = `
        SELECT *
        FROM companies
        WHERE LOWER(name) = LOWER($1) AND batch = $2
      `;
      const result = await pool.query(query, [name, batch]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error finding company by name: ${error.message}`);
    }
  }

  static async create(companyData) {
    try {
      const {
        name, batch, description, website, parent_org, overall_description,
        headquarters, industry, company_size, founded_year, total_employees,
        job_role, internship, selection_process, location,
      } = companyData;

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const query = `
          INSERT INTO companies (
            name, batch, description, website, parent_org, overall_description,
            headquarters, industry, company_size, founded_year, total_employees, created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
          RETURNING id, name, batch, industry, created_at
        `;

        const result = await client.query(query, [
          name,
          batch,
          description || null,
          website || null,
          parent_org || null,
          overall_description || null,
          headquarters || null,
          industry || null,
          company_size || null,
          founded_year || null,
          total_employees || null,
        ]);

        const companyId = result.rows[0].id;

        if (job_role && Object.values(job_role).some((v) => v != null && String(v).trim() !== '')) {
          await client.query(
            `INSERT INTO company_job_roles (company_id, title, eligibility, compensation, bonuses, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
            [
              companyId,
              job_role.title || null,
              job_role.eligibility || null,
              job_role.compensation || null,
              job_role.bonuses || null,
            ]
          );
        }

        if (internship && Object.values(internship).some((v) => v != null && String(v).trim() !== '')) {
          await client.query(
            `INSERT INTO company_internships (company_id, duration, schedule, stipend, created_at, updated_at)
             VALUES ($1, $2, $3, $4, NOW(), NOW())`,
            [
              companyId,
              internship.duration || null,
              internship.schedule || null,
              internship.stipend || null,
            ]
          );
        }

        if (selection_process && Object.prototype.hasOwnProperty.call(selection_process, 'steps')) {
          const steps = Array.isArray(selection_process.steps)
            ? selection_process.steps
            : (selection_process.steps ? [selection_process.steps] : null);
          await client.query(
            `INSERT INTO company_selection_process (company_id, steps, created_at, updated_at)
             VALUES ($1, $2, NOW(), NOW())`,
            [companyId, steps ? JSON.stringify(steps) : null]
          );
        }

        if (location && Object.values(location).some((v) => v != null && String(v).trim() !== '')) {
          await client.query(
            `INSERT INTO company_locations (company_id, city, address, created_at, updated_at)
             VALUES ($1, $2, $3, NOW(), NOW())`,
            [
              companyId,
              location.city || null,
              location.address || null,
            ]
          );
        }

        await client.query('COMMIT');
        return result.rows[0];
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      throw new Error(`Error creating company: ${error.message}`);
    }
  }

  static async update(id, updates) {
    try {
      const allowedFields = [
        'name', 'description', 'website', 'parent_org', 'overall_description',
        'headquarters', 'industry', 'company_size', 'founded_year', 'total_employees', 'is_active', 'batch',
      ];
      const updateKeys = Object.keys(updates).filter((key) => allowedFields.includes(key));

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        let companyRow = null;
        if (updateKeys.length > 0) {
          let query = 'UPDATE companies SET ';
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
          query += ' RETURNING id, name, batch, industry, created_at, updated_at';

          const result = await client.query(query, values);
          companyRow = result.rows[0] || null;
        }

        if (updates.job_role) {
          await client.query(
            `INSERT INTO company_job_roles (company_id, title, eligibility, compensation, bonuses, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
             ON CONFLICT (company_id) DO UPDATE SET
               title = EXCLUDED.title,
               eligibility = EXCLUDED.eligibility,
               compensation = EXCLUDED.compensation,
               bonuses = EXCLUDED.bonuses,
               updated_at = NOW()`,
            [
              id,
              updates.job_role.title || null,
              updates.job_role.eligibility || null,
              updates.job_role.compensation || null,
              updates.job_role.bonuses || null,
            ]
          );
        }

        if (updates.internship) {
          await client.query(
            `INSERT INTO company_internships (company_id, duration, schedule, stipend, created_at, updated_at)
             VALUES ($1, $2, $3, $4, NOW(), NOW())
             ON CONFLICT (company_id) DO UPDATE SET
               duration = EXCLUDED.duration,
               schedule = EXCLUDED.schedule,
               stipend = EXCLUDED.stipend,
               updated_at = NOW()`,
            [
              id,
              updates.internship.duration || null,
              updates.internship.schedule || null,
              updates.internship.stipend || null,
            ]
          );
        }

        if (updates.selection_process && Object.prototype.hasOwnProperty.call(updates.selection_process, 'steps')) {
          const steps = Array.isArray(updates.selection_process.steps)
            ? updates.selection_process.steps
            : (updates.selection_process.steps ? [updates.selection_process.steps] : null);
          await client.query(
            `INSERT INTO company_selection_process (company_id, steps, created_at, updated_at)
             VALUES ($1, $2, NOW(), NOW())
             ON CONFLICT (company_id) DO UPDATE SET
               steps = EXCLUDED.steps,
               updated_at = NOW()`,
            [id, steps ? JSON.stringify(steps) : null]
          );
        }

        if (updates.location) {
          await client.query(
            `INSERT INTO company_locations (company_id, city, address, created_at, updated_at)
             VALUES ($1, $2, $3, NOW(), NOW())
             ON CONFLICT (company_id) DO UPDATE SET
               city = EXCLUDED.city,
               address = EXCLUDED.address,
               updated_at = NOW()`,
            [
              id,
              updates.location.city || null,
              updates.location.address || null,
            ]
          );
        }

        await client.query('COMMIT');
        return companyRow || (await this.findById(id));
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      throw new Error(`Error updating company: ${error.message}`);
    }
  }

  static async getAll(limit = 20, offset = 0, batch = null) {
    try {
      const filters = ['is_active = true'];
      const countParams = [];
      const dataParams = [];

      if (batch) {
        filters.push(`batch = $1`);
        countParams.push(batch);
        dataParams.push(batch);
      }

      const whereClause = filters.join(' AND ');
      const limitPlaceholder = dataParams.length + 1;
      const offsetPlaceholder = dataParams.length + 2;

      const countQuery = `SELECT COUNT(*) as total FROM companies WHERE ${whereClause}`;
      const dataQuery = `
        SELECT id, name, batch, description, industry, company_size, website, headquarters, parent_org, overall_description, created_at
        FROM companies
        WHERE ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${limitPlaceholder} OFFSET $${offsetPlaceholder}
      `;

      const countResult = await pool.query(countQuery, countParams);
      const dataResult = await pool.query(dataQuery, [...dataParams, limit, offset]);

      return {
        total: parseInt(countResult.rows[0].total),
        data: dataResult.rows,
      };
    } catch (error) {
      throw new Error(`Error fetching companies: ${error.message}`);
    }
  }

  static async delete(id) {
    try {
      const query = 'UPDATE companies SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id';
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error deleting company: ${error.message}`);
    }
  }

  static async getBatchOptions() {
    try {
      await this.ensureBatchSchema();
      const result = await pool.query(`
        SELECT
          cb.id,
          cb.batch,
          cb.is_active,
          COUNT(c.id)::int AS company_count
        FROM company_batches cb
        LEFT JOIN companies c
          ON c.batch = cb.batch
         AND c.is_active = true
        WHERE cb.is_active = true
        GROUP BY cb.id, cb.batch, cb.is_active
        ORDER BY cb.batch ASC
      `);

      return result.rows.map((row) => ({
        id: row.id,
        batch: row.batch,
        is_active: row.is_active,
        company_count: row.company_count,
      }));
    } catch (error) {
      throw new Error(`Error fetching company batches: ${error.message}`);
    }
  }
}

module.exports = Company;
