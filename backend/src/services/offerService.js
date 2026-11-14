const db = require('../config/db');
const notificationService = require('./notificationService');

const DEFAULT_ONBOARDING_TASKS = [
  'Review & Digitally Sign Employment Agreement',
  'Upload Government ID & Tax Verification Documents',
  'Select Hardware & Workstation Equipment Preferences',
  'Complete Direct Deposit & Payroll Enrollment',
  'Attend Virtual ATS Welcome & Orientation Session'
];

class OfferService {
  /**
   * Generate formal employment offer for candidate in SELECTED stage
   */
  async generateOffer(generatedById, { applicationId, salaryOffered, joiningDate, offerLetterContent, status = 'ISSUED' }) {
    // 1. Verify application exists
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

    // Must be in SELECTED stage (or already OFFERED for revision)
    if (!['SELECTED', 'OFFERED'].includes(app.current_stage)) {
      const error = new Error(`Cannot generate offer. Candidate current stage must be 'SELECTED', but is '${app.current_stage}'.`);
      error.statusCode = 400;
      throw error;
    }

    // Check if offer already exists for this application
    const [existingOffers] = await db.query('SELECT id FROM offers WHERE application_id = ?', [applicationId]);
    if (existingOffers.length > 0) {
      const error = new Error('An offer has already been generated for this application. Update the existing offer instead.');
      error.statusCode = 409;
      throw error;
    }

    const issuedAt = status === 'ISSUED' ? new Date() : null;

    // 2. Insert Offer
    const [offerResult] = await db.query(
      `INSERT INTO offers (application_id, generated_by, salary_offered, joining_date, offer_letter_content, status, issued_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [applicationId, generatedById, salaryOffered, joiningDate, offerLetterContent, status, issuedAt]
    );

    const offerId = offerResult.insertId;

    // 3. Promote application stage to OFFERED if not already
    if (app.current_stage !== 'OFFERED' && status === 'ISSUED') {
      await db.query('UPDATE applications SET current_stage = "OFFERED", updated_at = NOW() WHERE id = ?', [applicationId]);
      await db.query(
        `INSERT INTO application_audit_logs (application_id, changed_by, from_stage, to_stage, notes, changed_at)
         VALUES (?, ?, 'SELECTED', 'OFFERED', 'Formal offer letter issued to candidate.', NOW())`,
        [applicationId, generatedById]
      );
    }

    // 4. Populate default onboarding tasks checklist
    const joiningDateObj = new Date(joiningDate);
    for (let i = 0; i < DEFAULT_ONBOARDING_TASKS.length; i++) {
      const dueDate = new Date(joiningDateObj);
      dueDate.setDate(dueDate.getDate() - (7 - i)); // stagger due dates before joining

      await db.query(
        `INSERT INTO onboarding_tasks (offer_id, task_title, is_completed, due_date)
         VALUES (?, ?, FALSE, ?)`,
        [offerId, DEFAULT_ONBOARDING_TASKS[i], dueDate.toISOString().slice(0, 10)]
      );
    }

    // 5. Notify candidate if status is ISSUED
    if (status === 'ISSUED') {
      await notificationService.sendNotification({
        recipientEmail: app.candidate_email,
        eventType: 'OFFER_ISSUED',
        subject: `Employment Offer from NovaTech: ${app.job_title}`,
        payload: {
          offerId,
          jobTitle: app.job_title,
          salaryOffered,
          joiningDate
        }
      });
    }

    return this.getOfferById(offerId);
  }

  /**
   * Candidate responds to offer (ACCEPTED or DECLINED)
   */
  async respondToOffer(candidateId, offerId, { decision }) {
    if (!['ACCEPTED', 'DECLINED'].includes(decision)) {
      const error = new Error('Decision must be either "ACCEPTED" or "DECLINED".');
      error.statusCode = 400;
      throw error;
    }

    const [offers] = await db.query(
      `SELECT o.id, o.application_id, o.status, app.candidate_id,
              j.title as job_title, u.full_name as candidate_name
       FROM offers o
       JOIN applications app ON o.application_id = app.id
       JOIN jobs j ON app.job_id = j.id
       JOIN users u ON app.candidate_id = u.id
       WHERE o.id = ? LIMIT 1`,
      [offerId]
    );

    if (offers.length === 0) {
      const error = new Error('Offer record not found.');
      error.statusCode = 404;
      throw error;
    }

    const offer = offers[0];

    // Only candidate who owns the application can respond
    if (offer.candidate_id !== candidateId) {
      const error = new Error('Forbidden: You can only respond to your own offer.');
      error.statusCode = 403;
      throw error;
    }

    if (['ACCEPTED', 'DECLINED'].includes(offer.status)) {
      const error = new Error(`Offer has already been ${offer.status.toLowerCase()}.`);
      error.statusCode = 400;
      throw error;
    }

    // Update Offer status
    await db.query(
      'UPDATE offers SET status = ?, responded_at = NOW() WHERE id = ?',
      [decision, offerId]
    );

    // Audit log
    const notes = decision === 'ACCEPTED'
      ? 'Candidate formally accepted the employment offer.'
      : 'Candidate declined the employment offer.';

    await db.query(
      `INSERT INTO application_audit_logs (application_id, changed_by, from_stage, to_stage, notes, changed_at)
       VALUES (?, ?, 'OFFERED', 'OFFERED', ?, NOW())`,
      [offer.application_id, candidateId, notes]
    );

    // If declined, optionally move stage to REJECTED or keep track
    if (decision === 'DECLINED') {
      await db.query(
        'UPDATE applications SET current_stage = "REJECTED", updated_at = NOW() WHERE id = ?',
        [offer.application_id]
      );
    }

    return this.getOfferById(offerId);
  }

  /**
   * Retrieve single offer by ID with verification
   */
  async getOfferById(offerId) {
    const [rows] = await db.query(
      `SELECT o.id, o.application_id, o.generated_by, o.salary_offered, o.joining_date,
              o.offer_letter_content, o.status, o.issued_at, o.responded_at, o.created_at,
              app.candidate_id, u_cand.full_name as candidate_name, u_cand.email as candidate_email,
              j.title as job_title, j.department, j.location,
              u_gen.full_name as generated_by_name
       FROM offers o
       JOIN applications app ON o.application_id = app.id
       JOIN users u_cand ON app.candidate_id = u_cand.id
       JOIN users u_gen ON o.generated_by = u_gen.id
       JOIN jobs j ON app.job_id = j.id
       WHERE o.id = ? LIMIT 1`,
      [offerId]
    );

    if (rows.length === 0) return null;
    return rows[0];
  }

  /**
   * Fetch onboarding checklist for an offer
   */
  async getOnboardingTasks(offerId, user) {
    // Authorization check
    const offer = await this.getOfferById(offerId);
    if (!offer) {
      const error = new Error('Offer not found.');
      error.statusCode = 404;
      throw error;
    }

    if (user.role === 'CANDIDATE' && offer.candidate_id !== user.id) {
      const error = new Error('Forbidden: You can only view your own onboarding tasks.');
      error.statusCode = 403;
      throw error;
    }

    const [tasks] = await db.query(
      `SELECT id, offer_id, task_title, is_completed, due_date, completed_at
       FROM onboarding_tasks
       WHERE offer_id = ?
       ORDER BY due_date ASC, id ASC`,
      [offerId]
    );

    return {
      offer,
      tasks: tasks.map(t => ({
        ...t,
        is_completed: Boolean(t.is_completed)
      }))
    };
  }

  /**
   * Toggle completion state of an onboarding task
   */
  async updateOnboardingTask(taskId, isCompleted) {
    const [existing] = await db.query('SELECT * FROM onboarding_tasks WHERE id = ?', [taskId]);
    if (existing.length === 0) {
      const error = new Error('Onboarding task not found.');
      error.statusCode = 404;
      throw error;
    }

    const completedAt = isCompleted ? new Date() : null;

    await db.query(
      'UPDATE onboarding_tasks SET is_completed = ?, completed_at = ? WHERE id = ?',
      [Boolean(isCompleted), completedAt, taskId]
    );

    const [updated] = await db.query('SELECT * FROM onboarding_tasks WHERE id = ?', [taskId]);
    return {
      ...updated[0],
      is_completed: Boolean(updated[0].is_completed)
    };
  }
}

module.exports = new OfferService();

