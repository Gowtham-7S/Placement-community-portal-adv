const express = require('express');
const { pool } = require('../config/database');

const router = express.Router();

/**
 * Public Routes (No Authentication Required)
 */

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running now',
    timestamp: new Date().toISOString(),
  });
});

// GET /api/public/companies — paginated, active companies only
router.get('/companies', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = (page - 1) * limit;

    const [data, count] = await Promise.all([
      pool.query(
        `SELECT id, name, industry, headquarters, website, company_size, founded_year
         FROM companies WHERE is_active = true ORDER BY name ASC LIMIT $1 OFFSET $2`,
        [limit, offset]
      ),
      pool.query(`SELECT COUNT(*) FROM companies WHERE is_active = true`),
    ]);

    res.status(200).json({
      success: true,
      data: data.rows,
      total: parseInt(count.rows[0].count),
      page,
      limit,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/public/statistics — aggregate placement stats (no PII)
router.get('/statistics', async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM companies WHERE is_active = true) AS total_companies,
        (SELECT COUNT(*) FROM drives WHERE drive_status IN ('upcoming','ongoing')) AS active_drives,
        (SELECT COUNT(*) FROM experiences WHERE approval_status = 'accepted') AS total_experiences,
        (SELECT COUNT(*) FROM experiences WHERE approval_status = 'accepted' AND result = 'pass') AS total_selections,
        (SELECT ROUND(AVG(ctc_offered)::numeric, 2) FROM experiences WHERE approval_status = 'accepted' AND ctc_offered IS NOT NULL) AS avg_ctc
    `);
    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
