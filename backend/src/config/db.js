const mysql = require('mysql2/promise');
const config = require('./env');

const pool = mysql.createPool({
  host: config.DB_HOST,
  port: config.DB_PORT,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  database: config.DB_NAME,
  waitForConnections: true,
  connectionLimit: config.DB_CONNECTION_LIMIT,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  dateStrings: true // Preserve ISO strings for timestamps
});

/**
 * Convenience query wrapper
 * @param {string} sql 
 * @param {Array} params 
 * @returns {Promise<Array>} [rows, fields]
 */
async function query(sql, params = []) {
  return await pool.query(sql, params);
}

/**
 * Health check connection tester
 */
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    return { ok: true, message: 'Database connected successfully' };
  } catch (error) {
    return { ok: false, message: error.message };
  }
}

module.exports = {
  pool,
  query,
  testConnection
};

