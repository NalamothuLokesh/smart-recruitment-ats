import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/common/Navbar';
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

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
          <Navbar />
          <main className="flex-1">
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
                  <div className="max-w-md mx-auto my-20 text-center p-8 bg-white border border-slate-200 rounded-2xl shadow-sm">
                    <h2 className="text-xl font-bold text-slate-900 mb-2">404 - Page Not Found</h2>
                    <p className="text-sm text-slate-500 mb-6">The requested page does not exist or has moved.</p>
                    <a
                      href="/jobs"
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold"
                    >
                      Return to Job Board
                    </a>
                  </div>
                }
              />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

