const express = require('express');
const { body, param, query } = require('express-validator');
const jobController = require('../controllers/jobController');
const { requireAuth, requireRole, optionalAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

/**
 * @route   GET /api/v1/jobs
 * @desc    Get published jobs (public/candidate) or all jobs (HR/Admin)
 * @access  Public / Authenticated
 */
router.get(
  '/',
  optionalAuth,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED']),
    validate
  ],
  jobController.listJobs
);

/**
 * @route   GET /api/v1/jobs/:id
 * @desc    Get single job details
 * @access  Public (if published) / HR & Admin (any status)
 */
router.get(
  '/:id',
  optionalAuth,
  [param('id').isInt().withMessage('Job ID must be an integer.'), validate],
  jobController.getJobById
);

/**
 * @route   POST /api/v1/jobs
 * @desc    Create a new job posting
 * @access  HR, ADMIN
 */
router.post(
  '/',
  requireAuth,
  requireRole('HR', 'ADMIN'),
  [
    body('title').trim().notEmpty().withMessage('Job title is required.'),
    body('department').trim().notEmpty().withMessage('Department is required.'),
    body('location').trim().notEmpty().withMessage('Location is required.'),
    body('employmentType').optional().isIn(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN']),
    body('description').trim().notEmpty().withMessage('Job description is required.'),
    body('requirements').trim().notEmpty().withMessage('Job requirements are required.'),
    body('status').optional().isIn(['DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED']),
    validate
  ],
  jobController.createJob
);

/**
 * @route   PUT /api/v1/jobs/:id
 * @desc    Update job details
 * @access  HR, ADMIN
 */
router.put(
  '/:id',
  requireAuth,
  requireRole('HR', 'ADMIN'),
  [
    param('id').isInt().withMessage('Job ID must be an integer.'),
    body('title').trim().notEmpty().withMessage('Job title is required.'),
    body('department').trim().notEmpty().withMessage('Department is required.'),
    body('location').trim().notEmpty().withMessage('Location is required.'),
    body('employmentType').optional().isIn(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN']),
    body('description').trim().notEmpty().withMessage('Job description is required.'),
    body('requirements').trim().notEmpty().withMessage('Job requirements are required.'),
    body('status').optional().isIn(['DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED']),
    validate
  ],
  jobController.updateJob
);

/**
 * @route   PATCH /api/v1/jobs/:id/status
 * @desc    Publish, close, or archive a job posting
 * @access  HR, ADMIN
 */
router.patch(
  '/:id/status',
  requireAuth,
  requireRole('HR', 'ADMIN'),
  [
    param('id').isInt().withMessage('Job ID must be an integer.'),
    body('status').isIn(['DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED']).withMessage('Invalid job status.'),
    validate
  ],
  jobController.updateJobStatus
);

module.exports = router;

