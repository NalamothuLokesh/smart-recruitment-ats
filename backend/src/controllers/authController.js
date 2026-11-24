const authService = require('../services/authService');

class AuthController {
  async register(req, res, next) {
    try {
      const { fullName, email, password, confirmPassword, verificationCode, phone, skills, experienceYears, linkedinUrl } = req.body;
      const result = await authService.registerCandidate({
        fullName,
        email,
        password,
        confirmPassword,
        verificationCode,
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

  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      const result = await authService.requestPasswordReset(email);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { email, otpCode, newPassword, confirmPassword } = req.body;
      const result = await authService.resetPassword({ email, otpCode, newPassword, confirmPassword });
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async sendVerificationOtp(req, res, next) {
    try {
      const { email } = req.body;
      const result = await authService.sendVerificationOtp(email);
      res.status(200).json(result);
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

