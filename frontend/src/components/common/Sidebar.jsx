import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Briefcase,
  UserCheck,
  Kanban,
  FileText,
  Calendar,
  Gift,
  BarChart3,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
  X,
  Layers,
  Sparkles,
  Users
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) {
  const { user, isAuthenticated, isHR, isAdmin, isCandidate } = useAuth();
  const location = useLocation();
  const pathname = location.pathname;

  // Track expanded parent sections
  const [openSections, setOpenSections] = useState({
    talent: true,
    recruitment: true,
    intelligence: true,
  });

  // Auto-expand active route section
  useEffect(() => {
    if (pathname === '/jobs' || pathname === '/candidate') {
      setOpenSections((prev) => ({ ...prev, talent: true }));
    } else if (
      pathname === '/hr/jobs' ||
      pathname === '/pipeline' ||
      pathname === '/interviews' ||
      pathname === '/offers'
    ) {
      setOpenSections((prev) => ({ ...prev, recruitment: true }));
    } else if (pathname === '/analytics' || pathname === '/admin') {
      setOpenSections((prev) => ({ ...prev, intelligence: true }));
    }
  }, [pathname]);

  const toggleSection = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isJobsActive = pathname === '/jobs';
  const isCandActive = pathname === '/candidate';
  const isHrJobsActive = pathname === '/hr/jobs';
  const isPipelineActive = pathname === '/pipeline';
  const isInterviewsActive = pathname === '/interviews';
  const isOffersActive = pathname === '/offers';
  const isAnalyticsActive = pathname === '/analytics';
  const isAdminActive = pathname === '/admin';

  const userInitials = user?.fullName
    ? user.fullName
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'U';

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''} ${
          mobileOpen ? 'sidebar-mobile-open' : ''
        }`}
        aria-label="Application Sidebar"
      >
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand-mobile mobile-only">
            <div className="nav-logo-box" style={{ width: 30, height: 30, borderRadius: 8 }}>
              <Briefcase size={16} strokeWidth={2.5} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 800, fontSize: '0.94rem', color: 'var(--foreground)', lineHeight: 1.2 }}>
                Smart ATS
              </span>
              <span style={{ fontSize: '0.68rem', color: 'var(--primary)', fontWeight: 600 }}>
                Recruitment Suite
              </span>
            </div>
          </div>

          {!collapsed && (
            <span className="sidebar-header-label desktop-only">ATS Navigation</span>
          )}

          {/* Desktop collapse toggle */}
          <button
            type="button"
            className="sidebar-collapse-toggle desktop-only"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
          </button>

          {/* Mobile close button */}
          {mobileOpen && (
            <button
              type="button"
              className="sidebar-collapse-toggle mobile-only"
              onClick={onCloseMobile}
              aria-label="Close sidebar"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Sidebar Nav Items */}
        <nav className="sidebar-nav">
          {/* ── Section 1: Talent Discovery & Applicant Portal ── */}
          <div className="sidebar-group">
            {!collapsed ? (
              <button
                type="button"
                className="sidebar-group-header"
                onClick={() => toggleSection('talent')}
                aria-expanded={openSections.talent}
              >
                <div className="group-title-wrap">
                  <Sparkles size={14} className="group-icon text-indigo-500" />
                  <span className="group-title">Talent Discovery</span>
                </div>
                {openSections.talent ? (
                  <ChevronDown size={14} className="group-chevron" />
                ) : (
                  <ChevronRight size={14} className="group-chevron" />
                )}
              </button>
            ) : null}

            {(!collapsed ? openSections.talent : true) && (
              <div className="sidebar-group-children">
                <Link
                  to="/jobs"
                  className={`sidebar-link ${isJobsActive ? 'active' : ''}`}
                  onClick={onCloseMobile}
                  title={collapsed ? 'Job Openings' : undefined}
                >
                  <Briefcase size={16} className="link-icon" />
                  {!collapsed && <span className="link-text">Job Openings</span>}
                </Link>

                {isAuthenticated && (isCandidate || isHR || isAdmin) && (
                  <Link
                    to="/candidate"
                    className={`sidebar-link ${isCandActive ? 'active' : ''}`}
                    onClick={onCloseMobile}
                    title={collapsed ? 'Candidate Portal' : undefined}
                  >
                    <UserCheck size={16} className="link-icon" />
                    {!collapsed && <span className="link-text">Candidate Portal</span>}
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* ── Section 2: Recruiter Operations (HR & Admin) ── */}
          {isAuthenticated && (isHR || isAdmin) && (
            <div className="sidebar-group">
              {!collapsed ? (
                <button
                  type="button"
                  className="sidebar-group-header"
                  onClick={() => toggleSection('recruitment')}
                  aria-expanded={openSections.recruitment}
                >
                  <div className="group-title-wrap">
                    <Layers size={14} className="group-icon text-indigo-500" />
                    <span className="group-title">Recruitment Pipeline</span>
                  </div>
                  {openSections.recruitment ? (
                    <ChevronDown size={14} className="group-chevron" />
                  ) : (
                    <ChevronRight size={14} className="group-chevron" />
                  )}
                </button>
              ) : null}

              {(!collapsed ? openSections.recruitment : true) && (
                <div className="sidebar-group-children">
                  <Link
                    to="/hr/jobs"
                    className={`sidebar-link ${isHrJobsActive ? 'active' : ''}`}
                    onClick={onCloseMobile}
                    title={collapsed ? 'Manage Requisitions' : undefined}
                  >
                    <FileText size={16} className="link-icon" />
                    {!collapsed && <span className="link-text">Job Requisitions</span>}
                  </Link>

                  <Link
                    to="/pipeline"
                    className={`sidebar-link ${isPipelineActive ? 'active' : ''}`}
                    onClick={onCloseMobile}
                    title={collapsed ? 'Candidate Pipeline' : undefined}
                  >
                    <Kanban size={16} className="link-icon" />
                    {!collapsed && <span className="link-text">Kanban Pipeline</span>}
                  </Link>

                  <Link
                    to="/interviews"
                    className={`sidebar-link ${isInterviewsActive ? 'active' : ''}`}
                    onClick={onCloseMobile}
                    title={collapsed ? 'Interviews' : undefined}
                  >
                    <Calendar size={16} className="link-icon" />
                    {!collapsed && <span className="link-text">Interviews</span>}
                  </Link>

                  <Link
                    to="/offers"
                    className={`sidebar-link ${isOffersActive ? 'active' : ''}`}
                    onClick={onCloseMobile}
                    title={collapsed ? 'Offers & Onboarding' : undefined}
                  >
                    <Gift size={16} className="link-icon" />
                    {!collapsed && <span className="link-text">Offers & Onboarding</span>}
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* ── Section 3: Intelligence & Governance ── */}
          {isAuthenticated && (isHR || isAdmin) && (
            <div className="sidebar-group">
              {!collapsed ? (
                <button
                  type="button"
                  className="sidebar-group-header"
                  onClick={() => toggleSection('intelligence')}
                  aria-expanded={openSections.intelligence}
                >
                  <div className="group-title-wrap">
                    <ShieldCheck size={14} className="group-icon text-amber-500" />
                    <span className="group-title">Governance & Analytics</span>
                  </div>
                  {openSections.intelligence ? (
                    <ChevronDown size={14} className="group-chevron" />
                  ) : (
                    <ChevronRight size={14} className="group-chevron" />
                  )}
                </button>
              ) : null}

              {(!collapsed ? openSections.intelligence : true) && (
                <div className="sidebar-group-children">
                  <Link
                    to="/analytics"
                    className={`sidebar-link ${isAnalyticsActive ? 'active' : ''}`}
                    onClick={onCloseMobile}
                    title={collapsed ? 'Hiring Analytics' : undefined}
                  >
                    <BarChart3 size={16} className="link-icon" />
                    {!collapsed && <span className="link-text">Hiring Analytics</span>}
                  </Link>

                  {isAdmin && (
                    <Link
                      to="/admin"
                      className={`sidebar-link ${isAdminActive ? 'active' : ''}`}
                      onClick={onCloseMobile}
                      title={collapsed ? 'Admin Console' : undefined}
                    >
                      <ShieldCheck size={16} className="link-icon text-amber-500" />
                      {!collapsed && <span className="link-text">Admin Console</span>}
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Sidebar Footer */}
        {isAuthenticated ? (
          <div className="sidebar-footer">
            <div className="sidebar-user-card" title={user.fullName || user.email}>
              <div className="sidebar-user-avatar">
                <span className="sidebar-avatar-initials">{userInitials}</span>
              </div>
              {!collapsed && (
                <div className="sidebar-user-info">
                  <div className="sidebar-user-name">{user.fullName || user.email}</div>
                  <div className="sidebar-user-role">
                    {user.role === 'ADMIN'
                      ? 'System Admin'
                      : user.role === 'HR'
                      ? 'HR Recruiter'
                      : 'Candidate'}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="sidebar-footer mobile-only" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Link
              to="/login"
              className="btn btn-outline btn-sm"
              onClick={onCloseMobile}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="btn btn-primary btn-sm"
              onClick={onCloseMobile}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Join as Candidate
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}

