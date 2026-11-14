const db = require('../config/db');
const notificationService = require('./notificationService');

const VALID_STATUSES = ['SCHEDULED', 'RESCHEDULED', 'CANCELLED', 'COMPLETED'];

class InterviewService {
  /**
   * Schedule an interview for an active application
   */
  async scheduleInterview(interviewerId, { applicationId, scheduledAt, durationMinutes = 45, meetingLink }) {
    // 1. Verify application exists
    const [apps] = await db.query(
      `SELECT a.id, a.current_stage, a.candidate_id,
              j.title as job_title, u.email as candidate_email, u.full_name as candidate_name
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       JOIN users u ON a.candidate_id = u.id
       WHERE a.id = ? LIMIT 1`,
      [applicationId]
    );

    if (apps.length === 0) {
      const error = new Error('Application not found.');
      error.statusCode = 404;
      throw error;
    }

    const app = apps[0];

    // 2. Insert interview
    const [result] = await db.query(
      `INSERT INTO interviews (application_id, interviewer_id, scheduled_at, duration_minutes, meeting_link, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'SCHEDULED', NOW())`,
      [applicationId, interviewerId, scheduledAt, durationMinutes, meetingLink]
    );

    const interviewId = result.insertId;

    // 3. Auto-promote application to INTERVIEW stage if currently in APPLIED or SCREENING
    if (['APPLIED', 'SCREENING'].includes(app.current_stage)) {
      await db.query('UPDATE applications SET current_stage = "INTERVIEW", updated_at = NOW() WHERE id = ?', [applicationId]);
      await db.query(
        `INSERT INTO application_audit_logs (application_id, changed_by, from_stage, to_stage, notes, changed_at)
         VALUES (?, ?, ?, 'INTERVIEW', 'Automated stage advance upon scheduling interview.', NOW())`,
        [applicationId, interviewerId, app.current_stage]
      );
    }

    // 4. Send notification
    await notificationService.sendNotification({
      recipientEmail: app.candidate_email,
      eventType: 'INTERVIEW_SCHEDULED',
      subject: `Interview Scheduled: ${app.job_title}`,
      payload: {
        interviewId,
        scheduledAt,
        durationMinutes,
        meetingLink,
        jobTitle: app.job_title
      }
    });

    return this.getInterviewById(interviewId);
  }

  /**
   * List interviews filtered by user role
   */
  async listInterviews(user, { status, applicationId }) {
    const params = [];
    const conditions = [];

    if (user.role === 'CANDIDATE') {
      conditions.push('app.candidate_id = ?');
      params.push(user.id);
    }

    if (status) {
      conditions.push('i.status = ?');
      params.push(status);
    }

    if (applicationId) {
      conditions.push('i.application_id = ?');
      params.push(applicationId);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [rows] = await db.query(
      `SELECT i.id, i.application_id, i.interviewer_id, i.scheduled_at, i.duration_minutes,
              i.meeting_link, i.status, i.feedback_notes, i.rating, i.created_at,
              u_cand.full_name as candidate_name, u_cand.email as candidate_email,
              u_int.full_name as interviewer_name,
              j.title as job_title, j.department
       FROM interviews i
       JOIN applications app ON i.application_id = app.id
       JOIN users u_cand ON app.candidate_id = u_cand.id
       JOIN users u_int ON i.interviewer_id = u_int.id
       JOIN jobs j ON app.job_id = j.id
       ${whereClause}
       ORDER BY i.scheduled_at ASC`,
      params
    );

    return rows;
  }

  /**
   * Update interview status, schedule, or submit feedback
   */
  async updateInterview(interviewId, { status, feedbackNotes, rating, scheduledAt, meetingLink }) {
    const [existing] = await db.query('SELECT * FROM interviews WHERE id = ?', [interviewId]);
    if (existing.length === 0) {
      const error = new Error('Interview record not found.');
      error.statusCode = 404;
      throw error;
    }

    const current = existing[0];
    const newStatus = status || current.status;

    if (status && !VALID_STATUSES.includes(status)) {
      const error = new Error(`Invalid status. Valid values: ${VALID_STATUSES.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }

    await db.query(
      `UPDATE interviews
       SET status = ?,
           feedback_notes = COALESCE(?, feedback_notes),
           rating = COALESCE(?, rating),
           scheduled_at = COALESCE(?, scheduled_at),
           meeting_link = COALESCE(?, meeting_link)
       WHERE id = ?`,
      [
        newStatus,
        feedbackNotes !== undefined ? feedbackNotes : null,
        rating !== undefined ? rating : null,
        scheduledAt || null,
        meetingLink || null,
        interviewId
      ]
    );

    return this.getInterviewById(interviewId);
  }

  /**
   * Helper to retrieve single interview record
   */
  async getInterviewById(interviewId) {
    const [rows] = await db.query(
      `SELECT i.id, i.application_id, i.interviewer_id, i.scheduled_at, i.duration_minutes,
              i.meeting_link, i.status, i.feedback_notes, i.rating, i.created_at,
              u_cand.full_name as candidate_name, u_cand.email as candidate_email,
              u_int.full_name as interviewer_name,
              j.title as job_title
       FROM interviews i
       JOIN applications app ON i.application_id = app.id
       JOIN users u_cand ON app.candidate_id = u_cand.id
       JOIN users u_int ON i.interviewer_id = u_int.id
       JOIN jobs j ON app.job_id = j.id
       WHERE i.id = ? LIMIT 1`,
      [interviewId]
    );

    return rows.length > 0 ? rows[0] : null;
  }
}

module.exports = new InterviewService();

