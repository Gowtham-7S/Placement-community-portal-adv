const { pool } = require('../config/database');

/**
 * User Model
 * Handles all user-related database operations
 */
class User {
  static async findById(id) {
    try {
      const query = 'SELECT id, email, first_name, last_name, role, department, batch_year, register_number, is_anonymous, is_active, created_at FROM users WHERE id = $1';
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error finding user: ${error.message}`);
    }
  }

  static async findByEmail(email) {
    try {
      const query = 'SELECT * FROM users WHERE email = $1';
      const result = await pool.query(query, [email.toLowerCase()]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error finding user by email: ${error.message}`);
    }
  }

  static async create(userData) {
    try {
      const {
        email, passwordHash, firstName, lastName, role, phone, department, batchYear,
      } = userData;

      const query = `
        INSERT INTO users (email, password_hash, first_name, last_name, role, phone, department, batch_year, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING id, email, first_name, last_name, role, created_at
      `;

      const result = await pool.query(query, [
        email.toLowerCase(),
        passwordHash,
        firstName,
        lastName,
        role,
        phone || null,
        department || null,
        batchYear || null,
      ]);

      return result.rows[0];
    } catch (error) {
      throw new Error(`Error creating user: ${error.message}`);
    }
  }

  static async updateProfile(id, updates) {
    try {
      const allowedFields = ['first_name', 'last_name', 'phone', 'department', 'bio', 'profile_picture_url'];
      const updates_keys = Object.keys(updates).filter((key) => allowedFields.includes(key));

      if (updates_keys.length === 0) {
        return this.findById(id);
      }

      let query = 'UPDATE users SET ';
      const values = [];
      let paramIndex = 1;

      updates_keys.forEach((key, index) => {
        query += `${key} = $${paramIndex}`;
        if (index < updates_keys.length - 1) query += ', ';
        values.push(updates[key]);
        paramIndex++;
      });

      query += ', updated_at = NOW() WHERE id = $' + paramIndex;
      values.push(id);

      query += ' RETURNING id, email, first_name, last_name, role, created_at, updated_at';

      const result = await pool.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error updating user: ${error.message}`);
    }
  }

  static async getAllByRole(role, limit = 20, offset = 0) {
    try {
      const countQuery = 'SELECT COUNT(*) as total FROM users WHERE role = $1';
      const dataQuery = 'SELECT id, email, first_name, last_name, role, department, batch_year, created_at FROM users WHERE role = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3';

      const countResult = await pool.query(countQuery, [role]);
      const dataResult = await pool.query(dataQuery, [role, limit, offset]);

      return {
        total: parseInt(countResult.rows[0].total),
        data: dataResult.rows,
      };
    } catch (error) {
      throw new Error(`Error fetching users: ${error.message}`);
    }
  }

  static async updateLastLogin(id) {
    try {
      const query = 'UPDATE users SET last_login = NOW() WHERE id = $1 RETURNING last_login';
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error updating last login: ${error.message}`);
    }
  }
}

module.exports = User;
