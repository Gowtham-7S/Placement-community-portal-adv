const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function findAdmin() {
    try {
        const res = await pool.query('SELECT email FROM users WHERE role = $1 LIMIT 1', ['admin']);
        console.log("Admin Email:", res.rows[0] ? res.rows[0].email : "None found");
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
findAdmin();
