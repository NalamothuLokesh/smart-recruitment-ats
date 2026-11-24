import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/client';
import { EmailPinModal } from './EmailPinModal';
import {
  UserCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Phone,
  Linkedin,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Info,
  ArrowRight,
  Loader2,
  Code2
} from 'lucide-react';

export const RegisterPage = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    experienceYears: '',
    skills: '',
    linkedinUrl: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Email PIN Modal Window State
  const [showPinModal, setShowPinModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [devPin, setDevPin] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError("");
  };

  // Step 1: Validate Form and Open Email PIN Verification Window
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please verify your password confirmation.');
      return;
    }

    setLoading(true);

    try {
      // Dispatch 6-digit PIN to candidate email
      const res = await authApi.sendVerificationOtp(formData.email.trim());
      if (res.data?.otpCode) {
        setDevPin(res.data.otpCode);
      }
      setModalError('');
      // Open dedicated PIN verification window
      setShowPinModal(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        'Failed to initiate email verification.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 2: User Enters PIN in Modal Window and Completes Registration
  const handleVerifyPinAndComplete = async (pin) => {
    setModalLoading(true);
    setModalError('');

    try {
      const skillsArray = formData.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await register({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        verificationCode: pin,
        phone: formData.phone,
        experienceYears: parseFloat(formData.experienceYears) || 0,
        skills: skillsArray,
        linkedinUrl: formData.linkedinUrl.trim() || undefined
      });

      setShowPinModal(false);
      navigate('/candidate', { replace: true, state: { registrationSuccess: true } });
    } catch (err) {
      setModalError(
        err.response?.data?.message ||
        err.message ||
        'Verification failed. Invalid or expired PIN.'
      );
    } finally {
      setModalLoading(false);
    }
  };

  // Resend PIN handler
  const handleResendPin = async () => {
    setModalError('');
    try {
      const res = await authApi.sendVerificationOtp(formData.email.trim());
      if (res.data?.otpCode) {
        setDevPin(res.data.otpCode);
      }
    } catch (err) {
      setModalError(
        err.response?.data?.message ||
        err.message ||
        'Failed to resend PIN.'
      );
      throw err;
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-glow" />

      <div className="auth-layout auth-layout-register">
        <aside className="auth-intro">
          <div className="auth-intro-mark"><UserCheck size={22} /></div>
          <p className="auth-intro-kicker">CANDIDATE PORTAL</p>
          <h2>One profile for every opportunity.</h2>
          <p>Create your profile, keep your experience in one place, and follow your applications from the dashboard.</p>
        </aside>

        <div className="auth-card animate-fadeIn" style={{ maxWidth: '580px' }}>
        {/* Brand Emblem */}
        <div className="auth-brand">
          <div className="auth-brand-icon">
            <UserCheck size={22} strokeWidth={2.4} />
          </div>
          <span className="auth-brand-name">Smart ATS</span>
        </div>

        <h1 className="auth-title">Candidate Registration</h1>
        <p className="auth-sub">Create your candidate profile to apply to open requisitions</p>

        <p className="auth-account-note">
          <Info size={15} aria-hidden="true" />
          <span>Candidate sign-up is open. HR and System Admin accounts are created by an existing Admin.</span>
        </p>

        {/* Error Alert */}
        {error && (
          <div className="auth-error animate-fadeIn" role="alert" aria-live="assertive">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="auth-section-heading">
            <h2>Account details</h2>
            <span>Required</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="auth-field">
              <label className="auth-label">Full Name <span className="auth-required">*</span></label>
              <div className="auth-inp-wrap">
                <input className="auth-inp" type="text" required autoComplete="name" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Jane Doe" />
              </div>
            </div>
            <div className="auth-field">
              <label className="auth-label">Email Address <span className="auth-required">*</span></label>
              <div className="auth-inp-wrap">
                <input className="auth-inp" type="email" required autoComplete="email" name="email" value={formData.email} onChange={handleChange} placeholder="jane.doe@example.com" />
              </div>
            </div>
          </div>

          {/* Password & Verify Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="auth-field">
              <label className="auth-label">Password <span className="auth-required">*</span></label>
              <div className="auth-inp-wrap">
                <input
                  className="auth-inp"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="At least 8 characters"
                />
                <button
                  type="button"
                  className="auth-pw-toggle"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-pressed={showPassword}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label">Verify Password <span className="auth-required">*</span></label>
              <div className="auth-inp-wrap">
                <input
                  className="auth-inp"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter password"
                />
                <button
                  type="button"
                  className="auth-pw-toggle"
                  onClick={() => setShowConfirmPassword((visible) => !visible)}
                  aria-pressed={showConfirmPassword}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {formData.confirmPassword && (
                <p className={`text-[11px] mt-1 font-medium ${formData.password === formData.confirmPassword ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                  {formData.password === formData.confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                </p>
              )}
            </div>
          </div>

          <div className="auth-section-heading auth-section-heading-profile">
            <h2>Candidate profile</h2>
            <span>Optional</span>
          </div>
          <p className="auth-section-note">You can add or update these details later from your dashboard.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="auth-field">
              <label className="auth-label">Phone Number <span>(Optional)</span></label>
              <div className="auth-inp-wrap">
                <input className="auth-inp" type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="+1-555-0199" />
              </div>
            </div>
            <div className="auth-field">
              <label className="auth-label">Years of Experience <span>(Optional)</span></label>
              <div className="auth-inp-wrap">
                <input className="auth-inp" type="number" step="0.5" min="0" name="experienceYears" value={formData.experienceYears} onChange={handleChange} placeholder="0" />
              </div>
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-label">LinkedIn Profile URL <span>(Optional)</span></label>
            <div className="auth-inp-wrap">
              <input className="auth-inp" type="url" name="linkedinUrl" value={formData.linkedinUrl} onChange={handleChange} placeholder="https://www.linkedin.com/in/username" />
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-label">Technical Skills <span>(Optional)</span></label>
            <div className="auth-inp-wrap">
              <input className="auth-inp" type="text" name="skills" value={formData.skills} onChange={handleChange} placeholder="React, Node.js, MySQL" />
            </div>
          </div>

          <button className="btn btn-primary auth-btn" type="submit" disabled={loading} aria-busy={loading}>
            {loading ? (
              <>
                <Loader2 size={16} className="spin" /> Sending Verification PIN...
              </>
            ) : (
              <>
                <span>Continue to Email Verification</span> <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="auth-footer-prompt">
          <span>Already registered?</span>{' '}
          <Link to="/login" className="auth-link-highlight">
            Sign In here <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
        </div>
      </div>

      {/* Email PIN Verification Modal Window */}
      <EmailPinModal
        isOpen={showPinModal}
        email={formData.email}
        devPin={devPin}
        loading={modalLoading}
        error={modalError}
        onClose={() => setShowPinModal(false)}
        onVerify={handleVerifyPinAndComplete}
        onResend={handleResendPin}
      />
    </div>
  );
};

export default RegisterPage;
