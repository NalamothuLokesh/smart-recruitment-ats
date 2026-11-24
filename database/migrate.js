const mysql = require('../backend/node_modules/mysql2/promise');
const config = require('../backend/src/config/env');
const { runMigrations } = require('./migrationRunner');

async function migrate() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: config.DB_HOST,
      port: config.DB_PORT,
      user: config.DB_USER,
      password: config.DB_PASSWORD,
      database: config.DB_NAME,
      multipleStatements: true
    });
    await runMigrations(connection);
    console.log('✅ Database migrations are up to date.');
  } catch (error) {
    console.error('❌ Database migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    if (connection) await connection.end();
  }
}

if (require.main === module) {
  migrate();
}

module.exports = { migrate };
