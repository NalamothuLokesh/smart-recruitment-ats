const config = require('../config/env');

/**
 * 404 Route Not Found Handler
 */
function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.method} ${req.originalUrl}' does not exist.`
  });
}

/**
 * Centralized Global Error Handler
 */
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const isDevelopment = config.NODE_ENV === 'development';

  // Log server errors for internal monitoring
  if (statusCode >= 500) {
    console.error(`[ERROR] ${new Date().toISOString()} - ${req.method} ${req.originalUrl}:`, err);
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || 'An internal server error occurred.',
    ...(isDevelopment && { stack: err.stack, details: err })
  });
}

module.exports = {
  notFoundHandler,
  errorHandler
};

