import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Briefcase,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Loader2
} from 'lucide-react';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      const redirectPath = location.state?.from?.pathname || (
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

        {/* Error Alert */}
        {error && (
          <div className="auth-error animate-fadeIn">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div className="auth-field">
            <label className="auth-label">Email Address</label>
            <div className="auth-inp-wrap">
              <Mail size={16} className="auth-inp-icon" />
              <input
                className="auth-inp"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
              />
            </div>
          </div>

          {/* Password */}
          <div className="auth-field">
            <label className="auth-label">Password</label>
            <div className="auth-inp-wrap">
              <Lock size={16} className="auth-inp-icon" />
              <input
                className="auth-inp"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="auth-pw-toggle"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button className="btn btn-primary auth-btn" type="submit" disabled={loading}>
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
            Create a Candidate Profile
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
