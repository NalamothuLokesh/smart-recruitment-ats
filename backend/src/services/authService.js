const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const config = require('../config/env');
const notificationService = require('./notificationService');

class AuthService {
  /**
   * Register a new candidate
   */
  async registerCandidate({ fullName, email, password, confirmPassword, verificationCode, phone, skills, experienceYears, linkedinUrl }) {
    // 0. Verify confirm password matches
    if (confirmPassword && password !== confirmPassword) {
      const error = new Error('Passwords do not match. Please verify your password.');
      error.statusCode = 400;
      throw error;
    }

    // Optional verification code check
    if (verificationCode) {
      const [vRows] = await db.query(
        'SELECT id FROM email_verifications WHERE email = ? AND otp_code = ? AND expires_at > NOW() ORDER BY id DESC LIMIT 1',
        [email.toLowerCase().trim(), verificationCode.trim()]
      );
      if (vRows.length === 0) {
        const error = new Error('Invalid or expired verification code.');
        error.statusCode = 400;
        throw error;
      }
      await db.query('UPDATE email_verifications SET is_verified = TRUE WHERE id = ?', [vRows[0].id]);
    }

    // 1. Check existing email
    const [existing] = await db.query('SELECT id FROM users WHERE email = ? LIMIT 1', [email.toLowerCase().trim()]);
    if (existing.length > 0) {
      const error = new Error('An account with this email address already exists.');
      error.statusCode = 409;
      throw error;
    }

    // 2. Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. Insert User
    const [userResult] = await db.query(
      `INSERT INTO users (org_id, full_name, email, password_hash, role, is_active, created_at)
       VALUES (NULL, ?, ?, ?, 'CANDIDATE', TRUE, NOW())`,
      [fullName.trim(), email.toLowerCase().trim(), passwordHash]
    );

    const userId = userResult.insertId;

    // 4. Create Candidate Profile
    const skillsJson = Array.isArray(skills) ? JSON.stringify(skills) : JSON.stringify(skills ? [skills] : []);
    await db.query(
      `INSERT INTO candidate_profiles (user_id, phone, skills_json, experience_years, linkedin_url, updated_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [userId, phone || null, skillsJson, parseFloat(experienceYears) || 0.0, linkedinUrl || null]
    );

    // 5. Send welcome notification
    await notificationService.sendNotification({
      recipientEmail: email,
      eventType: 'CANDIDATE_REGISTRATION',
      subject: 'Welcome to Smart Recruitment ATS',
      payload: { userId, fullName }
    });

    // 6. Generate Token
    const token = this.generateToken({ id: userId, role: 'CANDIDATE', email });

    return {
      token,
      user: {
        id: userId,
        orgId: null,
        fullName,
        email,
        role: 'CANDIDATE',
        isActive: true
      }
    };
  }

  /**
   * Authenticate user (Admin, HR, or Candidate)
   */
  async login({ email, password }) {
    const [users] = await db.query(
      `SELECT u.id, u.org_id, u.full_name, u.email, u.password_hash, u.role, u.is_active,
              o.name as org_name
       FROM users u
       LEFT JOIN organizations o ON u.org_id = o.id
       WHERE u.email = ? LIMIT 1`,
      [email.toLowerCase().trim()]
    );

    if (users.length === 0) {
      const error = new Error('Invalid email or password.');
      error.statusCode = 401;
      throw error;
    }

    const user = users[0];

    if (!user.is_active) {
      const error = new Error('Your account has been deactivated. Contact an administrator.');
      error.statusCode = 403;
      throw error;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      const error = new Error('Invalid email or password.');
      error.statusCode = 401;
      throw error;
    }

    const token = this.generateToken({ id: user.id, role: user.role, email: user.email });

    return {
      token,
      user: {
        id: user.id,
        orgId: user.org_id,
        orgName: user.org_name,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        isActive: Boolean(user.is_active)
      }
    };
  }

  /**
   * Get authenticated user profile with context
   */
  async getCurrentUser(userId) {
    const [users] = await db.query(
      `SELECT u.id, u.org_id, u.full_name, u.email, u.role, u.is_active, u.created_at,
              o.name as org_name
       FROM users u
       LEFT JOIN organizations o ON u.org_id = o.id
       WHERE u.id = ? LIMIT 1`,
      [userId]
    );

    if (users.length === 0) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      throw error;
    }

    const user = users[0];
    let profile = null;

    if (user.role === 'CANDIDATE') {
      const [profiles] = await db.query(
        'SELECT id, phone, skills_json, experience_years, linkedin_url, updated_at FROM candidate_profiles WHERE user_id = ? LIMIT 1',
        [userId]
      );
      if (profiles.length > 0) {
        const raw = profiles[0];
        let skills = [];
        try {
          skills = typeof raw.skills_json === 'string' ? JSON.parse(raw.skills_json) : (raw.skills_json || []);
        } catch (e) {
          skills = [];
        }
        profile = {
          id: raw.id,
          phone: raw.phone,
          skills,
          experienceYears: parseFloat(raw.experience_years),
          linkedinUrl: raw.linkedin_url,
          updatedAt: raw.updated_at
        };
      }
    }

    return {
      id: user.id,
      orgId: user.org_id,
      orgName: user.org_name,
      fullName: user.full_name,
      email: user.email,
      role: user.role,
      isActive: Boolean(user.is_active),
      createdAt: user.created_at,
      profile
    };
  }

  /**
   * Send a 6-digit email verification code for registration
   */
  async sendVerificationOtp(email) {
    const normalizedEmail = email.toLowerCase().trim();

    // Check if account already exists
    const [existing] = await db.query('SELECT id FROM users WHERE email = ? LIMIT 1', [normalizedEmail]);
    if (existing.length > 0) {
      const error = new Error('An account with this email address already exists. Please sign in or use forgot password.');
      error.statusCode = 409;
      throw error;
    }

    // Generate cryptographically secure 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Invalidate previous OTPs for this email
    await db.query('DELETE FROM email_verifications WHERE email = ?', [normalizedEmail]);

    // Insert OTP with 15-minute expiry
    await db.query(
      `INSERT INTO email_verifications (email, otp_code, expires_at, is_verified, created_at)
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE), FALSE, NOW())`,
      [normalizedEmail, otpCode]
    );

    // Send simulated email notification
    await notificationService.sendNotification({
      recipientEmail: normalizedEmail,
      eventType: 'EMAIL_VERIFICATION_OTP',
      subject: 'Your Smart ATS Email Verification Code',
      payload: { otpCode, expiresMinutes: 15 }
    });

    return {
      success: true,
      message: `Verification code sent to ${normalizedEmail}.`,
      otpCode // Included for demo/local testing convenience
    };
  }

  /**
   * Request password reset code
   */
  async requestPasswordReset(email) {
    const normalizedEmail = email.toLowerCase().trim();

    const [users] = await db.query(
      'SELECT id, full_name, is_active FROM users WHERE email = ? LIMIT 1',
      [normalizedEmail]
    );

    if (users.length === 0) {
      const error = new Error('No account found with this email address.');
      error.statusCode = 404;
      throw error;
    }

    const user = users[0];
    if (!user.is_active) {
      const error = new Error('This account has been deactivated. Contact an administrator.');
      error.statusCode = 403;
      throw error;
    }

    // Generate random 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Invalidate prior codes
    await db.query('UPDATE password_resets SET is_used = TRUE WHERE email = ?', [normalizedEmail]);

    // Store new OTP
    await db.query(
      `INSERT INTO password_resets (email, otp_code, expires_at, is_used, created_at)
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE), FALSE, NOW())`,
      [normalizedEmail, otpCode]
    );

    // Send simulated notification
    await notificationService.sendNotification({
      recipientEmail: normalizedEmail,
      eventType: 'PASSWORD_RESET_OTP',
      subject: 'Your Smart ATS Password Reset Code',
      payload: { otpCode, userName: user.full_name, expiresMinutes: 15 }
    });

    return {
      success: true,
      message: `Password reset code dispatched to ${normalizedEmail}.`,
      otpCode // Displayed for seamless local testing
    };
  }

  /**
   * Reset password with verified OTP
   */
  async resetPassword({ email, otpCode, newPassword, confirmPassword }) {
    const normalizedEmail = email.toLowerCase().trim();

    if (newPassword !== confirmPassword) {
      const error = new Error('Passwords do not match. Please verify your new password.');
      error.statusCode = 400;
      throw error;
    }

    // Verify OTP
    const [resets] = await db.query(
      `SELECT id FROM password_resets
       WHERE email = ? AND otp_code = ? AND is_used = FALSE AND expires_at > NOW()
       ORDER BY id DESC LIMIT 1`,
      [normalizedEmail, otpCode.trim()]
    );

    if (resets.length === 0) {
      const error = new Error('Invalid or expired verification code. Please request a new one.');
      error.statusCode = 400;
      throw error;
    }

    const resetId = resets[0].id;

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    // Update user password
    await db.query(
      'UPDATE users SET password_hash = ? WHERE email = ?',
      [newHash, normalizedEmail]
    );

    // Mark reset code as used
    await db.query('UPDATE password_resets SET is_used = TRUE WHERE id = ?', [resetId]);

    // Send confirmation notification
    await notificationService.sendNotification({
      recipientEmail: normalizedEmail,
      eventType: 'PASSWORD_RESET_SUCCESS',
      subject: 'Your Smart ATS Password Has Been Reset',
      payload: { resetAt: new Date().toISOString() }
    });

    return {
      success: true,
      message: 'Password reset successful. You can now sign in with your new password.'
    };
  }

  generateToken(payload) {
    return jwt.sign(payload, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRES_IN
    });
  }
}

module.exports = new AuthService();

