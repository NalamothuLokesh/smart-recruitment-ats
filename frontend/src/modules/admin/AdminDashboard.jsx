import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { adminApi, jobsApi } from '../../api/client';
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
  ShieldAlert,
  LayoutDashboard,
  BarChart3,
  FileText,
  ExternalLink,
  ArrowRight,
  TrendingUp,
  UserCog
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
  const location = useLocation();
  const navigate = useNavigate();

  const getInitialTab = useCallback(() => {
    if (location.pathname === '/admin/audit') return 'activity';
    if (location.pathname === '/admin/users') return 'users';
    const params = new URLSearchParams(location.search);
    const qTab = params.get('tab');
    if (qTab && ['overview', 'users', 'activity', 'interviews', 'offers', 'rbac', 'provision'].includes(qTab)) {
      return qTab;
    }
    return 'overview';
  }, [location.pathname, location.search]);

  const [users, setUsers] = useState(SAMPLE_USERS);
  const [auditLogs, setAuditLogs] = useState(SAMPLE_AUDIT_LOGS);
  const [jobs, setJobs] = useState([]);
  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [offersSubTab, setOffersSubTab] = useState('generator'); // 'generator' | 'onboarding'

  useEffect(() => {
    setActiveTab(getInitialTab());
  }, [getInitialTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'overview') {
      navigate('/admin');
    } else if (tab === 'users') {
      navigate('/admin/users');
    } else if (tab === 'activity') {
      navigate('/admin/audit');
    } else {
      navigate(`/admin?tab=${tab}`);
    }
  };
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

  // Fetch Jobs from API or Fallback (for Open Job Positions metric)
  const loadJobs = useCallback(async () => {
    try {
      const res = await jobsApi.listJobs();
      if (res && res.data && Array.isArray(res.data)) {
        setJobs(res.data);
      }
    } catch (err) {
      console.warn('Jobs API unreachable, using empty jobs state:', err.message);
    }
  }, []);

  useEffect(() => {
    loadUsers();
    loadAuditLogs();
    loadJobs();
  }, [loadUsers, loadAuditLogs, loadJobs]);

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

  const adminPct = totalUsers > 0 ? Math.round((adminCount / totalUsers) * 100) : 0;
  const hrPct = totalUsers > 0 ? Math.round((hrCount / totalUsers) * 100) : 0;
  const candidatePct = totalUsers > 0 ? Math.round((candidateCount / totalUsers) * 100) : 0;

  const openJobsCount = jobs.filter((j) => j.status === 'PUBLISHED').length;
  const totalJobsCount = jobs.length;

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
              onClick={() => handleTabChange('overview')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'overview'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Overview</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('users')}
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
              onClick={() => handleTabChange('activity')}
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
              onClick={() => handleTabChange('interviews')}
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
              onClick={() => handleTabChange('offers')}
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
              onClick={() => handleTabChange('rbac')}
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
              onClick={() => handleTabChange('provision')}
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

      {/* ── Admin Quick Actions (Requirement 5) ───────────────────────────── */}
      <div className="p-4 rounded-xl bg-card border border-border shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-foreground">
              Admin Quick Actions
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground">
            Fast shortcuts to operational modules and system workflows
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 mt-3">
          <button
            type="button"
            onClick={() => handleTabChange('users')}
            className="flex items-center gap-2.5 p-2.5 rounded-lg bg-background hover:bg-muted border border-border hover:border-indigo-500/50 text-foreground transition-all group text-left shadow-sm"
          >
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 transition-colors flex-shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div className="truncate">
              <span className="block font-bold text-xs text-foreground">Manage Users</span>
              <span className="text-[10px] text-muted-foreground hidden sm:block">Directory & status</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('activity')}
            className="flex items-center gap-2.5 p-2.5 rounded-lg bg-background hover:bg-muted border border-border hover:border-emerald-500/50 text-foreground transition-all group text-left shadow-sm"
          >
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors flex-shrink-0">
              <Activity className="w-4 h-4" />
            </div>
            <div className="truncate">
              <span className="block font-bold text-xs text-foreground">View Audit Logs</span>
              <span className="text-[10px] text-muted-foreground hidden sm:block">System audit trail</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('users')}
            className="flex items-center gap-2.5 p-2.5 rounded-lg bg-background hover:bg-muted border border-border hover:border-purple-500/50 text-foreground transition-all group text-left shadow-sm"
          >
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 transition-colors flex-shrink-0">
              <UserCog className="w-4 h-4" />
            </div>
            <div className="truncate">
              <span className="block font-bold text-xs text-foreground">Manage Roles</span>
              <span className="text-[10px] text-muted-foreground hidden sm:block">Assign RBAC access</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate('/analytics')}
            className="flex items-center gap-2.5 p-2.5 rounded-lg bg-background hover:bg-muted border border-border hover:border-amber-500/50 text-foreground transition-all group text-left shadow-sm"
          >
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 transition-colors flex-shrink-0">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div className="truncate flex-1">
              <div className="flex items-center gap-1">
                <span className="block font-bold text-xs text-foreground">Hiring Analytics</span>
                <ExternalLink className="w-2.5 h-2.5 text-muted-foreground" />
              </div>
              <span className="text-[10px] text-muted-foreground hidden sm:block">Funnel insights</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate('/hr/jobs')}
            className="flex items-center gap-2.5 p-2.5 rounded-lg bg-background hover:bg-muted border border-border hover:border-blue-500/50 text-foreground transition-all group text-left shadow-sm"
          >
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition-colors flex-shrink-0">
              <Briefcase className="w-4 h-4" />
            </div>
            <div className="truncate flex-1">
              <div className="flex items-center gap-1">
                <span className="block font-bold text-xs text-foreground">Job Requisitions</span>
                <ExternalLink className="w-2.5 h-2.5 text-muted-foreground" />
              </div>
              <span className="text-[10px] text-muted-foreground hidden sm:block">Manage positions</span>
            </div>
          </button>
        </div>
      </div>

      {/* ── KPI Metric Summary Cards (Requirement 2: Dashboard KPIs) ───────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* 1. Total Users */}
        <div className="admin-kpi-card kpi-total">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Total Users
            </span>
            <div className="admin-kpi-icon-wrap bg-indigo-500/10 text-indigo-400" style={{ width: '2.25rem', height: '2.25rem' }}>
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              {totalUsers}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Registered directory accounts
          </p>
        </div>

        {/* 2. Active Users */}
        <div className="admin-kpi-card kpi-active">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Active Users
            </span>
            <div className="admin-kpi-icon-wrap bg-emerald-500/10 text-emerald-400" style={{ width: '2.25rem', height: '2.25rem' }}>
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              {activeUsers}
            </span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              {activePercentage}%
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Currently authorized & active
          </p>
        </div>

        {/* 3. Inactive Users */}
        <div className="admin-kpi-card kpi-inactive">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Inactive Users
            </span>
            <div className="admin-kpi-icon-wrap bg-rose-500/10 text-rose-400" style={{ width: '2.25rem', height: '2.25rem' }}>
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              {inactiveUsers}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Suspended or revoked accounts
          </p>
        </div>

        {/* 4. HR Users */}
        <div className="admin-kpi-card kpi-hr">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              HR Users
            </span>
            <div className="admin-kpi-icon-wrap bg-blue-500/10 text-blue-400" style={{ width: '2.25rem', height: '2.25rem' }}>
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              {hrCount}
            </span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30">
              {hrPct}%
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Recruiting team members
          </p>
        </div>

        {/* 5. Candidates */}
        <div className="admin-kpi-card kpi-candidates">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Candidates
            </span>
            <div className="admin-kpi-icon-wrap bg-purple-500/10 text-purple-400" style={{ width: '2.25rem', height: '2.25rem' }}>
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              {candidateCount}
            </span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400 border border-purple-500/30">
              {candidatePct}%
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Applicants & active profiles
          </p>
        </div>

        {/* 6. Open Job Positions */}
        <div className="admin-kpi-card kpi-jobs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Open Positions
            </span>
            <div className="admin-kpi-icon-wrap bg-amber-500/10 text-amber-400" style={{ width: '2.25rem', height: '2.25rem' }}>
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              {openJobsCount}
            </span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
              {totalJobsCount} total
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Published active requisitions
          </p>
        </div>
      </div>

      {/* ── TAB 0: Executive Overview Landing Page ─────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1: User Role Distribution Widget */}
            <div className="p-5 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold text-foreground">
                      User Role Distribution
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTabChange('rbac')}
                    className="text-xs text-primary hover:underline font-semibold"
                  >
                    View RBAC Matrix
                  </button>
                </div>

                <p className="text-xs text-muted-foreground mt-3">
                  System privilege breakdown across all provisioned accounts in this organization.
                </p>

                {/* Visual Segmented Bar */}
                <div className="mt-4 h-3 w-full rounded-full bg-muted overflow-hidden flex">
                  <div
                    style={{ width: `${adminPct}%` }}
                    className="bg-purple-500 h-full transition-all"
                    title={`Admins: ${adminCount} (${adminPct}%)`}
                  />
                  <div
                    style={{ width: `${hrPct}%` }}
                    className="bg-blue-500 h-full transition-all"
                    title={`HR: ${hrCount} (${hrPct}%)`}
                  />
                  <div
                    style={{ width: `${candidatePct}%` }}
                    className="bg-emerald-500 h-full transition-all"
                    title={`Candidates: ${candidateCount} (${candidatePct}%)`}
                  />
                </div>

                {/* Role Details List */}
                <div className="mt-5 space-y-3">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-purple-500/5 border border-purple-500/20">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                      <div>
                        <span className="text-xs font-bold text-foreground block">
                          Administrators (ADMIN)
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          Full system control, user provisioning, security audits
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-foreground block">
                        {adminCount}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {adminPct}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-500/5 border border-blue-500/20">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                      <div>
                        <span className="text-xs font-bold text-foreground block">
                          HR Recruiters (HR)
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          Job requisitions, pipeline, interviews, offers
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-foreground block">
                        {hrCount}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {hrPct}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <div>
                        <span className="text-xs font-bold text-foreground block">
                          Candidates (CANDIDATE)
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          Job applications, status tracker, onboarding
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-foreground block">
                        {candidateCount}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {candidatePct}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-border flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Need to change user roles?
                </span>
                <button
                  type="button"
                  onClick={() => handleTabChange('users')}
                  className="font-bold text-primary hover:underline flex items-center gap-1"
                >
                  Manage Directory <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Column 2 & 3: Recent System Activity Feed */}
            <div className="lg:col-span-2 p-5 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-bold text-foreground">
                      Recent System Activity & Audit Events
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTabChange('activity')}
                    className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
                  >
                    View All {auditLogs.length} Events <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <p className="text-xs text-muted-foreground mt-3">
                  Live operational feed recording recent administrative, candidate, and recruitment pipeline transitions.
                </p>

                {/* Activity List */}
                <div className="mt-4 divide-y divide-border/60">
                  {auditLogs.slice(0, 5).map((log, idx) => {
                    const timeStr = log.changed_at
                      ? new Date(log.changed_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'Just now';

                    return (
                      <div key={log.id || idx} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex items-start gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-xs font-bold text-foreground flex-shrink-0 mt-0.5">
                            {log.changed_by_role === 'ADMIN' ? 'AD' : 'HR'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-foreground">
                                {log.candidate_name || `Event #${log.id}`}
                              </span>
                              {log.job_title && (
                                <span className="text-[11px] text-muted-foreground">
                                  · {log.job_title}
                                </span>
                              )}
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                {log.from_stage && log.to_stage ? `${log.from_stage} → ${log.to_stage}` : (log.to_stage || 'UPDATED')}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {log.notes || `State changed by ${log.changed_by_name || 'System Operator'}`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground self-end sm:self-center flex-shrink-0">
                          <Clock className="w-3 h-3" />
                          <span>{timeStr}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-border flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Audit logs support RFC-4180 CSV export & date filtering.
                </span>
                <button
                  type="button"
                  onClick={() => handleTabChange('activity')}
                  className="font-bold text-primary hover:underline flex items-center gap-1"
                >
                  Explore Audit Log View <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
