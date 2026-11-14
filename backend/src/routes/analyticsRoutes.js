const express = require('express');
const { query } = require('express-validator');
const analyticsController = require('../controllers/analyticsController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

/**
 * @route   GET /api/v1/analytics/summary
 * @desc    Compute hiring pipeline analytics, KPIs, conversion rates, and time-to-hire
 * @access  HR, ADMIN
 */
router.get(
  '/summary',
  requireAuth,
  requireRole('HR', 'ADMIN'),
  [
    query('jobId').optional().isInt(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    validate
  ],
  analyticsController.getSummary
);

module.exports = router;

