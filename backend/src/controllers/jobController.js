const jobService = require('../services/jobService');

class JobController {
  async listJobs(req, res, next) {
    try {
      const { status, department, search, page, limit } = req.query;
      const userRole = req.user ? req.user.role : 'GUEST';

      const result = await jobService.listJobs({
        userRole,
        status,
        department,
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

  async getJobById(req, res, next) {
    try {
      const { id } = req.params;
      const userRole = req.user ? req.user.role : 'GUEST';
      const job = await jobService.getJobById(id, userRole);

      res.status(200).json({
        success: true,
        data: job
      });
    } catch (error) {
      next(error);
    }
  }

  async createJob(req, res, next) {
    try {
      const { title, department, location, employmentType, description, requirements, status } = req.body;
      const job = await jobService.createJob(req.user.id, req.user.org_id, {
        title,
        department,
        location,
        employmentType,
        description,
        requirements,
        status
      });

      res.status(201).json({
        success: true,
        message: 'Job posting created successfully.',
        data: job
      });
    } catch (error) {
      next(error);
    }
  }

  async updateJob(req, res, next) {
    try {
      const { id } = req.params;
      const { title, department, location, employmentType, description, requirements, status } = req.body;

      const job = await jobService.updateJob(id, {
        title,
        department,
        location,
        employmentType,
        description,
        requirements,
        status
      });

      res.status(200).json({
        success: true,
        message: 'Job posting updated successfully.',
        data: job
      });
    } catch (error) {
      next(error);
    }
  }

  async updateJobStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const job = await jobService.updateJobStatus(id, status);

      res.status(200).json({
        success: true,
        message: `Job status transitioned to '${status}'.`,
        data: job
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new JobController();

