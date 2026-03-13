#!/usr/bin/env node

/**
 * Test Database Connection
 * Tests if the database user exists and connection works
 */

const { Client } = require('pg');
require('dotenv').config();

async function testConnection() {
  const userClient = new Client({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME
  });

  try {
    console.log(`🔌 Testing connection to ${process.env.DB_NAME}...`);
    await userClient.connect();
    console.log('✅ Connection successful!');

    // Count tables
    const result = await userClient.query(`
      SELECT COUNT(*) as table_count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log(`📊 Database has ${result.rows[0].table_count} tables`);

    // List tables
    const tables = await userClient.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    if (tables.rows.length > 0) {
      console.log('📋 Tables found:');
      tables.rows.forEach(t => console.log(`   ✓ ${t.table_name}`));
    } else {
      console.log('⚠️  No tables found. Run: node scripts/init-db.js');
    }

    console.log('\n✨ Ready to start server: npm run dev');

  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.log('\n💡 To fix:');
    console.log('1. Ensure PostgreSQL is running');
    console.log('2. Check .env file has correct credentials:');
    console.log(`   DB_USER=${process.env.DB_USER}`);
    console.log(`   DB_PASSWORD=${process.env.DB_PASSWORD}`);
    console.log('3. User may not exist. Create it using pgAdmin or psql');
    process.exit(1);
  } finally {
    await userClient.end();
  }
}

testConnection();
