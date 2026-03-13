const { pool } = require('../config/database');

/**
 * Experience Access Model
 * Stores student emails allowed to submit experiences.
 */
class ExperienceAccess {
  static tableEnsured = false;

  static async ensureTable() {
    if (this.tableEnsured) return;

    const query = `
      CREATE TABLE IF NOT EXISTS experience_access_students (
        id SERIAL PRIMARY KEY,
        roll_number VARCHAR(50) UNIQUE,
        email VARCHAR(150),
        student_name VARCHAR(150),
        company_name VARCHAR(255),
        is_active BOOLEAN DEFAULT TRUE,
        created_by INT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE experience_access_students
        ADD COLUMN IF NOT EXISTS email VARCHAR(150);

      ALTER TABLE experience_access_students
        ALTER COLUMN roll_number DROP NOT NULL;

      ALTER TABLE experience_access_students
        ALTER COLUMN student_name DROP NOT NULL;

      ALTER TABLE experience_access_students
        ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);

      CREATE INDEX IF NOT EXISTS idx_experience_access_roll_number
      ON experience_access_students (roll_number);

      CREATE UNIQUE INDEX IF NOT EXISTS idx_experience_access_email
      ON experience_access_students (email);
    `;

    await pool.query(query);
    this.tableEnsured = true;
  }

  static async list(search = '') {
    await this.ensureTable();

    const trimmedSearch = (search || '').trim();
    if (!trimmedSearch) {
      const result = await pool.query(
        `SELECT eas.id,
                eas.roll_number,
                eas.email,
                COALESCE(eas.student_name, NULLIF(CONCAT_WS(' ', u.first_name, u.last_name), '')) AS student_name,
                eas.company_name,
                eas.is_active,
                eas.created_at
         FROM experience_access_students eas
         LEFT JOIN users u ON LOWER(u.email) = LOWER(eas.email)
         ORDER BY created_at DESC`
      );
      return result.rows;
    }

    const likeTerm = `%${trimmedSearch}%`;
    const result = await pool.query(
      `SELECT eas.id,
              eas.roll_number,
              eas.email,
              COALESCE(eas.student_name, NULLIF(CONCAT_WS(' ', u.first_name, u.last_name), '')) AS student_name,
              eas.company_name,
              eas.is_active,
              eas.created_at
       FROM experience_access_students eas
       LEFT JOIN users u ON LOWER(u.email) = LOWER(eas.email)
       WHERE eas.roll_number ILIKE $1 OR eas.email ILIKE $1 OR eas.student_name ILIKE $1
       ORDER BY created_at DESC`,
      [likeTerm]
    );
    return result.rows;
  }

  static async upsert(rollNumber, studentName, email, companyName, createdBy) {
    await this.ensureTable();

    let result;

    if (email) {
      result = await pool.query(
        `INSERT INTO experience_access_students (email, roll_number, student_name, company_name, is_active, created_by, created_at, updated_at)
         VALUES ($1, $2, $3, $4, TRUE, $5, NOW(), NOW())
         ON CONFLICT (email)
         DO UPDATE SET
           roll_number = COALESCE(EXCLUDED.roll_number, experience_access_students.roll_number),
           student_name = COALESCE(EXCLUDED.student_name, experience_access_students.student_name),
           company_name = COALESCE(EXCLUDED.company_name, experience_access_students.company_name),
           is_active = TRUE,
           updated_at = NOW()
         RETURNING id, roll_number, email, student_name, company_name, is_active, created_at`,
        [email, rollNumber || null, studentName || null, companyName || null, createdBy]
      );
    } else {
      result = await pool.query(
        `INSERT INTO experience_access_students (roll_number, student_name, company_name, is_active, created_by, created_at, updated_at)
         VALUES ($1, $2, $3, TRUE, $4, NOW(), NOW())
         ON CONFLICT (roll_number)
         DO UPDATE SET
           student_name = COALESCE(EXCLUDED.student_name, experience_access_students.student_name),
           company_name = COALESCE(EXCLUDED.company_name, experience_access_students.company_name),
           is_active = TRUE,
           updated_at = NOW()
         RETURNING id, roll_number, email, student_name, company_name, is_active, created_at`,
        [rollNumber, studentName || null, companyName || null, createdBy]
      );
    }

    return result.rows[0];
  }

  static async remove(id) {
    await this.ensureTable();

    const result = await pool.query(
      'DELETE FROM experience_access_students WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0] || null;
  }

  static async hasActiveRollNumber(rollNumber) {
    await this.ensureTable();

    const result = await pool.query(
      `SELECT id
       FROM experience_access_students
       WHERE LOWER(roll_number) = LOWER($1) AND is_active = TRUE
       LIMIT 1`,
      [rollNumber]
    );

    return result.rows.length > 0;
  }

  static async hasActiveEmail(email) {
    await this.ensureTable();

    const result = await pool.query(
      `SELECT id
       FROM experience_access_students
       WHERE LOWER(email) = LOWER($1) AND is_active = TRUE
       LIMIT 1`,
      [email]
    );

    return result.rows.length > 0;
  }
}

module.exports = ExperienceAccess;
