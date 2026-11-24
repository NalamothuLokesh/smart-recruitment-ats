import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  UserPlus,
  RefreshCw,
  X,
  ShieldAlert,
  CheckCircle,
  AlertCircle,
  Info,
  Power,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserTable } from './UserTable';
import { RoleAssignment } from './RoleAssignment';
import { UserDetailsModal } from './UserDetailsModal';

export const UserManagement = ({
  users = [],
  loading = false,
  isLiveApi = false,
  onRefresh,
  onUpdateRole,
  onToggleStatus,
  onProvisionUser,
  className = '',
}) => {
  const { user: currentUser } = useAuth();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState(''); // '' | 'ADMIN' | 'HR' | 'CANDIDATE'
  const [statusFilter, setStatusFilter] = useState(''); // '' | 'active' | 'inactive'

  // Sorting State
  const [sortField, setSortField] = useState('date'); // 'name' | 'date'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'

  // Pagination State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals State
  const [viewingUser, setViewingUser] = useState(null);
  const [editingRoleUser, setEditingRoleUser] = useState(null);
  const [statusConfirmTarget, setStatusConfirmTarget] = useState(null);
  const [roleSaving, setRoleSaving] = useState(false);
  const [togglingUserId, setTogglingUserId] = useState(null);

  // Toast Notifications State
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Filter & Search Logic
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Role filter
      if (roleFilter && u.role !== roleFilter) {
        return false;
      }

      // Status filter
      if (statusFilter === 'active' && !u.is_active) {
        return false;
      }
      if (statusFilter === 'inactive' && u.is_active) {
        return false;
      }

      // Search keyword filter (name or email or #id)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const nameMatch = u.full_name?.toLowerCase().includes(query);
        const emailMatch = u.email?.toLowerCase().includes(query);
        const idMatch = String(u.id) === query.replace(/^#/, '');
        if (!nameMatch && !emailMatch && !idMatch) {
          return false;
        }
      }

      return true;
    });
  }, [users, roleFilter, statusFilter, searchQuery]);

  // Sort Logic
  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      if (sortField === 'name') {
        const nameA = (a.full_name || '').toLowerCase();
        const nameB = (b.full_name || '').toLowerCase();
        return sortOrder === 'asc'
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      }
      if (sortField === 'date') {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      }
      return 0;
    });
  }, [filteredUsers, sortField, sortOrder]);

  // Pagination Slice
  const totalUsers = sortedUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalUsers / pageSize));

  React.useEffect(() => {
    if (page > totalPages) {
      setPage(1);
    }
  }, [page, totalPages]);

  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedUsers.slice(start, start + pageSize);
  }, [sortedUsers, page, pageSize]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder(field === 'name' ? 'asc' : 'desc');
    }
    setPage(1);
  };

  // Handle Role Save Action
  const handleSaveRole = async (userId, newRole) => {
    try {
      setRoleSaving(true);
      await onUpdateRole(userId, newRole);
      addToast(`User ID #${userId} role updated to ${newRole} successfully.`, 'success');
      setEditingRoleUser(null);
    } catch (err) {
      addToast(err.message || 'Failed to update user role.', 'error');
      throw err;
    } finally {
      setRoleSaving(false);
    }
  };

  // Trigger Status Toggle: Prompts confirmation on deactivation, checks self-lockout
  const handleRequestStatusToggle = (userId, currentStatus) => {
    // 1. Safety check: prevent deactivating own active administrator account
    if (currentUser && currentUser.id === userId && currentStatus) {
      addToast(
        'Security Protection: You cannot deactivate your own active administrative account to prevent system lockout.',
        'error'
      );
      return;
    }

    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;

    // 2. If deactivating an active user, prompt modal confirmation
    if (currentStatus) {
      setStatusConfirmTarget(targetUser);
    } else {
      // 3. Reactivating can execute directly
      executeStatusToggle(userId, false);
    }
  };

  // Execute Status Toggle Action
  const executeStatusToggle = async (userId, currentStatus) => {
    try {
      setTogglingUserId(userId);
      await onToggleStatus(userId, !currentStatus);
      const newStatusText = !currentStatus ? 'activated' : 'deactivated';
      addToast(`User ID #${userId} account has been ${newStatusText}.`, 'success');

      // Update viewing modal if open
      if (viewingUser && viewingUser.id === userId) {
        setViewingUser((prev) => ({ ...prev, is_active: !currentStatus }));
      }
      setStatusConfirmTarget(null);
    } catch (err) {
      addToast(err.message || 'Failed to alter user account status.', 'error');
    } finally {
      setTogglingUserId(null);
    }
  };

  // Reset All Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setRoleFilter('');
    setStatusFilter('');
    setPage(1);
  };

  const hasActiveFilters = Boolean(searchQuery || roleFilter || statusFilter);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search and Filters Bar */}
      <div className="p-4 rounded-xl bg-card border border-border shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        {/* Left: Search Box */}
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by full name, email, or #ID..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-8 py-2 rounded-lg text-sm bg-background border border-border text-foreground placeholder-muted-foreground outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setPage(1);
              }}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right: Filters & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Role Filter */}
          <div className="flex items-center gap-1.5">
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by user role"
              className="px-3 py-2 rounded-lg text-xs font-medium bg-background border border-border text-foreground outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="">All Roles</option>
              <option value="ADMIN">ADMIN</option>
              <option value="HR">HR</option>
              <option value="CANDIDATE">CANDIDATE</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by account status"
              className="px-3 py-2 rounded-lg text-xs font-medium bg-background border border-border text-foreground outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Deactivated Only</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-2.5 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              Reset Filters
            </button>
          )}

          {/* Refresh Button */}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              title="Refresh User Directory"
              className="px-3 py-2 rounded-lg text-xs font-medium bg-muted hover:bg-muted/80 text-foreground border border-border transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          )}

          {/* Provision Staff Button */}
          {onProvisionUser && (
            <button
              type="button"
              onClick={onProvisionUser}
              className="btn btn-primary btn-sm flex items-center gap-1.5 shadow-sm"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Provision User</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Results Summary */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span>
            Filtered to <strong className="text-foreground">{totalUsers}</strong> matching records
          </span>
          <button
            type="button"
            onClick={handleResetFilters}
            className="text-primary hover:underline font-semibold"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Users Table */}
      <UserTable
        users={paginatedUsers}
        totalUsers={totalUsers}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        onPageChange={setPage}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize);
          setPage(1);
        }}
        sortField={sortField}
        sortOrder={sortOrder}
        onSort={handleSort}
        onViewUser={(user) => setViewingUser(user)}
        onEditRole={(user) => setEditingRoleUser(user)}
        onToggleStatus={handleRequestStatusToggle}
        loading={loading}
        togglingUserId={togglingUserId}
        onResetFilters={handleResetFilters}
      />

      {/* Role Assignment Modal */}
      {editingRoleUser && (
        <RoleAssignment
          isOpen={Boolean(editingRoleUser)}
          user={editingRoleUser}
          onClose={() => setEditingRoleUser(null)}
          onSaveRole={handleSaveRole}
          loading={roleSaving}
        />
      )}

      {/* User Details Dossier Modal */}
      {viewingUser && (
        <UserDetailsModal
          isOpen={Boolean(viewingUser)}
          user={viewingUser}
          onClose={() => setViewingUser(null)}
          onEditRole={(user) => {
            setViewingUser(null);
            setEditingRoleUser(user);
          }}
          onToggleStatus={handleRequestStatusToggle}
          actionLoading={Boolean(togglingUserId)}
        />
      )}

      {/* ── Deactivation Confirmation Modal (W2 Requirement) ──────────────── */}
      {statusConfirmTarget && (
        <div
          className="admin-modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget && !togglingUserId) setStatusConfirmTarget(null);
          }}
        >
          <div className="admin-modal-dialog max-w-md">
            <div className="admin-modal-header bg-rose-500/10 border-b border-rose-500/20">
              <div className="flex items-center gap-2 text-rose-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-base font-bold text-foreground">Confirm Account Deactivation</h3>
              </div>
              <button
                type="button"
                onClick={() => setStatusConfirmTarget(null)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="admin-modal-body space-y-4">
              <p className="text-xs text-foreground/90 leading-relaxed">
                Are you sure you want to suspend and deactivate access for{' '}
                <strong className="text-foreground">{statusConfirmTarget.full_name}</strong>?
              </p>

              <div className="p-3.5 rounded-xl bg-card-elevated border border-border text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">User ID:</span>
                  <span className="font-mono font-semibold text-foreground">#{statusConfirmTarget.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-semibold text-foreground">{statusConfirmTarget.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Assigned Role:</span>
                  <span className={`admin-role-badge admin-role-${statusConfirmTarget.role} text-[10px] py-0 px-1.5`}>
                    {statusConfirmTarget.role}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  Deactivating this account immediately blocks authentication and invalidates active platform sessions.
                  You can reactivate this user at any time from this directory.
                </span>
              </div>
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                disabled={Boolean(togglingUserId)}
                onClick={() => setStatusConfirmTarget(null)}
                className="btn btn-outline btn-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={Boolean(togglingUserId)}
                onClick={() => executeStatusToggle(statusConfirmTarget.id, true)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Power className="w-3.5 h-3.5" />
                <span>{togglingUserId ? 'Deactivating...' : 'Confirm Deactivation'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Container */}
      <div className="admin-toast-container" aria-live="polite">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`admin-toast admin-toast-${toast.type}`}
            role="status"
          >
            {toast.type === 'success' && <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-400" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />}
            {toast.type === 'info' && <Info className="w-4 h-4 flex-shrink-0 text-indigo-400" />}
            <span className="flex-1 text-xs">{toast.message}</span>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="text-white/60 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserManagement;
