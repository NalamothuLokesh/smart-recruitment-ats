const express = require('express');
const authRoutes = require('./authRoutes');
const adminRoutes = require('./adminRoutes');
const jobRoutes = require('./jobRoutes');
const candidateRoutes = require('./candidateRoutes');
const applicationRoutes = require('./applicationRoutes');
const interviewRoutes = require('./interviewRoutes');
const offerRoutes = require('./offerRoutes');
const analyticsRoutes = require('./analyticsRoutes');

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    service: 'Smart ATS Backend API'
  });
});

// Mount domain routes
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/jobs', jobRoutes);
router.use('/candidates', candidateRoutes);
router.use('/applications', applicationRoutes);
router.use('/interviews', interviewRoutes);
router.use('/offers', offerRoutes);
router.use('/analytics', analyticsRoutes);

module.exports = router;

