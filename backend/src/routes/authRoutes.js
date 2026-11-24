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
    body('confirmPassword')
      .optional()
      .custom((value, { req }) => {
        if (value && value !== req.body.password) {
          throw new Error('Passwords do not match.');
        }
        return true;
      }),
    body('verificationCode').optional().trim(),
    body('phone').optional().trim(),
    body('experienceYears').optional().isNumeric().withMessage('Experience years must be a number.'),
    body('linkedinUrl').optional().trim().isURL().withMessage('LinkedIn URL must be valid.'),
    validate
  ],
  authController.register
);

/**
 * @route   POST /api/v1/auth/send-verification-otp
 * @desc    Send email verification OTP for registration
 * @access  Public
 */
router.post(
  '/send-verification-otp',
  [
    body('email').trim().isEmail().withMessage('Valid email is required.').normalizeEmail(),
    validate
  ],
  authController.sendVerificationOtp
);

/**
 * @route   POST /api/v1/auth/verify-pin
 * @desc    Verify email verification PIN
 * @access  Public
 */
router.post(
  '/verify-pin',
  [
    body('email').trim().isEmail().withMessage('Valid email is required.').normalizeEmail(),
    body('pin').trim().notEmpty().withMessage('PIN is required.').isLength({ min: 6, max: 6 }).withMessage('PIN must be 6 digits.'),
    validate
  ],
  authController.verifyPin
);

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Request password reset OTP code
 * @access  Public
 */
router.post(
  '/forgot-password',
  [
    body('email').trim().isEmail().withMessage('Valid email is required.').normalizeEmail(),
    validate
  ],
  authController.forgotPassword
);

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Verify OTP code and set new password
 * @access  Public
 */
router.post(
  '/reset-password',
  [
    body('email').trim().isEmail().withMessage('Valid email is required.').normalizeEmail(),
    body('otpCode').trim().notEmpty().withMessage('Verification code is required.').isLength({ min: 6, max: 6 }).withMessage('Verification code must be 6 digits.'),
    body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.'),
    body('confirmPassword')
      .notEmpty().withMessage('Confirm password is required.')
      .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
          throw new Error('New passwords do not match.');
        }
        return true;
      }),
    validate
  ],
  authController.resetPassword
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

