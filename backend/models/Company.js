const { pool } = require('../config/database');

/**
 * Company Model
 */
class Company {
  static async findById(id) {
    try {
      const query = `
        SELECT id, name, description, website, headquarters, industry, 
               company_size, founded_year, total_employees, is_active, created_at, updated_at
        FROM companies WHERE id = $1
      `;
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error finding company: ${error.message}`);
    }
  }

  static async findByName(name) {
    try {
      const query = 'SELECT * FROM companies WHERE LOWER(name) = LOWER($1)';
      const result = await pool.query(query, [name]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error finding company by name: ${error.message}`);
    }
  }

  static async create(companyData) {
    try {
      const {
        name, description, website, headquarters, industry, company_size, founded_year, total_employees,
      } = companyData;

      const query = `
        INSERT INTO companies (name, description, website, headquarters, industry, company_size, founded_year, total_employees, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING id, name, industry, created_at
      `;

      const result = await pool.query(query, [
        name, description || null, website || null, headquarters || null,
        industry || null, company_size || null, founded_year || null, total_employees || null,
      ]);

      return result.rows[0];
    } catch (error) {
      throw new Error(`Error creating company: ${error.message}`);
    }
  }

  static async update(id, updates) {
    try {
      const allowedFields = ['name', 'description', 'website', 'headquarters', 'industry', 'company_size', 'founded_year', 'total_employees'];
      const updateKeys = Object.keys(updates).filter((key) => allowedFields.includes(key));

      if (updateKeys.length === 0) return this.findById(id);

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
      query += ' RETURNING id, name, industry, created_at, updated_at';

      const result = await pool.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error updating company: ${error.message}`);
    }
  }

  static async getAll(limit = 20, offset = 0) {
    try {
      const countQuery = 'SELECT COUNT(*) as total FROM companies WHERE is_active = true';
      const dataQuery = `
        SELECT id, name, description, industry, company_size, website, headquarters, created_at
        FROM companies
        WHERE is_active = true
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
      `;

      const countResult = await pool.query(countQuery);
      const dataResult = await pool.query(dataQuery, [limit, offset]);

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
}

module.exports = Company;
