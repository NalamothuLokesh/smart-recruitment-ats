const app = require('./app');
const config = require('./config/env');
const db = require('./config/db');

async function startServer() {
  console.log('====================================================');
  console.log('🚀 Smart Recruitment & Applicant Tracking System (ATS)');
  console.log(`🌐 Environment: ${config.NODE_ENV}`);
  console.log('====================================================');

  // Verify database connectivity
  const dbStatus = await db.testConnection();
  if (dbStatus.ok) {
    console.log(`✅ [Database] ${dbStatus.message} (${config.DB_NAME} at ${config.DB_HOST}:${config.DB_PORT})`);
  } else {
    console.warn(`⚠️ [Database] Connection warning: ${dbStatus.message}`);
    console.warn('   Ensure MySQL is running and database is seeded using `npm run db:seed`.');
  }

  // Start HTTP Server
  const server = app.listen(config.PORT, () => {
    console.log(`🚀 [Server] Listening on http://localhost:${config.PORT}`);
    console.log(`📡 [API Base] http://localhost:${config.PORT}/api/v1`);
    console.log(`🔒 [Uploads] Stored securely at ${config.UPLOAD_DIR}`);
    console.log('====================================================');
  });

  // Graceful shutdown handling
  const shutdown = async (signal) => {
    console.log(`\n🛑 Received ${signal}. Gracefully shutting down...`);
    server.close(async () => {
      console.log('HTTP server closed.');
      try {
        await db.pool.end();
        console.log('Database connection pool terminated.');
      } catch (err) {
        console.error('Error closing database pool:', err.message);
      }
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer();

