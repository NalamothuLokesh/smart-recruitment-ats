const db = require('../config/db');
const notificationService = require('./notificationService');

const VALID_STAGES = ['APPLIED', 'SCREENING', 'INTERVIEW', 'SELECTED', 'OFFERED', 'REJECTED'];

class ApplicationService {
  /**
   * Candidate applies to a published job
   */
  async applyToJob(candidateId, { jobId, resumeId }) {
    // 1. Verify job is published
    const [jobs] = await db.query(
      'SELECT id, title, status FROM jobs WHERE id = ? LIMIT 1',
      [jobId]
    );

    if (jobs.length === 0) {
      const error = new Error('The target job does not exist.');
      error.statusCode = 404;
      throw error;
    }

    if (jobs[0].status !== 'PUBLISHED') {
      const error = new Error('Applications are closed for this job posting.');
      error.statusCode = 400;
      throw error;
    }

    // 2. Verify resume belongs to candidate
    if (resumeId) {
      const [resumes] = await db.query(
        'SELECT id FROM resumes WHERE id = ? AND candidate_id = ? LIMIT 1',
        [resumeId, candidateId]
      );
      if (resumes.length === 0) {
        const error = new Error('Specified resume was not found or does not belong to you.');
        error.statusCode = 400;
        throw error;
      }
    }

    // 3. Check for existing duplicate application
    const [existing] = await db.query(
      'SELECT id FROM applications WHERE job_id = ? AND candidate_id = ? LIMIT 1',
      [jobId, candidateId]
    );

    if (existing.length > 0) {
      const error = new Error('You have already submitted an application for this position.');
      error.statusCode = 409;
      throw error;
    }

    // 4. Create application
    const [result] = await db.query(
      `INSERT INTO applications (job_id, candidate_id, resume_id, current_stage, applied_at, updated_at)
       VALUES (?, ?, ?, 'APPLIED', NOW(), NOW())`,
      [jobId, candidateId, resumeId || null]
    );

    const applicationId = result.insertId;

    // 5. Create initial audit log
    await db.query(
      `INSERT INTO application_audit_logs (application_id, changed_by, from_stage, to_stage, notes, changed_at)
       VALUES (?, ?, NULL, 'APPLIED', 'Candidate submitted initial application.', NOW())`,
      [applicationId, candidateId]
    );

    // 6. Send application confirmation notification
    const [candidateRows] = await db.query('SELECT email, full_name FROM users WHERE id = ?', [candidateId]);
    if (candidateRows.length > 0) {
      await notificationService.sendNotification({
        recipientEmail: candidateRows[0].email,
        eventType: 'APPLICATION_CONFIRMATION',
        subject: `Application Received: ${jobs[0].title}`,
        payload: {
          applicationId,
          jobTitle: jobs[0].title,
          candidateName: candidateRows[0].full_name
        }
      });
    }

    return this.getApplicationById(applicationId);
  }

  /**
   * Candidate retrieves their own applications with timeline
   */
  async getMyApplications(candidateId) {
    const [applications] = await db.query(
      `SELECT a.id, a.job_id, a.resume_id, a.current_stage, a.applied_at, a.updated_at,
              j.title as job_title, j.department, j.location, j.employment_type,
              r.original_filename as resume_filename,
              o.id as offer_id, o.status as offer_status
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       LEFT JOIN resumes r ON a.resume_id = r.id
       LEFT JOIN offers o ON a.id = o.application_id
       WHERE a.candidate_id = ?
       ORDER BY a.applied_at DESC`,
      [candidateId]
    );

    // Fetch audit timeline and interviews for each application
    const enhancedApps = await Promise.all(
      applications.map(async (app) => {
        const [timeline] = await db.query(
          `SELECT id, from_stage, to_stage, notes, changed_at
           FROM application_audit_logs
           WHERE application_id = ?
           ORDER BY changed_at ASC`,
          [app.id]
        );

        const [interviews] = await db.query(
          `SELECT id, scheduled_at, duration_minutes, meeting_link, status
           FROM interviews
           WHERE application_id = ?
           ORDER BY scheduled_at ASC`,
          [app.id]
        );

        return {
          ...app,
          timeline,
          interviews
        };
      })
    );

    return enhancedApps;
  }

  /**
   * HR/Admin pipeline view with search and filters
   */
  async listApplications({ jobId, stage, search, page = 1, limit = 20 }) {
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const params = [];
    const conditions = [];

    if (jobId) {
      conditions.push('a.job_id = ?');
      params.push(jobId);
    }

    if (stage) {
      conditions.push('a.current_stage = ?');
      params.push(stage);
    }

    if (search) {
      conditions.push('(u.full_name LIKE ? OR u.email LIKE ? OR j.title LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [countRows] = await db.query(
      `SELECT COUNT(*) as total
       FROM applications a
       JOIN users u ON a.candidate_id = u.id
       JOIN jobs j ON a.job_id = j.id
       ${whereClause}`,
      params
    );
    const total = countRows[0].total;

    const [rows] = await db.query(
      `SELECT a.id, a.job_id, a.candidate_id, a.resume_id, a.current_stage, a.applied_at, a.updated_at,
              j.title as job_title, j.department, j.location,
              u.full_name as candidate_name, u.email as candidate_email,
              cp.phone as candidate_phone, cp.experience_years, cp.skills_json, cp.linkedin_url,
              r.original_filename as resume_filename,
              (SELECT COUNT(*) FROM interviews WHERE application_id = a.id) as interview_count,
              o.id as offer_id, o.status as offer_status
       FROM applications a
       JOIN users u ON a.candidate_id = u.id
       JOIN jobs j ON a.job_id = j.id
       LEFT JOIN candidate_profiles cp ON u.id = cp.user_id
       LEFT JOIN resumes r ON a.resume_id = r.id
       LEFT JOIN offers o ON a.id = o.application_id
       ${whereClause}
       ORDER BY a.updated_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit, 10), offset]
    );

    return {
      data: rows.map(r => {
        let skills = [];
        try {
          skills = typeof r.skills_json === 'string' ? JSON.parse(r.skills_json) : (r.skills_json || []);
        } catch (e) {
          skills = [];
        }
        return {
          ...r,
          skills
        };
      }),
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Controlled state machine transition with mandatory audit log & notification
   */
  async transitionStage(applicationId, changedById, { toStage, notes }) {
    if (!VALID_STAGES.includes(toStage)) {
      const error = new Error(`Invalid stage '${toStage}'. Valid stages are: ${VALID_STAGES.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }

    // 1. Fetch current application state
    const [apps] = await db.query(
      `SELECT a.id, a.current_stage, a.candidate_id, a.job_id,
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
    const fromStage = app.current_stage;

    if (fromStage === toStage) {
      const error = new Error(`Application is already in '${toStage}' stage.`);
      error.statusCode = 400;
      throw error;
    }

    // 2. Update Application stage
    await db.query(
      'UPDATE applications SET current_stage = ?, updated_at = NOW() WHERE id = ?',
      [toStage, applicationId]
    );

    // 3. Mandatory Audit Log entry
    await db.query(
      `INSERT INTO application_audit_logs (application_id, changed_by, from_stage, to_stage, notes, changed_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [applicationId, changedById, fromStage, toStage, notes || `Stage transitioned from ${fromStage} to ${toStage}`]
    );

    // 4. Trigger event notification
    await notificationService.sendNotification({
      recipientEmail: app.candidate_email,
      eventType: 'APPLICATION_STAGE_CHANGED',
      subject: `Update on your application for ${app.job_title}`,
      payload: {
        applicationId,
        fromStage,
        toStage,
        jobTitle: app.job_title,
        candidateName: app.candidate_name,
        notes: notes || null
      }
    });

    return this.getApplicationById(applicationId);
  }

  /**
   * Helper to retrieve full single application object
   */
  async getApplicationById(applicationId) {
    const [rows] = await db.query(
      `SELECT a.id, a.job_id, a.candidate_id, a.resume_id, a.current_stage, a.applied_at, a.updated_at,
              j.title as job_title, j.department, j.location,
              u.full_name as candidate_name, u.email as candidate_email,
              r.original_filename as resume_filename
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       JOIN users u ON a.candidate_id = u.id
       LEFT JOIN resumes r ON a.resume_id = r.id
       WHERE a.id = ? LIMIT 1`,
      [applicationId]
    );

    if (rows.length === 0) {
      return null;
    }

    const [timeline] = await db.query(
      `SELECT aal.id, aal.from_stage, aal.to_stage, aal.notes, aal.changed_at,
              u.full_name as changed_by_name, u.role as changed_by_role
       FROM application_audit_logs aal
       JOIN users u ON aal.changed_by = u.id
       WHERE aal.application_id = ?
       ORDER BY aal.changed_at ASC`,
      [applicationId]
    );

    return {
      ...rows[0],
      timeline
    };
  }
}

module.exports = new ApplicationService();

