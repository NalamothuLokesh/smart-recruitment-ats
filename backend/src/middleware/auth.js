const jwt = require('jsonwebtoken');
const config = require('../config/env');
const db = require('../config/db');

/**
 * Authentication Middleware
 * Validates JWT in Authorization: Bearer <token>
 * Attaches active user record to req.user
 */
async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token is required.'
      });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, config.JWT_SECRET);
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired authentication token.'
      });
    }

    // Verify user exists and is active in database
    const [users] = await db.query(
      'SELECT id, org_id, full_name, email, role, is_active FROM users WHERE id = ? LIMIT 1',
      [decoded.id]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User belonging to this token no longer exists.'
      });
    }

    const user = users[0];
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact an administrator.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Role-Based Access Control (RBAC) Middleware
 * @param  {...string} roles Allowed roles ('ADMIN', 'HR', 'CANDIDATE')
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required prior to authorization check.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access requires one of [${roles.join(', ')}] roles. Your role is '${req.user.role}'.`
      });
    }

    next();
  };
}

/**
 * Optional Authentication Middleware
 * If valid Bearer token provided, populates req.user.
 * Does not block if token is missing.
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, config.JWT_SECRET);
        const [users] = await db.query(
          'SELECT id, org_id, full_name, email, role, is_active FROM users WHERE id = ? LIMIT 1',
          [decoded.id]
        );
        if (users.length > 0 && users[0].is_active) {
          req.user = users[0];
        }
      } catch (e) {
        // Ignore invalid token for optional endpoints
      }
    }
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  requireAuth,
  requireRole,
  optionalAuth
};

