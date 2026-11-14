const fs = require('fs');
const path = require('path');
const db = require('../config/db');

class CandidateService {
  /**
   * Get candidate profile and resume history
   */
  async getProfile(userId) {
    const [profiles] = await db.query(
      `SELECT cp.id, cp.user_id, cp.phone, cp.skills_json, cp.experience_years, cp.linkedin_url, cp.updated_at,
              u.full_name, u.email, u.created_at as registered_at
       FROM candidate_profiles cp
       JOIN users u ON cp.user_id = u.id
       WHERE cp.user_id = ? LIMIT 1`,
      [userId]
    );

    if (profiles.length === 0) {
      // Check if user exists
      const [user] = await db.query('SELECT id, full_name, email, created_at FROM users WHERE id = ?', [userId]);
      if (user.length === 0) {
        const error = new Error('Candidate not found.');
        error.statusCode = 404;
        throw error;
      }

      // Automatically initialize blank profile
      await db.query(
        'INSERT INTO candidate_profiles (user_id, skills_json, experience_years, updated_at) VALUES (?, "[]", 0.0, NOW())',
        [userId]
      );
      return this.getProfile(userId);
    }

    const row = profiles[0];
    let skills = [];
    try {
      skills = typeof row.skills_json === 'string' ? JSON.parse(row.skills_json) : (row.skills_json || []);
    } catch (e) {
      skills = [];
    }

    const [resumes] = await db.query(
      `SELECT id, original_filename, stored_filename, mime_type, file_size_bytes, uploaded_at
       FROM resumes
       WHERE candidate_id = ?
       ORDER BY uploaded_at DESC`,
      [userId]
    );

    return {
      userId: row.user_id,
      fullName: row.full_name,
      email: row.email,
      phone: row.phone,
      skills,
      experienceYears: parseFloat(row.experience_years),
      linkedinUrl: row.linkedin_url,
      registeredAt: row.registered_at,
      updatedAt: row.updated_at,
      resumes
    };
  }

  /**
   * Update candidate profile
   */
  async updateProfile(userId, { phone, skills, experienceYears, linkedinUrl }) {
    const skillsJson = Array.isArray(skills) ? JSON.stringify(skills) : (skills ? JSON.stringify([skills]) : '[]');

    const [existing] = await db.query('SELECT id FROM candidate_profiles WHERE user_id = ?', [userId]);
    if (existing.length === 0) {
      await db.query(
        `INSERT INTO candidate_profiles (user_id, phone, skills_json, experience_years, linkedin_url, updated_at)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [userId, phone || null, skillsJson, parseFloat(experienceYears) || 0.0, linkedinUrl || null]
      );
    } else {
      await db.query(
        `UPDATE candidate_profiles
         SET phone = ?, skills_json = ?, experience_years = ?, linkedin_url = ?, updated_at = NOW()
         WHERE user_id = ?`,
        [phone || null, skillsJson, parseFloat(experienceYears) || 0.0, linkedinUrl || null, userId]
      );
    }

    return this.getProfile(userId);
  }

  /**
   * Save uploaded resume record
   */
  async saveResume(userId, file) {
    const [result] = await db.query(
      `INSERT INTO resumes (candidate_id, original_filename, stored_filename, file_path, mime_type, file_size_bytes, uploaded_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        userId,
        file.originalname,
        file.filename,
        file.path,
        file.mimetype,
        file.size
      ]
    );

    return {
      id: result.insertId,
      candidateId: userId,
      originalFilename: file.originalname,
      storedFilename: file.filename,
      mimeType: file.mimetype,
      fileSizeBytes: file.size,
      uploadedAt: new Date().toISOString()
    };
  }

  /**
   * Authorize and retrieve resume file record for secure download
   */
  async getResumeForDownload(resumeId, requestingUser) {
    const [rows] = await db.query(
      'SELECT id, candidate_id, original_filename, stored_filename, file_path, mime_type, file_size_bytes FROM resumes WHERE id = ? LIMIT 1',
      [resumeId]
    );

    if (rows.length === 0) {
      const error = new Error('Resume not found.');
      error.statusCode = 404;
      throw error;
    }

    const resume = rows[0];

    // Authorization check: Candidate can only download their own resume; HR/Admin can download any
    if (requestingUser.role === 'CANDIDATE' && resume.candidate_id !== requestingUser.id) {
      const error = new Error('Forbidden: You do not have permission to access this resume.');
      error.statusCode = 403;
      throw error;
    }

    // Check physical file existence on disk
    if (!fs.existsSync(resume.file_path)) {
      const error = new Error('The physical resume file could not be found on server storage.');
      error.statusCode = 404;
      throw error;
    }

    return resume;
  }
}

module.exports = new CandidateService();

