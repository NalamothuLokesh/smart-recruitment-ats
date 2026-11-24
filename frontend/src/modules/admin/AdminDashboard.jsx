import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api/client';
import {
  ShieldCheck,
  Users,
  UserCheck,
  UserX,
  Activity,
  UserPlus,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Database,
  Wifi,
  WifiOff,
  AlertCircle,
  Briefcase,
  KeyRound,
  Calendar,
  Gift,
  CheckSquare,
  ShieldAlert
} from 'lucide-react';
import UserManagement from './UserManagement';
import AuditLogView from './AuditLogView';
import AdminInterviewScheduler from './AdminInterviewScheduler';
import AdminOfferGenerator from './AdminOfferGenerator';
import AdminOnboardingTracker from './AdminOnboardingTracker';
import AdminRbacVerification from './AdminRbacVerification';
import './admin.css';

// Baseline fallback dataset for offline/mock development mode
const SAMPLE_USERS = [
  {
    id: 1,
    org_id: 1,
    full_name: 'Sarah Connor',
    email: 'admin@novatech.io',
    role: 'ADMIN',
    is_active: true,
    created_at: '2026-01-02T09:00:00.000Z',
    org_name: 'NovaTech Innovations Inc.'
  },
  {
    id: 2,
    org_id: 1,
    full_name: 'David Miller',
    email: 'hr@novatech.io',
    role: 'HR',
    is_active: true,
    created_at: '2026-01-03T09:30:00.000Z',
    org_name: 'NovaTech Innovations Inc.'
  },
  {
    id: 3,
    org_id: 1,
    full_name: 'Alex Rivera',
    email: 'alex.rivera@example.com',
    role: 'CANDIDATE',
    is_active: true,
    created_at: '2026-01-10T10:15:00.000Z',
    org_name: 'NovaTech Innovations Inc.'
  },
  {
    id: 4,
    org_id: 1,
    full_name: 'Elena Rostova',
    email: 'elena.rostova@example.com',
    role: 'CANDIDATE',
    is_active: true,
    created_at: '2026-01-11T11:45:00.000Z',
    org_name: 'NovaTech Innovations Inc.'
  },
  {
    id: 5,
    org_id: 1,
    full_name: 'Marcus Chen',
    email: 'marcus.chen@example.com',
    role: 'CANDIDATE',
    is_active: true,
    created_at: '2026-01-12T14:20:00.000Z',
    org_name: 'NovaTech Innovations Inc.'
  },
  {
    id: 6,
    org_id: 1,
    full_name: 'Priya Sharma',
    email: 'priya.sharma@example.com',
    role: 'CANDIDATE',
    is_active: true,
    created_at: '2026-01-13T16:00:00.000Z',
    org_name: 'NovaTech Innovations Inc.'
  },
  {
    id: 7,
    org_id: 1,
    full_name: 'Jordan Hayes',
    email: 'jordan.hayes@novatech.io',
    role: 'HR',
    is_active: true,
    created_at: '2026-01-18T11:20:00.000Z',
    org_name: 'NovaTech Innovations Inc.'
  },
  {
    id: 8,
    org_id: 1,
    full_name: 'Morgan Vance',
    email: 'morgan.vance@novatech.io',
    role: 'ADMIN',
    is_active: true,
    created_at: '2026-01-20T13:45:00.000Z',
    org_name: 'NovaTech Innovations Inc.'
  },
  {
    id: 9,
    org_id: 1,
    full_name: 'Liam Gallagher',
    email: 'liam.g@example.com',
    role: 'CANDIDATE',
    is_active: false,
    created_at: '2026-01-22T08:30:00.000Z',
    org_name: 'NovaTech Innovations Inc.'
  },
  {
    id: 10,
    org_id: 1,
    full_name: 'Sophia Kim',
    email: 'sophia.kim@example.com',
    role: 'CANDIDATE',
    is_active: true,
    created_at: '2026-01-25T15:10:00.000Z',
    org_name: 'NovaTech Innovations Inc.'
  },
  {
    id: 11,
    org_id: 1,
    full_name: 'Tariq Al-Mansoor',
    email: 'tariq.m@novatech.io',
    role: 'HR',
    is_active: false,
    created_at: '2026-02-01T10:00:00.000Z',
    org_name: 'NovaTech Innovations Inc.'
  },
  {
    id: 12,
    org_id: 1,
    full_name: 'Rachel Green',
    email: 'rachel.green@example.com',
    role: 'CANDIDATE',
    is_active: true,
    created_at: '2026-02-05T14:15:00.000Z',
    org_name: 'NovaTech Innovations Inc.'
  }
];

const SAMPLE_AUDIT_LOGS = [
  {
    id: 101,
    changed_at: '2026-02-10T14:32:00Z',
    candidate_name: 'Alex Rivera',
    job_title: 'Senior Full-Stack Engineer',
    from_stage: 'INTERVIEW',
    to_stage: 'SELECTED',
    changed_by_name: 'David Miller',
    changed_by_role: 'HR',
    notes: 'Candidate completed final technical round with strong architecture scorecard.'
  },
  {
    id: 102,
    changed_at: '2026-02-09T11:15:00Z',
    candidate_name: 'Elena Rostova',
    job_title: 'Lead Cloud DevOps Architect',
    from_stage: 'APPLIED',
    to_stage: 'SCREENING',
    changed_by_name: 'David Miller',
    changed_by_role: 'HR',
    notes: 'Initial resume screening passed. Kubernetes & Terraform experience verified.'
  },
  {
    id: 103,
    changed_at: '2026-02-08T16:45:00Z',
    candidate_name: 'Sarah Connor',
    job_title: 'System Access Control',
    from_stage: 'PROVISION',
    to_stage: 'ROLE_ASSIGNED',
    changed_by_name: 'Sarah Connor',
    changed_by_role: 'ADMIN',
    notes: 'Elevated David Miller privileges to HR Recruiter.'
  },
  {
    id: 104,
    changed_at: '2026-02-07T09:20:00Z',
    candidate_name: 'Marcus Chen',
    job_title: 'Product Design Lead',
    from_stage: 'SCREENING',
    to_stage: 'INTERVIEW',
    changed_by_name: 'Jordan Hayes',
    changed_by_role: 'HR',
    notes: 'Portfolio review complete. Scheduled for round 1 behavioral.'
  },
  {
    id: 105,
    changed_at: '2026-02-05T17:00:00Z',
    candidate_name: 'Liam Gallagher',
    job_title: 'Security Governance',
    from_stage: 'ACTIVE',
    to_stage: 'DEACTIVATED',
    changed_by_name: 'Morgan Vance',
    changed_by_role: 'ADMIN',
    notes: 'Account suspended in accordance with security lifecycle retention.'
  }
];

export const AdminDashboard = () => {
  const [users, setUsers] = useState(SAMPLE_USERS);
  const [auditLogs, setAuditLogs] = useState(SAMPLE_AUDIT_LOGS);
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'activity' | 'interviews' | 'offers' | 'rbac' | 'provision'
  const [offersSubTab, setOffersSubTab] = useState('generator'); // 'generator' | 'onboarding'
  const [loading, setLoading] = useState(true);
  const [isLiveApi, setIsLiveApi] = useState(false);
  const [bannerNotice, setBannerNotice] = useState('');
  const [provisioning, setProvisioning] = useState(false);

  // Provision Form State
  const [newUserData, setNewUserData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'HR'
  });

  // Fetch Users from API or Fallback
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminApi.getUsers({ limit: 100 });
      if (res && res.data && Array.isArray(res.data)) {
        setUsers(res.data);
        setIsLiveApi(true);
      } else {
        throw new Error('Invalid response structure');
      }
    } catch (err) {
      console.warn('Admin API unreachable, engaging frontend development mode:', err.message);
      setIsLiveApi(false);
      // Retain or initialize local sample dataset
      setUsers((prev) => (prev && prev.length > 0 ? prev : SAMPLE_USERS));
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch Audit Logs from API or Fallback
  const loadAuditLogs = useCallback(async () => {
    try {
      const res = await adminApi.getAuditLogs({ limit: 50 });
      if (res && res.data && Array.isArray(res.data)) {
        setAuditLogs(res.data);
      }
    } catch (err) {
      console.warn('Audit logs API offline, using local audit state:', err.message);
      setAuditLogs((prev) => (prev && prev.length > 0 ? prev : SAMPLE_AUDIT_LOGS));
    }
  }, []);

  useEffect(() => {
    loadUsers();
    loadAuditLogs();
  }, [loadUsers, loadAuditLogs]);

  // Update Role Handler
  const handleUpdateRole = async (userId, newRole) => {
    if (isLiveApi) {
      await adminApi.updateUserRole(userId, newRole);
    }
    // Update local state immediately
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );

    // Record local audit entry
    const targetUser = users.find((u) => u.id === userId);
    const newAuditEntry = {
      id: Date.now(),
      changed_at: new Date().toISOString(),
      candidate_name: targetUser ? targetUser.full_name : `User #${userId}`,
      job_title: 'Access Control',
      from_stage: targetUser ? targetUser.role : 'UNKNOWN',
      to_stage: newRole,
      changed_by_name: 'Current Admin',
      changed_by_role: 'ADMIN',
      notes: `Authorization role modified to ${newRole}.`
    };
    setAuditLogs((prev) => [newAuditEntry, ...prev]);
  };

  // Toggle Status Handler
  const handleToggleStatus = async (userId, newStatus) => {
    if (isLiveApi) {
      await adminApi.updateUserStatus(userId, newStatus);
    }
    // Update local state immediately
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, is_active: newStatus } : u))
    );

    // Record local audit entry
    const targetUser = users.find((u) => u.id === userId);
    const newAuditEntry = {
      id: Date.now(),
      changed_at: new Date().toISOString(),
      candidate_name: targetUser ? targetUser.full_name : `User #${userId}`,
      job_title: 'Account Status',
      from_stage: newStatus ? 'INACTIVE' : 'ACTIVE',
      to_stage: newStatus ? 'ACTIVE' : 'DEACTIVATED',
      changed_by_name: 'Current Admin',
      changed_by_role: 'ADMIN',
      notes: `Account marked as ${newStatus ? 'Active' : 'Deactivated'}.`
    };
    setAuditLogs((prev) => [newAuditEntry, ...prev]);
  };

  // Provision Account Handler
  const handleProvisionSubmit = async (e) => {
    e.preventDefault();
    try {
      setProvisioning(true);
      if (isLiveApi) {
        const res = await adminApi.createUser(newUserData);
        if (res.data) {
          setUsers((prev) => [
            {
              id: res.data.id || Date.now(),
              org_id: res.data.orgId || 1,
              full_name: res.data.fullName,
              email: res.data.email,
              role: res.data.role,
              is_active: true,
              created_at: new Date().toISOString(),
              org_name: 'NovaTech Innovations Inc.'
            },
            ...prev
          ]);
        }
      } else {
        // Local temporary state provisioning
        const newId = Math.max(...users.map((u) => u.id), 0) + 1;
        const createdUser = {
          id: newId,
          org_id: 1,
          full_name: newUserData.fullName.trim(),
          email: newUserData.email.trim().toLowerCase(),
          role: newUserData.role,
          is_active: true,
          created_at: new Date().toISOString(),
          org_name: 'NovaTech Innovations Inc.'
        };
        setUsers((prev) => [createdUser, ...prev]);
      }

      setBannerNotice(
        `Staff account '${newUserData.fullName}' provisioned successfully with role '${newUserData.role}'.`
      );
      setNewUserData({ fullName: '', email: '', password: '', role: 'HR' });
      setActiveTab('users');
    } catch (err) {
      alert(err.message || 'Failed to provision staff account.');
    } finally {
      setProvisioning(false);
    }
  };

  // KPI Metrics Calculation
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.is_active).length;
  const inactiveUsers = totalUsers - activeUsers;
  const activePercentage = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;

  const adminCount = users.filter((u) => u.role === 'ADMIN').length;
  const hrCount = users.filter((u) => u.role === 'HR').length;
  const candidateCount = users.filter((u) => u.role === 'CANDIDATE').length;

  return (
    <div className="admin-module-container space-y-8 animate-fadeIn">
      {/* ── Top Executive Header ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 border-b border-border gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
                  System Administration Console
                </h1>
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 border border-primary/25 text-primary">
                  Member 4 · W1–W4 Complete
                </span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Manage organization identity, user access controls, RBAC roles, interviews, offers, and operational audit trails.
              </p>
            </div>
          </div>
        </div>

        {/* Live / Temporary Data Source Indicator & Tab Navigation */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Data Mode Pill */}
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
              isLiveApi
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
            }`}
            title={
              isLiveApi
                ? 'Connected to real ATS backend database API'
                : 'Backend API offline: Running in interactive frontend development mode with temporary state'
            }
          >
            {isLiveApi ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span>Live API Connected</span>
              </>
            ) : (
              <>
                <Database className="w-3.5 h-3.5 text-indigo-400" />
                <span>Frontend Dev State</span>
              </>
            )}
          </div>

          {/* Module Tabs */}
          <div className="flex bg-muted p-1 rounded-xl border border-border flex-wrap gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'users'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>User Directory</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('activity')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'activity'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Audit Trail</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('interviews')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'interviews'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Interviews</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('offers')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'offers'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Gift className="w-3.5 h-3.5" />
              <span>Offers & Onboarding</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('rbac')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'rbac'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>RBAC Matrix</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('provision')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'provision'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Provision Staff</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dismissible Banner Notification */}
      {bannerNotice && (
        <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/30 text-primary text-xs sm:text-sm flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{bannerNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setBannerNotice('')}
            className="text-xs font-bold hover:underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── KPI Metric Summary Cards (Requirement 3.A) ────────────────────── */}
      <div className="admin-stats-grid">
        {/* 1. Total Users */}
        <div className="admin-kpi-card kpi-total">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Total Users
            </span>
            <div className="admin-kpi-icon-wrap bg-indigo-500/10 text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-foreground tracking-tight">
              {totalUsers}
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              Registered Accounts
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            System-wide directory across all roles
          </p>
        </div>

        {/* 2. Active Users */}
        <div className="admin-kpi-card kpi-active">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Active Users
            </span>
            <div className="admin-kpi-icon-wrap bg-emerald-500/10 text-emerald-400">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-foreground tracking-tight">
              {activeUsers}
            </span>
            <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              {activePercentage}%
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            Authorized and active in current session
          </p>
        </div>

        {/* 3. Inactive Users */}
        <div className="admin-kpi-card kpi-inactive">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Inactive Users
            </span>
            <div className="admin-kpi-icon-wrap bg-rose-500/10 text-rose-400">
              <UserX className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-foreground tracking-tight">
              {inactiveUsers}
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              Deactivated
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            Access revoked or suspended accounts
          </p>
        </div>

        {/* 4. Role Breakdown Summary */}
        <div className="admin-kpi-card kpi-breakdown">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Role Distribution
            </span>
            <div className="admin-kpi-icon-wrap bg-purple-500/10 text-purple-400">
              <KeyRound className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-center gap-2 flex-wrap">
            <span className="role-pill-metric role-pill-admin text-xs">
              <span className="font-bold">{adminCount}</span> Admins
            </span>
            <span className="role-pill-metric role-pill-hr text-xs">
              <span className="font-bold">{hrCount}</span> HR
            </span>
            <span className="role-pill-metric role-pill-candidate text-xs">
              <span className="font-bold">{candidateCount}</span> Candidates
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            Privilege segmentation ratio
          </p>
        </div>
      </div>

      {/* ── TAB 1: User Management Directory (Requirements 3.B, 3.C, 3.D) ──── */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Organizational Directory
              </h2>
              <p className="text-xs text-muted-foreground">
                Search, filter, inspect profiles, and assign access roles.
              </p>
            </div>
          </div>

          <UserManagement
            users={users}
            loading={loading}
            isLiveApi={isLiveApi}
            onRefresh={loadUsers}
            onUpdateRole={handleUpdateRole}
            onToggleStatus={handleToggleStatus}
            onProvisionUser={() => setActiveTab('provision')}
          />
        </div>
      )}

      {/* ── TAB 2: Recent User Activity & System Audit Trail (W2 Requirements) ── */}
      {activeTab === 'activity' && (
        <AuditLogView
          auditLogs={auditLogs}
          loading={loading}
          onRefresh={loadAuditLogs}
        />
      )}

      {/* ── TAB 3: Interview Scheduling & Scorecards (W3 Requirements) ──────── */}
      {activeTab === 'interviews' && (
        <AdminInterviewScheduler />
      )}

      {/* ── TAB 4: Offer Letters & Pre-Hire Onboarding (W3 & W4 Requirements) ─ */}
      {activeTab === 'offers' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="p-4 rounded-xl bg-card border border-border shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">
                  Offers & Pre-Hire Onboarding Operations
                </h2>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Generate formal compensation letters with live Markdown preview, and monitor pre-hire checklist completion.
              </p>
            </div>

            <div className="flex items-center bg-muted p-1 rounded-xl border border-border self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setOffersSubTab('generator')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  offersSubTab === 'generator'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Gift className="w-3.5 h-3.5" />
                <span>Offer Letter Generator</span>
              </button>
              <button
                type="button"
                onClick={() => setOffersSubTab('onboarding')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  offersSubTab === 'onboarding'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Onboarding Checklist</span>
              </button>
            </div>
          </div>

          {offersSubTab === 'generator' ? (
            <AdminOfferGenerator />
          ) : (
            <AdminOnboardingTracker />
          )}
        </div>
      )}

      {/* ── TAB 5: Live RBAC Route & Security Verification (W4 Requirements) ── */}
      {activeTab === 'rbac' && (
        <AdminRbacVerification />
      )}

      {/* ── TAB 6: Provision Staff Account ──────────────────────────────────── */}
      {activeTab === 'provision' && (
        <div className="max-w-2xl mx-auto p-6 rounded-2xl bg-card border border-border shadow-md space-y-6 animate-fadeIn">
          <div className="border-b border-border pb-4">
            <div className="flex items-center gap-2 text-primary mb-1">
              <UserPlus className="w-5 h-5" />
              <h2 className="text-lg font-bold text-foreground">
                Provision Internal Staff Account
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Create an administrative or recruiter credential with immediate organizational access.
            </p>
          </div>

          <form onSubmit={handleProvisionSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1 uppercase tracking-wider">
                Full Name <span className="text-primary">*</span>
              </label>
              <input
                type="text"
                required
                value={newUserData.fullName}
                onChange={(e) => setNewUserData({ ...newUserData, fullName: e.target.value })}
                placeholder="e.g. Jane Foster"
                className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-background border border-border text-foreground outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1 uppercase tracking-wider">
                Work Email Address <span className="text-primary">*</span>
              </label>
              <input
                type="email"
                required
                value={newUserData.email}
                onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                placeholder="jane.foster@novatech.io"
                className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-background border border-border text-foreground outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1 uppercase tracking-wider">
                Initial Password <span className="text-primary">*</span>
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={newUserData.password}
                onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                placeholder="Minimum 8 characters"
                className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-background border border-border text-foreground outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Must be at least 8 characters. The user will be required to change this upon login.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1 uppercase tracking-wider">
                Organizational Role <span className="text-primary">*</span>
              </label>
              <select
                value={newUserData.role}
                onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-background border border-border text-foreground outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all cursor-pointer"
              >
                <option value="HR">HR Recruiter (HR)</option>
                <option value="ADMIN">System Administrator (ADMIN)</option>
              </select>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('users')}
                className="btn btn-outline btn-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={provisioning}
                className="btn btn-primary btn-sm flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{provisioning ? 'Provisioning...' : 'Provision Account'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
