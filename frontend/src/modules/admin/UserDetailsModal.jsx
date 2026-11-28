import React, { useEffect, useState } from 'react';
import {
  User,
  Mail,
  Calendar,
  Building,
  Shield,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  X,
  Edit2,
  Power
} from 'lucide-react';

export const UserDetailsModal = ({
  isOpen,
  user,
  onClose,
  onEditRole,
  onToggleStatus,
  actionLoading = false,
}) => {
  const [copied, setCopied] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const handleCopyEmail = () => {
    if (user.email) {
      navigator.clipboard.writeText(user.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const userInitials = user.full_name
    ? user.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  const formattedDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

  return (
    <div
      className="admin-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-details-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="admin-modal-dialog max-w-lg">
        {/* Header */}
        <div className="admin-modal-header">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 id="user-details-title" className="text-base font-bold text-foreground">
                User Profile Dossier
              </h2>
              <p className="text-xs text-muted-foreground">
                Comprehensive identity and governance records
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="admin-modal-body space-y-6">
          {/* Identity Header Card */}
          <div className="p-4 rounded-xl bg-card-elevated border border-border flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-extrabold text-lg flex items-center justify-center shadow-md flex-shrink-0">
              {userInitials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base text-foreground truncate">
                  {user.full_name}
                </h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-background border border-border text-muted-foreground">
                  ID #{user.id}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  title="Copy email"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Key Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Role */}
            <div className="p-3 rounded-lg bg-card border border-border">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-semibold uppercase tracking-wider text-[11px]">Role</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className={`admin-role-badge admin-role-${user.role}`}>
                  {user.role}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEditRole(user);
                  }}
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <Edit2 className="w-3 h-3" />
                  Edit
                </button>
              </div>
            </div>

            {/* Account Status */}
            <div className="p-3 rounded-lg bg-card border border-border">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                <Power className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-semibold uppercase tracking-wider text-[11px]">Account Status</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span
                  className={`admin-status-badge ${
                    user.is_active ? 'admin-status-active' : 'admin-status-inactive'
                  }`}
                >
                  <span className="admin-status-dot" />
                  {user.is_active ? 'Active' : 'Deactivated'}
                </span>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => onToggleStatus(user.id, user.is_active)}
                  className={`text-xs font-semibold hover:underline ${
                    user.is_active ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {user.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>

            {/* Registration Date */}
            <div className="p-3 rounded-lg bg-card border border-border">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold uppercase tracking-wider text-[11px]">Registration Date</span>
              </div>
              <p className="text-xs font-medium text-foreground mt-1">
                {formattedDate}
              </p>
            </div>

            {/* Organization */}
            <div className="p-3 rounded-lg bg-card border border-border">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold uppercase tracking-wider text-[11px]">Organization</span>
              </div>
              <p className="text-xs font-medium text-foreground mt-1 truncate">
                {user.org_name || 'NovaTech Innovations Inc.'}
              </p>
            </div>
          </div>

          {/* Role Summary Note */}
          <div className="p-3 rounded-lg bg-muted/40 border border-border text-xs text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">Role Scope: </span>
            {user.role === 'ADMIN' &&
              'Full administrative access to organizational settings, account provisioning, role management, and audit inspection.'}
            {user.role === 'HR' &&
              'Recruitment operations permissions for job posting, applicant pipeline progression, interview booking, and offer generation.'}
            {user.role === 'CANDIDATE' &&
              'Standard external candidate privileges for browsing open requisitions, applying with CVs, and tracking application milestones.'}
          </div>
        </div>

        {/* Footer */}
        <div className="admin-modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-outline btn-sm"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onEditRole(user);
            }}
            className="btn btn-primary btn-sm flex items-center gap-1.5"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Edit Role</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;
