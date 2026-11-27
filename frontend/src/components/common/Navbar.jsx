import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Briefcase,
  Search,
  Menu,
  ChevronDown,
  LogOut,
  UserCheck,
  Kanban,
  ShieldCheck,
  Building,
  User as UserIcon,
  Sparkles,
  Users,
  Activity,
  Calendar,
  Gift
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';

export default function Navbar({ onOpenPalette, onToggleMobileSidebar }) {
  const { user, isAuthenticated, isHR, isAdmin, isCandidate, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isMac, setIsMac] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMac(/Mac|iPhone|iPad|iPod/.test(window.navigator.platform));
    }
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate('/login');
  };

  const initials = user?.fullName
    ? user.fullName
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'U';

  const isActive = (path) => location.pathname === path;

  return (
    <header className="navbar">
      <div className="navbar-left">
        {/* Mobile Sidebar Hamburger Toggle */}
        <button
          type="button"
          className="nav-mobile-toggle"
          onClick={onToggleMobileSidebar}
          aria-label="Toggle navigation drawer"
        >
          <Menu size={20} />
        </button>

        {/* Brand Emblem */}
        <Link to={isAdmin ? '/admin' : isHR ? '/pipeline' : '/jobs'} className="nav-brand">
          <div className="nav-logo-box">
            <Briefcase size={20} strokeWidth={2.4} className="nav-logo-icon" />
          </div>
          <div className="nav-brand-text">
            <span className="nav-name">Smart ATS</span>
            <span className="nav-badge">Recruitment</span>
          </div>
        </Link>

        {/* Command Palette Trigger */}
        <button
          type="button"
          onClick={onOpenPalette}
          className="nav-search-trigger"
          aria-label="Open command palette"
        >
          <Search size={15} className="nav-search-icon" />
          <span className="nav-search-placeholder">
            Search or run commands...
          </span>
          <kbd className="nav-kbd">
            <span>{isMac ? '⌘' : 'Ctrl'}</span>
            <span>K</span>
          </kbd>
        </button>
      </div>

      <div className="navbar-right">
        {/* Job Openings: Visible to Candidates, HR, and Guests; Hidden for System Admin */}
        {!isAdmin && (
          <Link
            to="/jobs"
            className={`nav-link ${isActive('/jobs') ? 'nav-link-active' : ''}`}
          >
            <span>Job Openings</span>
          </Link>
        )}

        {/* HR-Specific Navigation Links */}
        {isAuthenticated && isHR && (
          <>
            <Link
              to="/hr/jobs"
              className={`nav-link ${isActive('/hr/jobs') ? 'nav-link-active' : ''}`}
            >
              <Briefcase size={15} />
              <span>Job Requisitions</span>
            </Link>

            <Link
              to="/pipeline"
              className={`nav-link ${isActive('/pipeline') ? 'nav-link-active' : ''}`}
            >
              <Kanban size={15} />
              <span>Pipeline</span>
            </Link>

            <Link
              to="/analytics"
              className={`nav-link ${isActive('/analytics') ? 'nav-link-active' : ''}`}
            >
              <Sparkles size={15} className="text-indigo-500" />
              <span>Analytics</span>
            </Link>
          </>
        )}

        {/* Candidate-Specific Navigation Links */}
        {isAuthenticated && isCandidate && (
          <Link
            to="/candidate"
            className={`nav-link ${isActive('/candidate') ? 'nav-link-active' : ''}`}
          >
            <UserCheck size={15} />
            <span>My Applications</span>
          </Link>
        )}

        {/* Admin-Specific Navigation Links */}
        {isAuthenticated && isAdmin && (
          <>
            <Link
              to="/admin"
              className={`nav-link nav-admin-link ${isActive('/admin') ? 'nav-link-active' : ''}`}
            >
              <ShieldCheck size={15} />
              <span>Admin Console</span>
            </Link>

            <Link
              to="/admin/users"
              className={`nav-link ${isActive('/admin/users') ? 'nav-link-active' : ''}`}
            >
              <Users size={15} />
              <span>Users</span>
            </Link>

            <Link
              to="/hr/jobs"
              className={`nav-link ${isActive('/hr/jobs') ? 'nav-link-active' : ''}`}
            >
              <Briefcase size={15} />
              <span>Requisitions</span>
            </Link>

            <Link
              to="/analytics"
              className={`nav-link ${isActive('/analytics') ? 'nav-link-active' : ''}`}
            >
              <Sparkles size={15} className="text-indigo-500" />
              <span>Analytics</span>
            </Link>
          </>
        )}

        <div className="nav-divider" />

        {/* Theme Toggle (Dark / Light) */}
        <ThemeToggle />

        {/* User Dropdown / Guest Auth CTA */}
        {isAuthenticated ? (
          <div className="nav-user-menu" ref={menuRef}>
            <button
              type="button"
              className={`nav-avatar-btn ${dropdownOpen ? 'nav-avatar-active' : ''}`}
              onClick={() => setDropdownOpen((v) => !v)}
              aria-label="User navigation profile menu"
              aria-expanded={dropdownOpen}
            >
              <div className="nav-avatar-text">{initials}</div>
              <ChevronDown
                size={14}
                className={`nav-avatar-chevron ${dropdownOpen ? 'chevron-rotated' : ''}`}
              />
            </button>

            {dropdownOpen && (
              <div className="nav-user-dropdown animate-fadeIn" role="menu">
                <div className="nav-user-info">
                  <div className="nav-user-name">{user.fullName || 'User'}</div>
                  <div className="nav-user-email">{user.email}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={
                        user.role === 'ADMIN'
                          ? 'badge-role-admin'
                          : user.role === 'HR'
                          ? 'badge-role-superadmin'
                          : 'badge-role-user'
                      }
                    >
                      {user.role === 'ADMIN'
                        ? 'Administrator'
                        : user.role === 'HR'
                        ? 'HR Lead'
                        : 'Candidate'}
                    </span>
                    {user.orgName && (
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Building size={11} /> {user.orgName}
                      </span>
                    )}
                  </div>
                </div>

                <div className="nav-dropdown-divider" />

                {isCandidate && (
                  <>
                    <Link
                      to="/candidate"
                      className="nav-dropdown-item"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <UserCheck size={15} />
                      <span>Candidate Dashboard</span>
                    </Link>
                    <Link
                      to="/jobs"
                      className="nav-dropdown-item"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <Briefcase size={15} />
                      <span>Job Openings</span>
                    </Link>
                  </>
                )}

                {isHR && (
                  <>
                    <Link
                      to="/hr/jobs"
                      className="nav-dropdown-item"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <Briefcase size={15} />
                      <span>Job Requisitions</span>
                    </Link>
                    <Link
                      to="/pipeline"
                      className="nav-dropdown-item"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <Kanban size={15} />
                      <span>Candidate Pipeline</span>
                    </Link>
                    <Link
                      to="/interviews"
                      className="nav-dropdown-item"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <Calendar size={15} />
                      <span>Interviews</span>
                    </Link>
                    <Link
                      to="/offers"
                      className="nav-dropdown-item"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <Gift size={15} />
                      <span>Offers & Onboarding</span>
                    </Link>
                    <Link
                      to="/analytics"
                      className="nav-dropdown-item"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <Sparkles size={15} className="text-indigo-500" />
                      <span>Hiring Analytics</span>
                    </Link>
                  </>
                )}

                {isAdmin && (
                  <>
                    <Link
                      to="/admin"
                      className="nav-dropdown-item"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <ShieldCheck size={15} />
                      <span>Admin Console</span>
                    </Link>
                    <Link
                      to="/admin/users"
                      className="nav-dropdown-item"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <Users size={15} />
                      <span>User Management</span>
                    </Link>
                    <Link
                      to="/admin/audit"
                      className="nav-dropdown-item"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <Activity size={15} />
                      <span>Audit Logs</span>
                    </Link>
                    <Link
                      to="/analytics"
                      className="nav-dropdown-item"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <Sparkles size={15} className="text-indigo-500" />
                      <span>Hiring Analytics</span>
                    </Link>
                    <Link
                      to="/hr/jobs"
                      className="nav-dropdown-item"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <Briefcase size={15} />
                      <span>Job Requisitions</span>
                    </Link>
                  </>
                )}

                <div className="nav-dropdown-divider" />

                <button
                  type="button"
                  className="nav-dropdown-item nav-logout"
                  onClick={handleLogout}
                >
                  <LogOut size={15} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/login" className="btn btn-outline btn-sm">
              Sign In
            </Link>
            <Link to="/register" className="btn btn-primary btn-sm">
              Join Candidate
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
