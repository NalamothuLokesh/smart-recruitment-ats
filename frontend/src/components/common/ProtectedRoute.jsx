import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, Loader2 } from 'lucide-react';

/**
 * Role-Based Route Guard Component
 * @param {Array<string>} allowedRoles Optional array of allowed roles (e.g. ['ADMIN', 'HR'])
 */
export const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Validating credentials & permissions...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="max-w-2xl mx-auto my-16 p-8 bg-white border border-rose-200 rounded-xl shadow-sm text-center">
        <div className="w-14 h-14 mx-auto mb-4 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Restricted (403 Forbidden)</h2>
        <p className="text-slate-600 mb-6">
          Your current account role <span className="font-semibold text-rose-600 font-mono">[{user.role}]</span> is not authorized to view this resource. 
          This view requires one of: <span className="font-mono text-slate-800">[{allowedRoles.join(', ')}]</span>.
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium"
          >
            Go Back
          </button>
          <a
            href={user.role === 'CANDIDATE' ? '/candidate' : user.role === 'HR' ? '/pipeline' : '/admin'}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
          >
            Go to Your Dashboard
          </a>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;

