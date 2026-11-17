const path = require('path');
const candidateService = require('../services/candidateService');

class CandidateController {
  async getProfile(req, res, next) {
    try {
      // If HR or ADMIN passes ?candidateId=, allow inspecting that candidate
      const targetUserId = (['ADMIN', 'HR'].includes(req.user.role) && req.query.candidateId)
        ? req.query.candidateId
        : req.user.id;

      const profile = await candidateService.getProfile(targetUserId);

      res.status(200).json({
        success: true,
        data: profile
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const { phone, skills, experienceYears, linkedinUrl } = req.body;
      const updatedProfile = await candidateService.updateProfile(req.user.id, {
        phone,
        skills,
        experienceYears,
        linkedinUrl
      });

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully.',
        data: updatedProfile
      });
    } catch (error) {
      next(error);
    }
  }

  async uploadResume(req, res, next) {
    try {
      const fileRecord = await candidateService.saveResume(req.user.id, req.file);

      res.status(201).json({
        success: true,
        message: 'Resume uploaded successfully.',
        data: fileRecord
      });
    } catch (error) {
      next(error);
    }
  }

  async downloadResume(req, res, next) {
    try {
      const { id } = req.params;
      const resume = await candidateService.getResumeForDownload(id, req.user);

      // Secure private file delivery: do not expose static URL
      res.setHeader('Content-Type', resume.mime_type);
      res.download(path.resolve(resume.file_path), resume.original_filename);
    } catch (error) {
      next(error);
    }
  }

  async deleteResume(req, res, next) {
    try {
      const result = await candidateService.deleteResume(req.user.id, req.params.id);
      res.status(200).json({
        success: true,
        message: 'Resume deleted successfully.',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CandidateController();

