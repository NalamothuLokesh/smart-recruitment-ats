import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/client';
import { ShieldCheck, UserPlus, Users, Activity, CheckCircle2, XCircle, Search, RefreshCw, KeyRound } from 'lucide-react';

/**
 * ============================================================================
 * MODULE: AdminDashboard.jsx
 * ASSIGNED TO: // TODO: [Teammate 4: Administration, Security & Analytics Engineer]
 * PAIR MODULE: src/modules/analytics/HiringAnalyticsPage.jsx
 * 
 * RESPONSIBILITIES:
 * 1. User Directory management (search, filter by role).
 * 2. Role alteration: Change user role between ADMIN, HR, CANDIDATE.
 * 3. User activation / deactivation toggling.
 * 4. Provisioning new internal HR or Admin accounts.
 * 5. System-wide audit log timeline table.
 * 
 * PRE-WIRED API HOOKS AVAILABLE:
 * - adminApi.getUsers({ page, limit, role, search })
 * - adminApi.createUser({ fullName, email, password, role })
 * - adminApi.updateUserRole(userId, newRole)
 * - adminApi.updateUserStatus(userId, isActive)
 * - adminApi.getAuditLogs({ page, limit })
 * ============================================================================
 */
export const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'provision' | 'audit'
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Provision Form State
  const [newUserData, setNewUserData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'HR'
  });

  // Fetch Users
  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getUsers({ search, role: roleFilter, limit: 50 });
      setUsers(res.data || []);
    } catch (err) {
      setFeedbackMsg(`Error loading users: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Audit Logs
  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getAuditLogs({ limit: 50 });
      setAuditLogs(res.data || []);
    } catch (err) {
      setFeedbackMsg(`Error loading audit logs: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') loadUsers();
    if (activeTab === 'audit') loadAuditLogs();
  }, [activeTab, roleFilter]);

  // Handler: Update Role
  const handleRoleChange = async (userId, newRole) => {
    try {
      await adminApi.updateUserRole(userId, newRole);
      setFeedbackMsg(`User ${userId} role updated to ${newRole}`);
      loadUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  // Handler: Toggle Status
  const handleStatusToggle = async (userId, currentStatus) => {
    try {
      await adminApi.updateUserStatus(userId, !currentStatus);
      setFeedbackMsg(`User ${userId} status updated`);
      loadUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  // Handler: Provision User
  const handleProvisionSubmit = async (e) => {
    e.preventDefault();
    try {
      await adminApi.createUser(newUserData);
      setFeedbackMsg(`Successfully provisioned ${newUserData.fullName} as ${newUserData.role}`);
      setNewUserData({ fullName: '', email: '', password: '', role: 'HR' });
      setActiveTab('users');
      loadUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Administration Console</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manage organization users, role assignments, security controls, and audit trails.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'users' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Users Directory
          </button>
          <button
            onClick={() => setActiveTab('provision')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'provision' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            + Provision User
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'audit' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Audit Trail
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="my-4 p-3 bg-indigo-50 border border-indigo-200 text-indigo-800 text-sm rounded-lg flex items-center justify-between">
          <span>{feedbackMsg}</span>
          <button onClick={() => setFeedbackMsg('')} className="text-xs font-semibold hover:underline">Dismiss</button>
        </div>
      )}

      {/* TAB 1: USERS DIRECTORY */}
      {activeTab === 'users' && (
        <div className="mt-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
                className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white"
              >
                <option value="">All Roles</option>
                <option value="ADMIN">ADMIN</option>
                <option value="HR">HR</option>
                <option value="CANDIDATE">CANDIDATE</option>
              </select>

              <button
                onClick={loadUsers}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3 px-4 text-left">User</th>
                  <th className="py-3 px-4 text-left">Role</th>
                  <th className="py-3 px-4 text-left">Status</th>
                  <th className="py-3 px-4 text-left">Joined</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">{u.full_name}</div>
                      <div className="text-xs text-slate-500">{u.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className={`text-xs font-semibold px-2 py-1 rounded border ${
                          u.role === 'ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                          u.role === 'HR' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        <option value="ADMIN">ADMIN</option>
                        <option value="HR">HR</option>
                        <option value="CANDIDATE">CANDIDATE</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                        u.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {u.is_active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {u.is_active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-xs">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleStatusToggle(u.id, u.is_active)}
                        className={`text-xs font-medium px-2.5 py-1 rounded border transition-colors ${
                          u.is_active 
                            ? 'text-rose-600 border-rose-200 hover:bg-rose-50' 
                            : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'
                        }`}
                      >
                        {u.is_active ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PROVISION USER */}
      {activeTab === 'provision' && (
        <div className="mt-6 max-w-xl bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-1">Provision Internal Staff Account</h3>
          <p className="text-xs text-slate-500 mb-6">Create new Admin or HR recruiter credentials.</p>

          <form onSubmit={handleProvisionSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={newUserData.fullName}
                onChange={(e) => setNewUserData({ ...newUserData, fullName: e.target.value })}
                placeholder="Jane Smith"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Work Email</label>
              <input
                type="email"
                required
                value={newUserData.email}
                onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                placeholder="jane.hr@novatech.io"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Temporary Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={newUserData.password}
                onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                placeholder="Min 8 characters"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Role</label>
              <select
                value={newUserData.role}
                onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="HR">HR Recruiter</option>
                <option value="ADMIN">System Administrator</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm transition-colors"
            >
              Provision Account
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="mt-6 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-semibold text-slate-900">Application State Audit Logs</h3>
            <button onClick={loadAuditLogs} className="text-xs text-indigo-600 font-semibold hover:underline">
              Refresh Logs
            </button>
          </div>
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-slate-600 font-semibold">
              <tr>
                <th className="py-3 px-4 text-left">Timestamp</th>
                <th className="py-3 px-4 text-left">Candidate & Job</th>
                <th className="py-3 px-4 text-left">Transition</th>
                <th className="py-3 px-4 text-left">Changed By</th>
                <th className="py-3 px-4 text-left">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                    {new Date(log.changed_at).toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-900">{log.candidate_name}</div>
                    <div className="text-xs text-slate-500">{log.job_title}</div>
                  </td>
                  <td className="py-3 px-4 text-xs font-mono">
                    <span className="text-slate-400">{log.from_stage || 'START'}</span>
                    {' -> '}
                    <span className="font-bold text-indigo-600">{log.to_stage}</span>
                  </td>
                  <td className="py-3 px-4 text-xs">
                    <span className="font-medium text-slate-700">{log.changed_by_name}</span>{' '}
                    <span className="text-slate-400">({log.changed_by_role})</span>
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-600 max-w-xs truncate">
                    {log.notes || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

