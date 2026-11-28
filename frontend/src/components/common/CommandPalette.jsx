import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Briefcase,
  Kanban,
  Calendar,
  Gift,
  BarChart3,
  ShieldCheck,
  UserCheck,
  Moon,
  Sun,
  LogOut,
  LogIn,
  UserPlus,
  CornerDownLeft,
  X,
  FileText,
  Users,
  Activity
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function CommandPalette({ open, onClose }) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const navigate = useNavigate();
  const { user, isAuthenticated, isHR, isAdmin, isCandidate, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const items = useMemo(() => {
    const list = [];

    // Job Openings: Visible to Candidates, HR, and Guests; Hidden for System Admin
    if (!isAdmin) {
      list.push({
        id: 'nav-jobs',
        label: 'Job Openings',
        description: 'Browse open career requisitions & apply',
        icon: Briefcase,
        category: 'Navigation',
        action: () => { navigate('/jobs'); onClose(); },
      });
    }

    if (isAuthenticated) {
      // Candidate Exclusive
      if (isCandidate) {
        list.push({
          id: 'nav-candidate',
          label: 'Candidate Portal',
          description: 'Track application stages and upload resumes',
          icon: UserCheck,
          category: 'Navigation',
          action: () => { navigate('/candidate'); onClose(); },
        });
      }

      // HR Dedicated Recruitment Operations
      if (isHR) {
        list.push(
          {
            id: 'nav-hr-jobs',
            label: 'Job Requisitions Management',
            description: 'Create, edit, and publish job postings',
            icon: FileText,
            category: 'Recruitment',
            action: () => { navigate('/hr/jobs'); onClose(); },
          },
          {
            id: 'nav-pipeline',
            label: 'Recruiter Pipeline (Kanban)',
            description: 'Manage candidate stages and transitions',
            icon: Kanban,
            category: 'Recruitment',
            action: () => { navigate('/pipeline'); onClose(); },
          },
          {
            id: 'nav-interviews',
            label: 'Interview Scheduler',
            description: 'Manage interview bookings & submit scorecards',
            icon: Calendar,
            category: 'Recruitment',
            action: () => { navigate('/interviews'); onClose(); },
          },
          {
            id: 'nav-offers',
            label: 'Offers & Onboarding',
            description: 'Generate employment offers and checklists',
            icon: Gift,
            category: 'Recruitment',
            action: () => { navigate('/offers'); onClose(); },
          },
          {
            id: 'nav-analytics',
            label: 'Executive Hiring Analytics',
            description: 'Track time-to-hire, pass rates, and funnel KPIs',
            icon: BarChart3,
            category: 'Recruitment',
            action: () => { navigate('/analytics'); onClose(); },
          }
        );
      }

      // Admin Dedicated Administration & Operations
      if (isAdmin) {
        list.push(
          {
            id: 'nav-admin',
            label: 'System Admin Console',
            description: 'Executive dashboard and system health',
            icon: ShieldCheck,
            category: 'Administration',
            action: () => { navigate('/admin'); onClose(); },
          },
          {
            id: 'nav-admin-users',
            label: 'User Directory Management',
            description: 'Search, filter, activate/deactivate, and assign roles',
            icon: Users,
            category: 'Administration',
            action: () => { navigate('/admin/users'); onClose(); },
          },
          {
            id: 'nav-admin-audit',
            label: 'System Audit Logs',
            description: 'Operational audit trail with CSV export',
            icon: Activity,
            category: 'Administration',
            action: () => { navigate('/admin/audit'); onClose(); },
          },
          {
            id: 'nav-admin-analytics',
            label: 'Executive Hiring Analytics',
            description: 'Review organization-wide hiring metrics and funnels',
            icon: BarChart3,
            category: 'Administration',
            action: () => { navigate('/analytics'); onClose(); },
          },
          {
            id: 'nav-admin-jobs',
            label: 'Job Requisitions Oversight',
            description: 'Inspect organizational job requisitions and statuses',
            icon: FileText,
            category: 'Administration',
            action: () => { navigate('/hr/jobs'); onClose(); },
          }
        );
      }
    }

    list.push({
      id: 'action-theme',
      label: isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme',
      description: 'Toggle between GitHub Dark and crisp light mode',
      icon: isDark ? Sun : Moon,
      category: 'Actions',
      action: () => { toggleTheme(); onClose(); },
    });

    if (isAuthenticated) {
      list.push({
        id: 'account-logout',
        label: 'Sign Out',
        description: `Signed in as ${user?.email || 'User'}`,
        icon: LogOut,
        category: 'Account',
        action: () => { logout(); navigate('/login'); onClose(); },
      });
    } else {
      list.push(
        {
          id: 'account-login',
          label: 'Sign In',
          description: 'Access recruiter or candidate portal',
          icon: LogIn,
          category: 'Account',
          action: () => { navigate('/login'); onClose(); },
        },
        {
          id: 'account-register',
          label: 'Create Candidate Account',
          description: 'Sign up to apply for career opportunities',
          icon: UserPlus,
          category: 'Account',
          action: () => { navigate('/register'); onClose(); },
        }
      );
    }

    return list;
  }, [isAuthenticated, isHR, isAdmin, isCandidate, user, isDark, navigate, onClose, logout, toggleTheme]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q))
    );
  }, [query, items]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Keyboard navigation inside palette
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1 < filteredItems.length ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 >= 0 ? prev - 1 : filteredItems.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[activeIndex]) {
          filteredItems[activeIndex].action();
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, filteredItems, activeIndex, onClose]);

  // Keep active item in view
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.children[activeIndex];
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  if (!open) return null;

  return (
    <div className="cmd-backdrop" onClick={onClose}>
      <div className="cmd-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cmd-input-wrap">
          <Search size={18} className="cmd-search-icon" />
          <input
            ref={inputRef}
            className="cmd-input"
            placeholder="Type a command or jump to page..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
          />
          {query && (
            <button className="cmd-clear-btn" onClick={() => setQuery('')}>
              <X size={14} />
            </button>
          )}
          <kbd className="cmd-esc-badge">ESC</kbd>
        </div>

        <div className="cmd-list" ref={listRef}>
          {filteredItems.length === 0 ? (
            <div className="cmd-empty">No matching commands or navigation routes.</div>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === activeIndex;
              return (
                <div
                  key={item.id}
                  className={`cmd-item ${isSelected ? 'cmd-item-active' : ''}`}
                  onClick={() => item.action()}
                  onMouseEnter={() => setActiveIndex(idx)}
                >
                  <div className="cmd-item-icon">
                    <Icon size={16} />
                  </div>
                  <div className="cmd-item-text">
                    <div className="cmd-item-label">{item.label}</div>
                    {item.description && (
                      <div className="cmd-item-desc">{item.description}</div>
                    )}
                  </div>
                  {isSelected && (
                    <CornerDownLeft size={14} className="cmd-item-enter" />
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="cmd-footer">
          <span>Navigate with <kbd>↑</kbd> <kbd>↓</kbd></span>
          <span>Select with <kbd>↵</kbd></span>
          <span>Close with <kbd>ESC</kbd></span>
        </div>
      </div>
    </div>
  );
}

