const express = require('express');
const { body, param, query } = require('express-validator');
const interviewController = require('../controllers/interviewController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

/**
 * @route   POST /api/v1/interviews
 * @desc    Schedule interview for candidate
 * @access  HR, ADMIN
 */
router.post(
  '/',
  requireAuth,
  requireRole('HR', 'ADMIN'),
  [
    body('applicationId').isInt().withMessage('Application ID is required.'),
    body('scheduledAt').isISO8601().withMessage('Valid ISO 8601 scheduledAt timestamp is required.'),
    body('durationMinutes').optional().isInt({ min: 15, max: 240 }),
    body('meetingLink').trim().isURL().withMessage('Valid meeting link URL is required.'),
    validate
  ],
  interviewController.scheduleInterview
);

/**
 * @route   GET /api/v1/interviews
 * @desc    Role-scoped list of interviews
 * @access  CANDIDATE (own), HR, ADMIN
 */
router.get(
  '/',
  requireAuth,
  [
    query('status').optional().isIn(['SCHEDULED', 'RESCHEDULED', 'CANCELLED', 'COMPLETED']),
    query('applicationId').optional().isInt(),
    validate
  ],
  interviewController.listInterviews
);

/**
 * @route   PATCH /api/v1/interviews/:id
 * @desc    Update interview status, rating, or submit evaluation feedback
 * @access  HR, ADMIN
 */
router.patch(
  '/:id',
  requireAuth,
  requireRole('HR', 'ADMIN'),
  [
    param('id').isInt().withMessage('Interview ID must be an integer.'),
    body('status').optional().isIn(['SCHEDULED', 'RESCHEDULED', 'CANCELLED', 'COMPLETED']),
    body('feedbackNotes').optional().trim(),
    body('rating').optional().isInt({ min: 1, max: 5 }),
    body('scheduledAt').optional().isISO8601(),
    body('meetingLink').optional().trim().isURL(),
    validate
  ],
  interviewController.updateInterview
);

module.exports = router;

