import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  User,
  Users,
  Briefcase,
  AlertTriangle,
  Check,
  X,
  Loader2
} from 'lucide-react';

const ROLES = [
  {
    id: 'ADMIN',
    name: 'System Administrator',
    badgeClass: 'admin-role-ADMIN',
    icon: ShieldCheck,
    description:
      'Unrestricted organizational access: user directory, role assignments, audit logs, and system security controls.',
    isSensitive: true,
  },
  {
    id: 'HR',
    name: 'HR Recruiter',
    badgeClass: 'admin-role-HR',
    icon: Briefcase,
    description:
      'Recruitment operations: manage job requisitions, candidate pipeline, interviews, and job offers.',
    isSensitive: false,
  },
  {
    id: 'CANDIDATE',
    name: 'Candidate',
    badgeClass: 'admin-role-CANDIDATE',
    icon: User,
    description:
      'Standard public portal access: view openings, apply for roles, submit resumes, and review offer letters.',
    isSensitive: false,
  },
];

export const RoleAssignment = ({
  isOpen,
  user,
  onClose,
  onSaveRole,
  loading = false,
}) => {
  const [selectedRole, setSelectedRole] = useState('');
  const [confirmedSensitive, setConfirmedSensitive] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Reset state whenever a user is passed or modal opens
  useEffect(() => {
    if (user) {
      setSelectedRole(user.role || 'CANDIDATE');
      setConfirmedSensitive(false);
      setErrorMsg('');
    }
  }, [user, isOpen]);

  // Handle ESC key to dismiss
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen || !user) return null;

  const currentRole = user.role;
  const isChangingToAdmin = selectedRole === 'ADMIN' && currentRole !== 'ADMIN';
  const isRevokingAdmin = currentRole === 'ADMIN' && selectedRole !== 'ADMIN';
  const isSensitiveChange = isChangingToAdmin || isRevokingAdmin;
  const hasChanged = selectedRole !== currentRole;

  const canSubmit =
    hasChanged &&
    !loading &&
    (!isSensitiveChange || confirmedSensitive);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hasChanged) {
      onClose();
      return;
    }
    if (isSensitiveChange && !confirmedSensitive) {
      setErrorMsg('Please confirm understanding of sensitive role modification before proceeding.');
      return;
    }
    try {
      setErrorMsg('');
      await onSaveRole(user.id, selectedRole);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update user role.');
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

  return (
    <div
      className="admin-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="role-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div className="admin-modal-dialog">
        {/* Header */}
        <div className="admin-modal-header">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 id="role-modal-title" className="text-base font-bold text-foreground">
                Modify Role Assignment
              </h2>
              <p className="text-xs text-muted-foreground">
                Update authorization scope and permission level
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close modal"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="admin-modal-body space-y-5">
            {/* User Details Banner */}
            <div className="p-3.5 rounded-xl bg-muted/60 border border-border flex items-center gap-3">
              <div className="admin-user-avatar">
                {userInitials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-foreground truncate">
                    {user.full_name}
                  </span>
                  <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-background border border-border text-muted-foreground">
                    ID #{user.id}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-0.5">
                  Current Role
                </span>
                <span className={`admin-role-badge admin-role-${currentRole}`}>
                  {currentRole}
                </span>
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Role Selection Dropdown & Card Options */}
            <div>
              <label htmlFor="role-select" className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">
                Select New Role
              </label>

              {/* Native Dropdown for direct form access */}
              <select
                id="role-select"
                value={selectedRole}
                onChange={(e) => {
                  setSelectedRole(e.target.value);
                  setConfirmedSensitive(false);
                  setErrorMsg('');
                }}
                disabled={loading}
                className="w-full mb-3 px-3 py-2 rounded-lg text-sm bg-card border border-border text-foreground outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="ADMIN">System Administrator (ADMIN)</option>
                <option value="HR">HR Recruiter (HR)</option>
                <option value="CANDIDATE">Candidate (CANDIDATE)</option>
              </select>

              {/* Role Radio Cards for visual clarity */}
              <div className="space-y-2">
                {ROLES.map((r) => {
                  const Icon = r.icon;
                  const isSelected = selectedRole === r.id;
                  const isCurrent = currentRole === r.id;

                  return (
                    <div
                      key={r.id}
                      onClick={() => {
                        if (!loading) {
                          setSelectedRole(r.id);
                          setConfirmedSensitive(false);
                          setErrorMsg('');
                        }
                      }}
                      className={`admin-role-option-card ${isSelected ? 'selected' : ''}`}
                    >
                      <div className="mt-0.5">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'border-primary bg-primary text-white'
                              : 'border-muted-foreground/40 bg-card'
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5" strokeWidth={3} />}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-indigo-400" />
                          <span className="text-xs font-bold text-foreground">
                            {r.name}
                          </span>
                          <span className={`admin-role-badge ${r.badgeClass} text-[10px] py-0 px-1.5`}>
                            {r.id}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] font-medium text-muted-foreground ml-auto">
                              (Current)
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                          {r.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sensitive Role Confirmation Warning */}
            {isSensitiveChange && (
              <div className="admin-sensitive-callout space-y-3">
                <div className="flex items-start gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                      Sensitive Privilege Modification
                    </h4>
                    <p className="text-xs text-foreground/90 mt-1 leading-relaxed">
                      {isChangingToAdmin
                        ? 'Granting System Administrator status provides unrestricted administrative authority, including the ability to alter user roles, provision accounts, and view audit trails.'
                        : 'Revoking System Administrator status will immediately restrict this user from accessing the administration console and security controls.'}
                    </p>
                  </div>
                </div>

                <label className="flex items-start gap-2.5 pt-2 border-t border-amber-500/20 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmedSensitive}
                    onChange={(e) => setConfirmedSensitive(e.target.checked)}
                    className="mt-0.5 rounded border-amber-500/50 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-semibold text-foreground select-none">
                    I confirm that I have verified the authorization for this privilege change.
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="admin-modal-footer">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn btn-outline btn-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="btn btn-primary btn-sm flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoleAssignment;
