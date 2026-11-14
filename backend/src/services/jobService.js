const db = require('../config/db');

class JobService {
  /**
   * List jobs based on requester role and filters
   */
  async listJobs({ userRole = 'GUEST', status, department, search, page = 1, limit = 20 }) {
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const params = [];
    const conditions = [];

    // Public / Candidates can ONLY see PUBLISHED jobs
    if (userRole === 'GUEST' || userRole === 'CANDIDATE') {
      conditions.push("j.status = 'PUBLISHED'");
    } else if (status) {
      conditions.push('j.status = ?');
      params.push(status);
    }

    if (department) {
      conditions.push('j.department = ?');
      params.push(department);
    }

    if (search) {
      conditions.push('(j.title LIKE ? OR j.description LIKE ? OR j.location LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [countRows] = await db.query(`SELECT COUNT(*) as total FROM jobs j ${whereClause}`, params);
    const total = countRows[0].total;

    const [rows] = await db.query(
      `SELECT j.id, j.org_id, j.created_by, j.title, j.department, j.location,
              j.employment_type, j.description, j.requirements, j.status,
              j.published_at, j.created_at,
              u.full_name as created_by_name,
              o.name as org_name,
              (SELECT COUNT(*) FROM applications WHERE job_id = j.id) as applications_count
       FROM jobs j
       JOIN users u ON j.created_by = u.id
       JOIN organizations o ON j.org_id = o.id
       ${whereClause}
       ORDER BY j.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit, 10), offset]
    );

    return {
      data: rows,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get single job by ID
   */
  async getJobById(jobId, userRole = 'GUEST') {
    const [rows] = await db.query(
      `SELECT j.id, j.org_id, j.created_by, j.title, j.department, j.location,
              j.employment_type, j.description, j.requirements, j.status,
              j.published_at, j.created_at,
              u.full_name as created_by_name,
              o.name as org_name,
              (SELECT COUNT(*) FROM applications WHERE job_id = j.id) as applications_count
       FROM jobs j
       JOIN users u ON j.created_by = u.id
       JOIN organizations o ON j.org_id = o.id
       WHERE j.id = ? LIMIT 1`,
      [jobId]
    );

    if (rows.length === 0) {
      const error = new Error('Job posting not found.');
      error.statusCode = 404;
      throw error;
    }

    const job = rows[0];

    // If candidate or guest, ensure job is PUBLISHED
    if ((userRole === 'GUEST' || userRole === 'CANDIDATE') && job.status !== 'PUBLISHED') {
      const error = new Error('Job posting is not active.');
      error.statusCode = 404;
      throw error;
    }

    return job;
  }

  /**
   * Create a new job requisition
   */
  async createJob(creatorId, orgId, { title, department, location, employmentType, description, requirements, status = 'DRAFT' }) {
    const validStatuses = ['DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED'];
    if (!validStatuses.includes(status)) {
      status = 'DRAFT';
    }

    const publishedAt = status === 'PUBLISHED' ? new Date() : null;

    const [result] = await db.query(
      `INSERT INTO jobs (org_id, created_by, title, department, location, employment_type, description, requirements, status, published_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        orgId || 1,
        creatorId,
        title.trim(),
        department.trim(),
        location.trim(),
        employmentType || 'FULL_TIME',
        description,
        requirements,
        status,
        publishedAt
      ]
    );

    return this.getJobById(result.insertId, 'ADMIN');
  }

  /**
   * Update job posting
   */
  async updateJob(jobId, { title, department, location, employmentType, description, requirements, status }) {
    const [existing] = await db.query('SELECT status FROM jobs WHERE id = ?', [jobId]);
    if (existing.length === 0) {
      const error = new Error('Job posting not found.');
      error.statusCode = 404;
      throw error;
    }

    const currentStatus = existing[0].status;
    let publishedAtUpdate = '';
    const params = [
      title.trim(),
      department.trim(),
      location.trim(),
      employmentType,
      description,
      requirements
    ];

    if (status && status !== currentStatus) {
      params.push(status);
      if (status === 'PUBLISHED' && currentStatus !== 'PUBLISHED') {
        publishedAtUpdate = ', status = ?, published_at = NOW()';
      } else {
        publishedAtUpdate = ', status = ?';
      }
    }

    params.push(jobId);

    await db.query(
      `UPDATE jobs
       SET title = ?, department = ?, location = ?, employment_type = ?, description = ?, requirements = ? ${publishedAtUpdate}
       WHERE id = ?`,
      params
    );

    return this.getJobById(jobId, 'ADMIN');
  }

  /**
   * Update job lifecycle status
   */
  async updateJobStatus(jobId, status) {
    const validStatuses = ['DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED'];
    if (!validStatuses.includes(status)) {
      const error = new Error(`Invalid status. Allowed statuses: ${validStatuses.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }

    let sql = 'UPDATE jobs SET status = ?';
    const params = [status];

    if (status === 'PUBLISHED') {
      sql += ', published_at = COALESCE(published_at, NOW())';
    }

    sql += ' WHERE id = ?';
    params.push(jobId);

    const [result] = await db.query(sql, params);
    if (result.affectedRows === 0) {
      const error = new Error('Job posting not found.');
      error.statusCode = 404;
      throw error;
    }

    return this.getJobById(jobId, 'ADMIN');
  }
}

module.exports = new JobService();

