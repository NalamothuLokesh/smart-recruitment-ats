import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';
import CommandPalette from './components/common/CommandPalette';
import ProtectedRoute from './components/common/ProtectedRoute';

// Auth Pages
import LoginPage from './modules/auth/LoginPage';
import RegisterPage from './modules/auth/RegisterPage';

// Teammate Modular Component Views
import AdminDashboard from './modules/admin/AdminDashboard';
import JobManagementPage from './modules/hr-jobs/JobManagementPage';
import PublicJobBoard from './modules/hr-jobs/PublicJobBoard';
import HrPipelineBoard from './modules/hr-pipeline/HrPipelineBoard';
import InterviewSchedulerPage from './modules/interviews-offers/InterviewSchedulerPage';
import OfferOnboardingPage from './modules/interviews-offers/OfferOnboardingPage';
import CandidateDashboard from './modules/candidate/CandidateDashboard';
import HiringAnalyticsPage from './modules/analytics/HiringAnalyticsPage';

import './App.css';

function AppShell() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('ats_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleToggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('ats_sidebar_collapsed', String(next));
      } catch (_) {}
      return next;
    });
  };

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="shell h-screen max-h-screen overflow-hidden flex flex-col">
      <Navbar
        onOpenPalette={() => setPaletteOpen(true)}
        onToggleMobileSidebar={() => setMobileSidebarOpen((o) => !o)}
      />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />

      <div className="app-layout flex-1 min-h-0 flex overflow-hidden relative">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />
        <main className={`app-main-content flex-1 min-w-0 h-full overflow-y-auto overflow-x-hidden relative overscroll-contain ${sidebarCollapsed ? 'sidebar-is-collapsed' : ''}`}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/jobs" replace />} />
            <Route path="/jobs" element={<PublicJobBoard />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Candidate Portal (Guarded: CANDIDATE) */}
            <Route
              path="/candidate"
              element={
                <ProtectedRoute allowedRoles={['CANDIDATE']}>
                  <CandidateDashboard />
                </ProtectedRoute>
              }
            />

            {/* HR & Admin Recruitment Operations (Guarded: HR, ADMIN) */}
            <Route
              path="/hr/jobs"
              element={
                <ProtectedRoute allowedRoles={['HR', 'ADMIN']}>
                  <JobManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pipeline"
              element={
                <ProtectedRoute allowedRoles={['HR', 'ADMIN']}>
                  <HrPipelineBoard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/interviews"
              element={
                <ProtectedRoute allowedRoles={['HR', 'ADMIN']}>
                  <InterviewSchedulerPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/offers"
              element={
                <ProtectedRoute allowedRoles={['HR', 'ADMIN']}>
                  <OfferOnboardingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute allowedRoles={['HR', 'ADMIN']}>
                  <HiringAnalyticsPage />
                </ProtectedRoute>
              }
            />

            {/* System Admin Console (Guarded: ADMIN) */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Catch-all 404 */}
            <Route
              path="*"
              element={
                <div className="max-w-md mx-auto my-20 text-center p-8 bg-card border border-border rounded-2xl shadow-sm">
                  <h2 className="text-xl font-bold text-foreground mb-2">404 - Page Not Found</h2>
                  <p className="text-sm text-muted-foreground mb-6">The requested page does not exist or has moved.</p>
                  <a
                    href="/jobs"
                    className="btn btn-primary btn-sm"
                  >
                    Return to Job Board
                  </a>
                </div>
              }
            />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppShell />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
