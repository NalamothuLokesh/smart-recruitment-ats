const express = require('express');
const { body, param, query } = require('express-validator');
const candidateController = require('../controllers/candidateController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { handleResumeUpload } = require('../middleware/upload');
const { validate } = require('../middleware/validation');

const router = express.Router();

/**
 * @route   GET /api/v1/candidates/profile
 * @desc    Get candidate profile (own profile for CANDIDATE; target profile for HR/Admin)
 * @access  CANDIDATE, HR, ADMIN
 */
router.get(
  '/profile',
  requireAuth,
  requireRole('CANDIDATE', 'HR', 'ADMIN'),
  [query('candidateId').optional().isInt(), validate],
  candidateController.getProfile
);

/**
 * @route   PUT /api/v1/candidates/profile
 * @desc    Update candidate profile details
 * @access  CANDIDATE
 */
router.put(
  '/profile',
  requireAuth,
  requireRole('CANDIDATE'),
  [
    body('phone').optional().trim(),
    body('skills').optional().isArray().withMessage('Skills must be an array of strings.'),
    body('experienceYears').optional().isNumeric().withMessage('Experience years must be a number.'),
    body('linkedinUrl').optional().trim().isURL().withMessage('LinkedIn URL must be valid.'),
    validate
  ],
  candidateController.updateProfile
);

/**
 * @route   POST /api/v1/candidates/resume
 * @desc    Upload private resume document (PDF/DOC/DOCX max 5MB)
 * @access  CANDIDATE
 */
router.post(
  '/resume',
  requireAuth,
  requireRole('CANDIDATE'),
  handleResumeUpload,
  candidateController.uploadResume
);

/**
 * @route   GET /api/v1/candidates/resume/:id/download
 * @desc    Secure private download of candidate resume (never static public URL)
 * @access  Owner CANDIDATE, HR, ADMIN
 */
router.get(
  '/resume/:id/download',
  requireAuth,
  [param('id').isInt().withMessage('Resume ID must be an integer.'), validate],
  candidateController.downloadResume
);
router.get(
  '/resume/:id/preview',
  requireAuth,
  [
    param('id').isInt().withMessage('Resume ID must be an integer.'),
    validate
  ],
  candidateController.previewResume
);

/**
 * @route   DELETE /api/v1/candidates/resume/:id
 * @desc    Delete an owned resume and its private stored file
 * @access  CANDIDATE (owner only)
 */
router.delete(
  '/resume/:id',
  requireAuth,
  requireRole('CANDIDATE'),
  [param('id').isInt().withMessage('Resume ID must be an integer.'), validate],
  candidateController.deleteResume
);

module.exports = router;

