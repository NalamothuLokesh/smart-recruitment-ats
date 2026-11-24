/**
 * Database Seed & Migration Runner
 * Applies numbered migrations, then resets data to seed_data.sql
 */

const fs = require('fs');
const path = require('path');

// Safe module resolution: load from root or fallback to backend/node_modules
function resolveModule(moduleName) {
  try {
    return require(moduleName);
  } catch (err) {
    const backendPath = path.resolve(__dirname, '../../backend/node_modules', moduleName);
    return require(backendPath);
  }
}

const mysql = resolveModule('mysql2/promise');
const dotenv = resolveModule('dotenv');
const { runMigrations } = require('../migrationRunner');

// Load environment variables from backend/.env or root .env
const envPaths = [
  path.resolve(__dirname, '../../backend/.env'),
  path.resolve(__dirname, '../../.env')
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'smart_ats_db',
  multipleStatements: true
};

async function runSeed() {
  console.log('====================================================');
  console.log('🔄 Smart ATS Database Migration & Seed Runner');
  console.log(`📡 Connecting to MySQL: ${config.user}@${config.host}:${config.port}`);
  console.log('====================================================');

  let connection;
  try {
    // 1. Connect without database to ensure database exists
    const rootConn = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      multipleStatements: true
    });

    console.log(`📁 Ensuring database '${config.database}' exists...`);
    await rootConn.query(
      `CREATE DATABASE IF NOT EXISTS \`${config.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    await rootConn.end();

    // 2. Connect to the target database
    connection = await mysql.createConnection(config);
    console.log(`✅ Connected to database '${config.database}'`);

    // 3. Apply schema migrations before seeding/resetting sample data.
    await runMigrations(connection);
    console.log('✅ Database schema is up to date.');

    // 4. Run seed data
    const seedPath = path.resolve(__dirname, 'seed_data.sql');
    if (fs.existsSync(seedPath)) {
      console.log('🌱 Seeding Synthetic ATS Data: seed_data.sql...');
      const seedSql = fs.readFileSync(seedPath, 'utf8');
      await connection.query(seedSql);
      console.log('✅ Database seeded successfully with demo accounts:');
      console.log('   - Admin:     admin@novatech.io       / Password123!');
      console.log('   - HR Lead:   hr@novatech.io          / Password123!');
      console.log('   - Candidate: alex.rivera@example.com / Password123!');
      console.log('   - Candidate: elena.rostova@example.com / Password123!');
      console.log('   - Candidate: marcus.chen@example.com  / Password123!');
      console.log('   - Candidate: priya.sharma@example.com / Password123!');
    } else {
      console.warn(`⚠️ Seed file not found at: ${seedPath}`);
    }

    console.log('====================================================');
    console.log('🎉 Database setup complete. Ready for API requests!');
    console.log('====================================================');
  } catch (error) {
    console.error('❌ Database migration/seed failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

if (require.main === module) {
  runSeed();
}

module.exports = { runSeed };

