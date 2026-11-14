const interviewService = require('../services/interviewService');

class InterviewController {
  async scheduleInterview(req, res, next) {
    try {
      const { applicationId, scheduledAt, durationMinutes, meetingLink } = req.body;
      const interview = await interviewService.scheduleInterview(req.user.id, {
        applicationId,
        scheduledAt,
        durationMinutes,
        meetingLink
      });

      res.status(201).json({
        success: true,
        message: 'Interview scheduled successfully.',
        data: interview
      });
    } catch (error) {
      next(error);
    }
  }

  async listInterviews(req, res, next) {
    try {
      const { status, applicationId } = req.query;
      const interviews = await interviewService.listInterviews(req.user, { status, applicationId });

      res.status(200).json({
        success: true,
        data: interviews
      });
    } catch (error) {
      next(error);
    }
  }

  async updateInterview(req, res, next) {
    try {
      const { id } = req.params;
      const { status, feedbackNotes, rating, scheduledAt, meetingLink } = req.body;

      const interview = await interviewService.updateInterview(id, {
        status,
        feedbackNotes,
        rating,
        scheduledAt,
        meetingLink
      });

      res.status(200).json({
        success: true,
        message: 'Interview updated successfully.',
        data: interview
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new InterviewController();

