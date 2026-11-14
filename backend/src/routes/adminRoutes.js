const express = require('express');
const { body, param, query } = require('express-validator');
const adminController = require('../controllers/adminController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

// Strict RBAC: All admin routes require ADMIN role
router.use(requireAuth, requireRole('ADMIN'));

/**
 * @route   GET /api/v1/admin/users
 * @desc    Paginated list of users
 * @access  ADMIN
 */
router.get(
  '/users',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('role').optional().isIn(['ADMIN', 'HR', 'CANDIDATE']),
    validate
  ],
  adminController.getUsers
);

/**
 * @route   POST /api/v1/admin/users
 * @desc    Provision internal HR or Admin account
 * @access  ADMIN
 */
router.post(
  '/users',
  [
    body('fullName').trim().notEmpty().withMessage('Full name is required.'),
    body('email').trim().isEmail().withMessage('Valid email is required.').normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
    body('role').isIn(['ADMIN', 'HR']).withMessage('Role must be ADMIN or HR.'),
    validate
  ],
  adminController.createUser
);

/**
 * @route   PATCH /api/v1/admin/users/:id/role
 * @desc    Change user authorization role
 * @access  ADMIN
 */
router.patch(
  '/users/:id/role',
  [
    param('id').isInt().withMessage('User ID must be an integer.'),
    body('role').isIn(['ADMIN', 'HR', 'CANDIDATE']).withMessage('Invalid role.'),
    validate
  ],
  adminController.updateUserRole
);

/**
 * @route   PATCH /api/v1/admin/users/:id/status
 * @desc    Activate or deactivate user account
 * @access  ADMIN
 */
router.patch(
  '/users/:id/status',
  [
    param('id').isInt().withMessage('User ID must be an integer.'),
    body('isActive').isBoolean().withMessage('isActive must be boolean.'),
    validate
  ],
  adminController.updateUserStatus
);

/**
 * @route   GET /api/v1/admin/audit-logs
 * @desc    System audit logs
 * @access  ADMIN
 */
router.get(
  '/audit-logs',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('applicationId').optional().isInt(),
    validate
  ],
  adminController.getAuditLogs
);

module.exports = router;

