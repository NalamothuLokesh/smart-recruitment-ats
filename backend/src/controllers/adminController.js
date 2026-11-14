const adminService = require('../services/adminService');

class AdminController {
  async getUsers(req, res, next) {
    try {
      const { page, limit, role, search } = req.query;
      const result = await adminService.getUsers({
        page,
        limit,
        role,
        search,
        orgId: req.user.org_id
      });

      res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  async createUser(req, res, next) {
    try {
      const { fullName, email, password, role } = req.body;
      const newUser = await adminService.createUser({
        orgId: req.user.org_id,
        fullName,
        email,
        password,
        role
      });

      res.status(201).json({
        success: true,
        message: `User '${fullName}' provisioned successfully with role '${role}'.`,
        data: newUser
      });
    } catch (error) {
      next(error);
    }
  }

  async updateUserRole(req, res, next) {
    try {
      const { id } = req.params;
      const { role } = req.body;
      const result = await adminService.updateUserRole(id, role);

      res.status(200).json({
        success: true,
        message: 'User role updated successfully.',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async updateUserStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const result = await adminService.updateUserStatus(id, isActive);

      res.status(200).json({
        success: true,
        message: `User status changed to ${isActive ? 'active' : 'inactive'}.`,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getAuditLogs(req, res, next) {
    try {
      const { page, limit, applicationId } = req.query;
      const result = await adminService.getAuditLogs({ page, limit, applicationId });

      res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminController();

