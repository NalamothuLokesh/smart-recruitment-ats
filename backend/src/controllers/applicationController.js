const applicationService = require('../services/applicationService');

class ApplicationController {
  async apply(req, res, next) {
    try {
      const { jobId, resumeId } = req.body;
      const application = await applicationService.applyToJob(req.user.id, { jobId, resumeId });

      res.status(201).json({
        success: true,
        message: 'Application submitted successfully.',
        data: application
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyApplications(req, res, next) {
    try {
      const applications = await applicationService.getMyApplications(req.user.id);

      res.status(200).json({
        success: true,
        data: applications
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteMyApplication(req, res, next) {
    try {
      const result = await applicationService.deleteMyApplication(req.user.id, req.params.id);
      res.status(200).json({
        success: true,
        message: 'Application deleted successfully.',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async listApplications(req, res, next) {
    try {
      const { jobId, stage, search, page, limit } = req.query;
      const result = await applicationService.listApplications({
        jobId,
        stage,
        search,
        page,
        limit
      });

      res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  async transitionStage(req, res, next) {
    try {
      const { id } = req.params;
      const { toStage, notes } = req.body;

      const updatedApplication = await applicationService.transitionStage(id, req.user.id, {
        toStage,
        notes
      });

      res.status(200).json({
        success: true,
        message: `Application stage transitioned to '${toStage}'.`,
        data: updatedApplication
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ApplicationController();

