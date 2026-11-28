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

      // Ensure upload directories have valid sample PDFs for demo resumes
      const uploadDirs = [
        path.resolve(__dirname, '../../backend/uploads'),
        path.resolve(__dirname, '../../uploads')
      ];

      function buildPdf(name, title) {
        const stream = 'BT\n/F1 20 Tf\n50 720 Td\n(' + name + ' - ' + title + ') Tj\n/F1 12 Tf\n0 -30 Td\n(ATS Sample Candidate Profile & Resume) Tj\n0 -25 Td\n(Skills: React, Node.js, TypeScript, Cloud Architecture, CI/CD) Tj\n0 -20 Td\n(Experience: 5+ years of verified software development) Tj\nET';
        const len = Buffer.byteLength(stream);
        const body = '%PDF-1.4\n1 0 obj\n<</Type/Catalog/Pages 2 0 R>>\nendobj\n2 0 obj\n<</Type/Pages/Kids[3 0 R]/Count 1>>\nendobj\n3 0 obj\n<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>\nendobj\n4 0 obj\n<</Length ' + len + '>>\nstream\n' + stream + '\nendstream\nendobj\n5 0 obj\n<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>\nendobj\n';
        const xOffset = Buffer.byteLength(body);
        return body + 'xref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000056 00000 n \n0000000111 00000 n \n0000000236 00000 n \n0000000287 00000 n \ntrailer\n<</Size 6/Root 1 0 R>>\nstartxref\n' + xOffset + '\n%%EOF\n';
      }

      const sampleFiles = [
        { file: 'resume_3_1705000000001.pdf', name: 'Alex Rivera', title: 'Senior Full Stack Engineer' },
        { file: 'resume_4_1705000000002.pdf', name: 'Elena Rostova', title: 'Lead Cloud DevOps Architect' },
        { file: 'resume_5_1705000000003.pdf', name: 'Marcus Chen', title: 'Product Designer (UI/UX)' },
        { file: 'resume_6_1705000000004.pdf', name: 'Priya Sharma', title: 'Senior Backend Engineer' }
      ];

      for (const dir of uploadDirs) {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        for (const s of sampleFiles) {
          const filePath = path.join(dir, s.file);
          if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, buildPdf(s.name, s.title));
          }
        }
      }
      console.log('📄 Sample candidate resume PDFs verified in server uploads.');
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

