const offerService = require('../services/offerService');

class OfferController {
  async generateOffer(req, res, next) {
    try {
      const { applicationId, salaryOffered, joiningDate, offerLetterContent, status } = req.body;
      const offer = await offerService.generateOffer(req.user.id, {
        applicationId,
        salaryOffered,
        joiningDate,
        offerLetterContent,
        status
      });

      res.status(201).json({
        success: true,
        message: 'Employment offer generated successfully.',
        data: offer
      });
    } catch (error) {
      next(error);
    }
  }

  async respondToOffer(req, res, next) {
    try {
      const { id } = req.params;
      const { decision } = req.body;
      const updatedOffer = await offerService.respondToOffer(req.user.id, id, { decision });

      res.status(200).json({
        success: true,
        message: `Offer successfully ${decision.toLowerCase()}.`,
        data: updatedOffer
      });
    } catch (error) {
      next(error);
    }
  }

  async getOnboarding(req, res, next) {
    try {
      const { id } = req.params;
      const data = await offerService.getOnboardingTasks(id, req.user);

      res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }

  async updateOnboardingTask(req, res, next) {
    try {
      const { taskId } = req.params;
      const { isCompleted } = req.body;
      const updatedTask = await offerService.updateOnboardingTask(taskId, isCompleted);

      res.status(200).json({
        success: true,
        message: 'Onboarding task updated.',
        data: updatedTask
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OfferController();

