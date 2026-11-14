const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Candidate self-registration
 * @access  Public
 */
router.post(
  '/register',
  [
    body('fullName').trim().notEmpty().withMessage('Full name is required.').isLength({ max: 150 }),
    body('email').trim().isEmail().withMessage('Valid email is required.').normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.'),
    body('phone').optional().trim(),
    body('experienceYears').optional().isNumeric().withMessage('Experience years must be a number.'),
    body('linkedinUrl').optional().trim().isURL().withMessage('LinkedIn URL must be valid.'),
    validate
  ],
  authController.register
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Authenticate user & return JWT token
 * @access  Public
 */
router.post(
  '/login',
  [
    body('email').trim().isEmail().withMessage('Valid email is required.').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required.'),
    validate
  ],
  authController.login
);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get currently logged in user context
 * @access  Authenticated (ADMIN, HR, CANDIDATE)
 */
router.get('/me', requireAuth, authController.getMe);

module.exports = router;

