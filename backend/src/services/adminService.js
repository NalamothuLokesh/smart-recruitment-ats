const bcrypt = require('bcryptjs');
const db = require('../config/db');

class AdminService {
  /**
   * Paginated list of users with optional role & search filtering
   */
  async getUsers({ page = 1, limit = 20, role, search, orgId }) {
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const params = [];
    const conditions = [];

    if (role) {
      conditions.push('u.role = ?');
      params.push(role);
    }

    if (orgId) {
      conditions.push('u.org_id = ?');
      params.push(orgId);
    }

    if (search) {
      conditions.push('(u.full_name LIKE ? OR u.email LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*) as total FROM users u ${whereClause}`;
    const [countRows] = await db.query(countSql, params);
    const total = countRows[0].total;

    const dataSql = `
      SELECT u.id, u.org_id, u.full_name, u.email, u.role, u.is_active, u.created_at,
             o.name as org_name
      FROM users u
      LEFT JOIN organizations o ON u.org_id = o.id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await db.query(dataSql, [...params, parseInt(limit, 10), offset]);

    return {
      data: rows.map(r => ({
        ...r,
        is_active: Boolean(r.is_active)
      })),
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Admin-provisioned internal user (HR or Admin)
   */
  async createUser({ orgId, fullName, email, password, role }) {
    if (!['ADMIN', 'HR', 'CANDIDATE'].includes(role)) {
      const error = new Error('Invalid user role specified.');
      error.statusCode = 400;
      throw error;
    }

    const [existing] = await db.query('SELECT id FROM users WHERE email = ? LIMIT 1', [email.toLowerCase().trim()]);
    if (existing.length > 0) {
      const error = new Error('A user with this email address already exists.');
      error.statusCode = 409;
      throw error;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const [result] = await db.query(
      `INSERT INTO users (org_id, full_name, email, password_hash, role, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, TRUE, NOW())`,
      [orgId || 1, fullName.trim(), email.toLowerCase().trim(), passwordHash, role]
    );

    return {
      id: result.insertId,
      orgId: orgId || 1,
      fullName,
      email,
      role,
      isActive: true
    };
  }

  /**
   * Update user role
   */
  async updateUserRole(userId, newRole) {
    if (!['ADMIN', 'HR', 'CANDIDATE'].includes(newRole)) {
      const error = new Error('Invalid role specified.');
      error.statusCode = 400;
      throw error;
    }

    const [result] = await db.query('UPDATE users SET role = ? WHERE id = ?', [newRole, userId]);
    if (result.affectedRows === 0) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      throw error;
    }

    return { id: parseInt(userId, 10), role: newRole };
  }

  /**
   * Activate / Deactivate user status
   */
  async updateUserStatus(userId, isActive) {
    const activeValue = isActive ? 1 : 0;
    const [result] = await db.query('UPDATE users SET is_active = ? WHERE id = ?', [activeValue, userId]);
    if (result.affectedRows === 0) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      throw error;
    }

    return { id: parseInt(userId, 10), isActive: Boolean(isActive) };
  }

  /**
   * System-wide application audit logs
   */
  async getAuditLogs({ page = 1, limit = 25, applicationId }) {
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const params = [];
    const conditions = [];

    if (applicationId) {
      conditions.push('a.application_id = ?');
      params.push(applicationId);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [countRows] = await db.query(
      `SELECT COUNT(*) as total FROM application_audit_logs a ${whereClause}`,
      params
    );
    const total = countRows[0].total;

    const [rows] = await db.query(
      `SELECT a.id, a.application_id, a.from_stage, a.to_stage, a.notes, a.changed_at,
              u.full_name as changed_by_name, u.role as changed_by_role,
              j.title as job_title, cand.full_name as candidate_name
       FROM application_audit_logs a
       JOIN users u ON a.changed_by = u.id
       JOIN applications app ON a.application_id = app.id
       JOIN jobs j ON app.job_id = j.id
       JOIN users cand ON app.candidate_id = cand.id
       ${whereClause}
       ORDER BY a.changed_at DESC
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
}

module.exports = new AdminService();

