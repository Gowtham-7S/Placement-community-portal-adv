#!/usr/bin/env node

/**
 * Database Initialization Script
 * Initializes PostgreSQL database and schema for the application
 * Usage: node scripts/init-db.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: 'postgres', // Connect to default database first
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

const schemaPath = path.join(__dirname, '../setup_database.sql');

async function initializeDatabase() {
  const client = await pool.connect();

  try {
    console.log('🔄 Starting PostgreSQL database initialization...\n');

    // Step 1: Create database if not exists
    console.log('Step 1: Creating database (if not exists)...');
    try {
      await client.query(`CREATE DATABASE ${process.env.DB_NAME || 'placement_portal'}`);
      console.log('✅ Database created successfully\n');
    } catch (err) {
      if (err.code === '42P04') {
        console.log('✅ Database already exists\n');
      } else {
        throw err;
      }
    }

    // Step 2: Close current connection and reconnect to new database
    client.release();
    const appPool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'placement_portal',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
    });

    const appClient = await appPool.connect();

    // Step 3: Execute schema file
    console.log('Step 2: Creating tables and indexes...');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the entire schema as a single query
    // This ensures PL/pgSQL functions (using $$) are parsed correctly
    try {
      await appClient.query(schema);
    } catch (err) {
      // If tables already exist, this might fail. 
      // For a fresh init, this is fine.
      if (!err.message.includes('already exists')) {
        throw err;
      }
      console.log('⚠️  Note: Some objects may already exist.');
    }

    console.log('✅ Database schema created successfully\n');

    // Step 4: Verify tables
    console.log('Step 3: Verifying tables...');
    const result = await appClient.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    const tables = result.rows.map(r => r.table_name);
    console.log(`✅ Found ${tables.length} tables:`);
    tables.forEach(table => console.log(`   - ${table}`));

    // Step 5: Test connection
    console.log('\nStep 4: Testing database connection...');
    const testResult = await appClient.query('SELECT NOW()');
    console.log('✅ Database connection successful:', testResult.rows[0].now);

    // Step 6: Summary
    console.log('\n' + '='.repeat(50));
    console.log('✅ DATABASE INITIALIZATION COMPLETE');
    console.log('='.repeat(50));
    console.log('\nDatabase Details:');
    console.log(`  Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`  Port: ${process.env.DB_PORT || 5432}`);
    console.log(`  Database: ${process.env.DB_NAME || 'placement_portal'}`);
    console.log(`  User: ${process.env.DB_USER}`);
    console.log(`  Tables: ${tables.length}`);
    console.log('\nNext Steps:');
    console.log('  1. Start the server: npm run dev');
    console.log('  2. Test health check: curl http://localhost:5000/api/public/health');
    console.log('  3. Check API_ENDPOINTS.md for available endpoints');
    console.log('\n');

    appClient.release();
    await appPool.end();
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  }
}

// Run initialization
initializeDatabase().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
