const express = require('express');
const { body, param, query } = require('express-validator');
const applicationController = require('../controllers/applicationController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

/**
 * @route   POST /api/v1/applications
 * @desc    Candidate applies to a published job
 * @access  CANDIDATE
 */
router.post(
  '/',
  requireAuth,
  requireRole('CANDIDATE'),
  [
    body('jobId').isInt().withMessage('Valid Job ID is required.'),
    body('resumeId').optional().isInt().withMessage('Resume ID must be an integer.'),
    validate
  ],
  applicationController.apply
);

/**
 * @route   GET /api/v1/applications/my
 * @desc    Candidate views own applications and progress timeline
 * @access  CANDIDATE
 */
router.get(
  '/my',
  requireAuth,
  requireRole('CANDIDATE'),
  applicationController.getMyApplications
);

/**
 * @route   GET /api/v1/applications
 * @desc    HR/Admin pipeline management view with filters
 * @access  HR, ADMIN
 */
router.get(
  '/',
  requireAuth,
  requireRole('HR', 'ADMIN'),
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('jobId').optional().isInt(),
    query('stage').optional().isIn(['APPLIED', 'SCREENING', 'INTERVIEW', 'SELECTED', 'OFFERED', 'REJECTED']),
    validate
  ],
  applicationController.listApplications
);
/**
 * @route   GET /api/v1/applications/:id
 * @desc    HR/Admin views one application with its activity timeline
 * @access  HR, ADMIN
 */
router.get(
  '/:id',
  requireAuth,
  requireRole('HR', 'ADMIN'),
  [
    param('id').isInt().withMessage('Application ID must be an integer.'),
    validate
  ],
  applicationController.getApplicationById
);

/**
 * @route   PATCH /api/v1/applications/:id/stage
 * @desc    HR/Admin stage transition with audit logging & notification
 * @access  HR, ADMIN
 */
router.patch(
  '/:id/stage',
  requireAuth,
  requireRole('HR', 'ADMIN'),
  [
    param('id').isInt().withMessage('Application ID must be an integer.'),
    body('toStage').isIn(['APPLIED', 'SCREENING', 'INTERVIEW', 'SELECTED', 'OFFERED', 'REJECTED'])
      .withMessage('Valid toStage is required.'),
    body('notes').optional().trim(),
    validate
  ],
  applicationController.transitionStage
);

module.exports = router;

