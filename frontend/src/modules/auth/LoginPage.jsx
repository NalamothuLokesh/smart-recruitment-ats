import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import {
  Briefcase,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Loader2
} from 'lucide-react';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [successNotice, setSuccessNotice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email.trim(), password);
      const from = location.state?.from;
      const redirectPath = from?.pathname
        ? `${from.pathname}${from.search || ''}${from.hash || ''}`
        : (
        user.role === 'ADMIN' ? '/admin' :
        user.role === 'HR' ? '/pipeline' : '/candidate'
      );
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Demo helper: Fill synthetic seeded accounts
  const fillCredentials = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('Password123!');
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-glow" />

      <div className="auth-layout">
        <aside className="auth-intro">
          <div className="auth-intro-mark"><Briefcase size={22} /></div>
          <p className="auth-intro-kicker">SMART ATS WORKSPACE</p>
          <h2>Keep your hiring journey moving.</h2>
          <p>Sign in to manage recruitment workflows, review opportunities, and follow application progress.</p>
        </aside>

        <div className="auth-card animate-fadeIn">
        {/* Brand Emblem */}
        <div className="auth-brand">
          <div className="auth-brand-icon">
            <Briefcase size={22} strokeWidth={2.4} />
          </div>
          <span className="auth-brand-name">Smart ATS</span>
        </div>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-sub">Sign in to your account to access candidate pipelines & jobs</p>

        {/* Success Alert */}
        {successNotice && (
          <div className="p-3 mb-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between gap-2 animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span>{successNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessNotice('')}
              className="text-xs font-semibold hover:underline text-emerald-700 dark:text-emerald-400"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="auth-error animate-fadeIn" role="alert" aria-live="assertive">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div className="auth-field">
            <label className="auth-label">Email Address <span className="auth-required">*</span></label>
            <div className="auth-inp-wrap">
              <Mail size={16} className="auth-inp-icon" />
              <input
                className="auth-inp"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (error) setError(""); }}
                required
                autoComplete="email"
                autoFocus
              />
            </div>
          </div>

          {/* Password */}
          <div className="auth-field">
            <div className="flex justify-between items-center mb-1">
              <label className="auth-label mb-0">Password <span className="auth-required">*</span></label>
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setSuccessNotice('');
                  setShowForgotPassword(true);
                }}
                className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline transition-colors cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
            <div className="auth-inp-wrap">
              <Lock size={16} className="auth-inp-icon" />
              <input
                className="auth-inp"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (error) setError(""); }}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="auth-pw-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-pressed={showPassword}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button className="btn btn-primary auth-btn" type="submit" disabled={loading} aria-busy={loading}>
            {loading ? (
              <>
                <Loader2 size={16} className="spin" /> Authenticating...
              </>
            ) : (
              <>
                <span>Sign In</span> <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Fill Buttons */}
        <div className="demo-credentials-box">
          <div className="demo-credentials-title">
            <Sparkles size={13} className="text-amber-500" />
            <span>Quick Fill Synthetic Demo Accounts</span>
          </div>
          <div className="demo-buttons-grid">
            <button
              type="button"
              onClick={() => fillCredentials('admin@novatech.io')}
              className="demo-pill-btn"
            >
              System Admin
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('hr@novatech.io')}
              className="demo-pill-btn"
            >
              HR Lead
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('alex.rivera@example.com')}
              className="demo-pill-btn"
            >
              Candidate
            </button>
          </div>
        </div>

        <div className="auth-footer-prompt">
          <span>New job seeker?</span>{' '}
          <Link to="/register" className="auth-link-highlight">
            Create a Candidate Profile <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        onSuccess={({ email: resetEmail, message }) => {
          setEmail(resetEmail);
          setPassword('');
          setSuccessNotice(message);
        }}
      />
    </div>
  );
};

export default LoginPage;
