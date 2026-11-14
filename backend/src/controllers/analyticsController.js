const analyticsService = require('../services/analyticsService');

class AnalyticsController {
  async getSummary(req, res, next) {
    try {
      const { jobId, startDate, endDate } = req.query;
      const data = await analyticsService.getSummary({ jobId, startDate, endDate });

      res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AnalyticsController();

