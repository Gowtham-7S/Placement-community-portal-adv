#!/usr/bin/env node

/**
 * Database User Setup Script
 * Creates the placement_user with correct credentials
 */

const { Client } = require('pg');

async function setupDatabase() {
  // Connect as superuser first
  const adminClient = new Client({
    user: 'postgres',
    host: 'localhost',
    port: 5432,
    database: 'postgres'
  });

  try {
    console.log('🔌 Connecting as superuser...');
    await adminClient.connect();
    console.log('✅ Connected to PostgreSQL');

    // Drop user if exists
    console.log('🗑️  Dropping old user if exists...');
    await adminClient.query('DROP USER IF EXISTS placement_user;');

    // Create new user
    console.log('👤 Creating placement_user...');
    await adminClient.query("CREATE USER placement_user WITH PASSWORD 'password123';");
    console.log('✅ User created');

    // Grant privileges
    console.log('🔐 Granting privileges...');
    await adminClient.query('GRANT ALL PRIVILEGES ON DATABASE placement_portal TO placement_user;');
    await adminClient.query('ALTER USER placement_user CREATEDB;');
    console.log('✅ Privileges granted');

    // Verify connection
    console.log('✔️  Verifying connection...');
    const userClient = new Client({
      user: 'placement_user',
      password: 'password123',
      host: 'localhost',
      port: 5432,
      database: 'placement_portal'
    });
    await userClient.connect();
    const result = await userClient.query('SELECT 1;');
    console.log('✅ Connection verified:', result.rows);
    await userClient.end();

    console.log('\n✨ Database setup complete!');
    console.log('User: placement_user');
    console.log('Password: password123');
    console.log('\nUpdate your .env file with:');
    console.log('DB_PASSWORD=password123');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await adminClient.end();
  }
}

setupDatabase();
