const fs = require('fs');
const path = require('path');

async function runMigrations(connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const migrationsDirectory = path.resolve(__dirname, 'migrations');
  const migrations = fs.readdirSync(migrationsDirectory)
    .filter((filename) => /^\d+_[\w-]+\.sql$/i.test(filename))
    .sort();

  for (const filename of migrations) {
    const [applied] = await connection.query(
      'SELECT version FROM schema_migrations WHERE version = ? LIMIT 1',
      [filename]
    );
    if (applied.length > 0) continue;

    const sql = fs.readFileSync(path.join(migrationsDirectory, filename), 'utf8');
    await connection.query(sql);
    await connection.query('INSERT INTO schema_migrations (version) VALUES (?)', [filename]);
    console.log(`✅ Applied ${filename}`);
  }
}

module.exports = { runMigrations };
