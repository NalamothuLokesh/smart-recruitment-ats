const authService = require('../services/authService');

class AuthController {
  async register(req, res, next) {
    try {
      const { fullName, email, password, phone, skills, experienceYears, linkedinUrl } = req.body;
      const result = await authService.registerCandidate({
        fullName,
        email,
        password,
        phone,
        skills,
        experienceYears,
        linkedinUrl
      });

      res.status(201).json({
        success: true,
        message: 'Candidate registration successful.',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login({ email, password });

      res.status(200).json({
        success: true,
        message: 'Login successful.',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getMe(req, res, next) {
    try {
      const user = await authService.getCurrentUser(req.user.id);
      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();

