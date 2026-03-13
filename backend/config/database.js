const { Pool } = require('pg');
require('dotenv').config();

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
};

const pool = new Pool(dbConfig);

// Log connection attempt details (hiding password) for debugging
console.log(`🔌 Database Config: ${dbConfig.user}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);

// Test the connection
pool.on('connect', () => {
  console.log('✅ Database connection pool established');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
});

// Function to execute queries
const query = (text, params) => {
  const start = Date.now();
  return pool.query(text, params).then((res) => {
    const duration = Date.now() - start;
    console.log(`Executed query (${duration}ms)`, { text, params });
    return res;
  });
};

// Initialize database - create tables if not exist
const initializeDatabase = async () => {
  try {
    console.log('Initializing database...');
    
    // Tables will be created separately via migrations or SQL scripts
    console.log('✅ Database initialization complete');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
};

module.exports = {
  pool,
  query,
  initializeDatabase,
};
