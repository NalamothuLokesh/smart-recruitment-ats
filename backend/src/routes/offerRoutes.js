const express = require('express');
const { body, param } = require('express-validator');
const offerController = require('../controllers/offerController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

/**
 * @route   POST /api/v1/offers
 * @desc    Generate formal offer for a SELECTED candidate
 * @access  HR, ADMIN
 */
router.post(
  '/',
  requireAuth,
  requireRole('HR', 'ADMIN'),
  [
    body('applicationId').isInt().withMessage('Application ID is required.'),
    body('salaryOffered').isFloat({ min: 1000 }).withMessage('Valid salary amount is required.'),
    body('joiningDate').isDate().withMessage('Valid joiningDate (YYYY-MM-DD) is required.'),
    body('offerLetterContent').trim().notEmpty().withMessage('Offer letter content is required.'),
    body('status').optional().isIn(['DRAFT', 'ISSUED']),
    validate
  ],
  offerController.generateOffer
);

/**
 * @route   PATCH /api/v1/offers/:id/respond
 * @desc    Candidate accepts or declines the offer
 * @access  CANDIDATE
 */
router.patch(
  '/:id/respond',
  requireAuth,
  requireRole('CANDIDATE'),
  [
    param('id').isInt().withMessage('Offer ID must be an integer.'),
    body('decision').isIn(['ACCEPTED', 'DECLINED']).withMessage('Decision must be ACCEPTED or DECLINED.'),
    validate
  ],
  offerController.respondToOffer
);

/**
 * @route   GET /api/v1/offers/:id/onboarding
 * @desc    Get onboarding checklist tasks for an offer
 * @access  CANDIDATE (own), HR, ADMIN
 */
router.get(
  '/:id/onboarding',
  requireAuth,
  [param('id').isInt().withMessage('Offer ID must be an integer.'), validate],
  offerController.getOnboarding
);

/**
 * @route   PATCH /api/v1/offers/onboarding/:taskId
 * @desc    Update task completion status
 * @access  CANDIDATE, HR, ADMIN
 */
router.patch(
  '/onboarding/:taskId',
  requireAuth,
  [
    param('taskId').isInt().withMessage('Task ID must be an integer.'),
    body('isCompleted').isBoolean().withMessage('isCompleted must be a boolean.'),
    validate
  ],
  offerController.updateOnboardingTask
);

module.exports = router;

