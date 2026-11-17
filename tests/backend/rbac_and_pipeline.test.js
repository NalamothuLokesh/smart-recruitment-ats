// Polyfill for superagent / mime version conflict
const mime = require('mime');
if (!mime.getType && mime.lookup) {
  mime.getType = mime.lookup.bind(mime);
}

const request = require('supertest');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Mock db module before loading app
jest.mock('../../backend/src/config/db', () => ({
  query: jest.fn(),
  testConnection: jest.fn().mockResolvedValue({ ok: true, message: 'Mocked connection' }),
  pool: {
    end: jest.fn().mockResolvedValue(),
    getConnection: jest.fn()
  }
}));

const db = require('../../backend/src/config/db');
const app = require('../../backend/src/app');
const config = require('../../backend/src/config/env');
const applicationService = require('../../backend/src/services/applicationService');
const candidateService = require('../../backend/src/services/candidateService');

describe('ATS Backend Security, RBAC & Pipeline Test Suite', () => {
  let adminToken;
  let hrToken;
  let candidateToken;

  beforeAll(() => {
    // Generate valid test JWTs
    adminToken = jwt.sign(
      { id: 1, role: 'ADMIN', email: 'admin@novatech.io' },
      config.JWT_SECRET,
      { expiresIn: '1h' }
    );

    hrToken = jwt.sign(
      { id: 2, role: 'HR', email: 'hr@novatech.io' },
      config.JWT_SECRET,
      { expiresIn: '1h' }
    );

    candidateToken = jwt.sign(
      { id: 3, role: 'CANDIDATE', email: 'alex.rivera@example.com' },
      config.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. RBAC & Unauthorized Role Denial (403 / 401)', () => {
    test('Should return 401 Unauthorized when no Authorization header is provided', async () => {
      const response = await request(app).get('/api/v1/admin/users');
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/Authentication token is required/i);
    });

    test('Should return 403 Forbidden when CANDIDATE attempts to access Admin user management', async () => {
      // Mock user lookup in requireAuth middleware
      db.query.mockResolvedValueOnce([
        [{ id: 3, org_id: null, full_name: 'Alex Rivera', email: 'alex.rivera@example.com', role: 'CANDIDATE', is_active: 1 }]
      ]);

      const response = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${candidateToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/Forbidden/i);
    });

    test('Should return 403 Forbidden when CANDIDATE attempts to transition application stage', async () => {
      db.query.mockResolvedValueOnce([
        [{ id: 3, org_id: null, full_name: 'Alex Rivera', email: 'alex.rivera@example.com', role: 'CANDIDATE', is_active: 1 }]
      ]);

      const response = await request(app)
        .patch('/api/v1/applications/1/stage')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({ toStage: 'SCREENING', notes: 'Self promotion attempt' });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/Forbidden: Access requires one of \[HR, ADMIN\]/i);
    });
  });

  describe('2. Pipeline Stage Transitions & Mandatory Audit Logging', () => {
    test('HR should successfully transition application stage and create audit log', async () => {
      // 1. requireAuth user check
      db.query.mockResolvedValueOnce([
        [{ id: 2, org_id: 1, full_name: 'David Miller', email: 'hr@novatech.io', role: 'HR', is_active: 1 }]
      ]);

      // 2. Application lookup in transitionStage
      db.query.mockResolvedValueOnce([
        [{
          id: 1,
          current_stage: 'APPLIED',
          candidate_id: 3,
          job_id: 1,
          job_title: 'Senior Full-Stack Engineer',
          candidate_email: 'alex.rivera@example.com',
          candidate_name: 'Alex Rivera'
        }]
      ]);

      // 3. UPDATE applications
      db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      // 4. INSERT INTO application_audit_logs
      db.query.mockResolvedValueOnce([{ insertId: 101 }]);

      // 5. INSERT INTO notification_logs (from notificationService)
      db.query.mockResolvedValueOnce([{ insertId: 201 }]);

      // 6. getApplicationById query
      db.query.mockResolvedValueOnce([
        [{
          id: 1,
          job_id: 1,
          candidate_id: 3,
          resume_id: 1,
          current_stage: 'SCREENING',
          applied_at: '2026-01-14T09:00:00Z',
          updated_at: '2026-01-16T10:00:00Z',
          job_title: 'Senior Full-Stack Engineer',
          department: 'Engineering',
          location: 'Remote - USA',
          candidate_name: 'Alex Rivera',
          candidate_email: 'alex.rivera@example.com',
          resume_filename: 'Alex_Rivera_Resume.pdf'
        }]
      ]);

      // 7. getApplicationById audit timeline
      db.query.mockResolvedValueOnce([
        [
          { id: 1, from_stage: null, to_stage: 'APPLIED', notes: 'Initial application', changed_at: '2026-01-14T09:00:00Z', changed_by_name: 'Alex Rivera', changed_by_role: 'CANDIDATE' },
          { id: 101, from_stage: 'APPLIED', to_stage: 'SCREENING', notes: 'Resume verified', changed_at: '2026-01-16T10:00:00Z', changed_by_name: 'David Miller', changed_by_role: 'HR' }
        ]
      ]);

      const response = await request(app)
        .patch('/api/v1/applications/1/stage')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          toStage: 'SCREENING',
          notes: 'Resume verified'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.current_stage).toBe('SCREENING');
      expect(response.body.data.timeline).toHaveLength(2);

      // Verify that audit log query was called with correct parameters
      const auditLogCall = db.query.mock.calls.find(call =>
        typeof call[0] === 'string' && call[0].includes('INSERT INTO application_audit_logs')
      );
      expect(auditLogCall).toBeDefined();
      expect(auditLogCall[1]).toContain('SCREENING');
    });
  });

  describe('3. Hiring Analytics Empty-State & Zero-Division Safety', () => {
    test('Analytics summary handles 0 applications and empty pipeline safely without NaN or 500', async () => {
      // 1. requireAuth user check for HR
      db.query.mockResolvedValueOnce([
        [{ id: 2, org_id: 1, full_name: 'David Miller', email: 'hr@novatech.io', role: 'HR', is_active: 1 }]
      ]);

      // 2. Open jobs count (0)
      db.query.mockResolvedValueOnce([[{ open_jobs_count: 0 }]]);

      // 3. Application volume & stage counts (0)
      db.query.mockResolvedValueOnce([[
        {
          total_applications: 0,
          count_applied: 0,
          count_screening: 0,
          count_interview: 0,
          count_selected: 0,
          count_offered: 0,
          count_rejected: 0
        }
      ]]);

      // 4. Funnel counts (all 0)
      db.query.mockResolvedValueOnce([[
        {
          entered_applied: 0,
          entered_screening: 0,
          entered_interview: 0,
          entered_selected: 0,
          entered_offered: 0
        }
      ]]);

      // 5. Offer statistics (0 offers, null avg_time)
      db.query.mockResolvedValueOnce([[
        {
          total_offers: 0,
          issued_offers: 0,
          accepted_offers: 0,
          declined_offers: 0,
          avg_time_to_hire_days: null
        }
      ]]);

      // 6. Notification counts (0 notifications)
      db.query.mockResolvedValueOnce([[
        {
          total_notifications: 0,
          successful_notifications: 0,
          failed_notifications: 0
        }
      ]]);

      const response = await request(app)
        .get('/api/v1/analytics/summary')
        .set('Authorization', `Bearer ${hrToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const { kpis, funnel, offers, notifications } = response.body.data;

      // Verify zero-division safety: No nulls, NaNs, or Infinities
      expect(kpis.totalOpenJobs).toBe(0);
      expect(kpis.applicationVolume).toBe(0);
      expect(kpis.averageTimeToHireDays).toBe(0.0);
      expect(kpis.offerAcceptanceRate).toBe(0.0);
      expect(kpis.notificationDeliveryRate).toBe(100.0);

      expect(funnel.conversionRates.appliedToScreening).toBe(0.0);
      expect(funnel.conversionRates.screeningToInterview).toBe(0.0);
      expect(funnel.conversionRates.interviewToSelected).toBe(0.0);
      expect(funnel.conversionRates.selectedToOffered).toBe(0.0);
      expect(funnel.conversionRates.overallFunnelEfficiency).toBe(0.0);

      expect(offers.acceptanceRate).toBe(0.0);
      expect(notifications.deliveryRate).toBe(100.0);
    });
  });

  describe('4. Candidate Application Deletion Window', () => {
    let connection;

    beforeEach(() => {
      connection = {
        beginTransaction: jest.fn().mockResolvedValue(),
        query: jest.fn(),
        commit: jest.fn().mockResolvedValue(),
        rollback: jest.fn().mockResolvedValue(),
        release: jest.fn()
      };
      db.pool.getConnection.mockResolvedValue(connection);
    });

    test('deletes an owned, unreviewed application inside the 24-hour window', async () => {
      connection.query
        .mockResolvedValueOnce([[{ id: 41, current_stage: 'APPLIED', within_window: 1 }]])
        .mockResolvedValueOnce([[{ has_interviews: 0, has_offers: 0 }]])
        .mockResolvedValueOnce([{ affectedRows: 1 }]);

      await expect(applicationService.deleteMyApplication(7, 41)).resolves.toEqual({ id: 41 });

      expect(connection.query).toHaveBeenNthCalledWith(1, expect.stringContaining('candidate_id = ?'), [41, 7]);
      expect(connection.query).toHaveBeenNthCalledWith(3, expect.stringContaining('DELETE FROM applications'), [41, 7]);
      expect(connection.commit).toHaveBeenCalledTimes(1);
      expect(connection.rollback).not.toHaveBeenCalled();
      expect(connection.release).toHaveBeenCalledTimes(1);
    });

    test('rejects deletion after 24 hours', async () => {
      connection.query.mockResolvedValueOnce([[
        { id: 41, current_stage: 'APPLIED', within_window: 0 }
      ]]);

      await expect(applicationService.deleteMyApplication(7, 41)).rejects.toMatchObject({ statusCode: 403 });
      expect(connection.query).toHaveBeenCalledTimes(1);
      expect(connection.commit).not.toHaveBeenCalled();
      expect(connection.rollback).toHaveBeenCalledTimes(1);
    });

    test('does not allow deleting another candidate’s application', async () => {
      connection.query.mockResolvedValueOnce([[]]);

      await expect(applicationService.deleteMyApplication(7, 41)).rejects.toMatchObject({ statusCode: 404 });
      expect(connection.query).toHaveBeenCalledTimes(1);
      expect(connection.commit).not.toHaveBeenCalled();
      expect(connection.rollback).toHaveBeenCalledTimes(1);
    });

    test('preserves applications that have moved beyond the initial stage', async () => {
      connection.query.mockResolvedValueOnce([[
        { id: 41, current_stage: 'SCREENING', within_window: 1 }
      ]]);

      await expect(applicationService.deleteMyApplication(7, 41)).rejects.toMatchObject({ statusCode: 409 });
      expect(connection.query).toHaveBeenCalledTimes(1);
      expect(connection.commit).not.toHaveBeenCalled();
      expect(connection.rollback).toHaveBeenCalledTimes(1);
    });
  });

  describe('5. Candidate Resume Deletion', () => {
    let connection;
    let uploadDirectory;
    const originalUploadDirectory = config.UPLOAD_DIR;

    beforeEach(async () => {
      uploadDirectory = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'ats-resume-delete-'));
      config.UPLOAD_DIR = uploadDirectory;
      connection = {
        beginTransaction: jest.fn().mockResolvedValue(),
        query: jest.fn(),
        commit: jest.fn().mockResolvedValue(),
        rollback: jest.fn().mockResolvedValue(),
        release: jest.fn()
      };
      db.pool.getConnection.mockResolvedValue(connection);
    });

    afterEach(async () => {
      config.UPLOAD_DIR = originalUploadDirectory;
      await fs.promises.rm(uploadDirectory, { recursive: true, force: true });
    });

    test('deletes only the requesting candidate’s resume file and record', async () => {
      const filePath = path.join(uploadDirectory, 'resume-52.pdf');
      await fs.promises.writeFile(filePath, 'test resume');
      connection.query
        .mockResolvedValueOnce([[{ id: 52, file_path: filePath }]])
        .mockResolvedValueOnce([{ affectedRows: 1 }]);

      await expect(candidateService.deleteResume(7, 52)).resolves.toEqual({ id: 52 });

      expect(connection.query).toHaveBeenNthCalledWith(1, expect.stringContaining('candidate_id = ?'), [52, 7]);
      expect(connection.query).toHaveBeenNthCalledWith(2, expect.stringContaining('DELETE FROM resumes'), [52, 7]);
      await expect(fs.promises.access(filePath)).rejects.toMatchObject({ code: 'ENOENT' });
      expect(connection.commit).toHaveBeenCalledTimes(1);
      expect(connection.release).toHaveBeenCalledTimes(1);
    });

    test('restores the resume file if deleting its database record fails', async () => {
      const filePath = path.join(uploadDirectory, 'resume-52.pdf');
      await fs.promises.writeFile(filePath, 'test resume');
      connection.query
        .mockResolvedValueOnce([[{ id: 52, file_path: filePath }]])
        .mockRejectedValueOnce(new Error('Database delete failed'));

      await expect(candidateService.deleteResume(7, 52)).rejects.toThrow('Database delete failed');

      await expect(fs.promises.readFile(filePath, 'utf8')).resolves.toBe('test resume');
      expect(connection.rollback).toHaveBeenCalledTimes(1);
      expect(connection.commit).not.toHaveBeenCalled();
    });

    test('does not delete a resume owned by someone else', async () => {
      connection.query.mockResolvedValueOnce([[]]);

      await expect(candidateService.deleteResume(7, 52)).rejects.toMatchObject({ statusCode: 404 });

      expect(connection.query).toHaveBeenCalledTimes(1);
      expect(connection.commit).not.toHaveBeenCalled();
      expect(connection.rollback).toHaveBeenCalledTimes(1);
    });
  });
});

