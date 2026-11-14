const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const config = require('../config/env');
const notificationService = require('./notificationService');

class AuthService {
  /**
   * Register a new candidate
   */
  async registerCandidate({ fullName, email, password, phone, skills, experienceYears, linkedinUrl }) {
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

  generateToken(payload) {
    return jwt.sign(payload, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRES_IN
    });
  }
}

module.exports = new AuthService();

