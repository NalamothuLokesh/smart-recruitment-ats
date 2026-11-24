import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/client';
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
    linkedinUrl: '',
    verificationCode: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [devOtp, setDevOtp] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError("");
  };

  const handleSendVerificationCode = async () => {
    if (!formData.email || !formData.email.includes('@')) {
      setError('Please enter a valid email address first.');
      return;
    }

    setError('');
    setOtpSending(true);

    try {
      const res = await authApi.sendVerificationOtp(formData.email.trim());
      setOtpSent(true);
      if (res.data?.otpCode) {
        setDevOtp(res.data.otpCode);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        'Failed to send verification code.'
      );
    } finally {
      setOtpSending(false);
    }
  };

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
      const skillsArray = formData.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await register({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        verificationCode: formData.verificationCode || undefined,
        phone: formData.phone,
        experienceYears: parseFloat(formData.experienceYears) || 0,
        skills: skillsArray,
        linkedinUrl: formData.linkedinUrl.trim() || undefined
      });

      navigate('/candidate', { replace: true, state: { registrationSuccess: true } });
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
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
              <div className="flex justify-between items-center mb-1">
                <label className="auth-label mb-0">Email Address <span className="auth-required">*</span></label>
                {!isEmailVerified && (
                  <button
                    type="button"
                    onClick={handleSendVerificationCode}
                    disabled={otpSending || !formData.email}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50"
                  >
                    {otpSending ? 'Sending...' : otpSent ? 'Resend code' : 'Verify email'}
                  </button>
                )}
                {isEmailVerified && (
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 size={12} /> Verified
                  </span>
                )}
              </div>
              <div className="auth-inp-wrap">
                <input className="auth-inp" type="email" required autoComplete="email" name="email" value={formData.email} onChange={handleChange} placeholder="jane.doe@example.com" />
              </div>
            </div>
          </div>

          {/* Email Verification OTP Prompt */}
          {otpSent && !isEmailVerified && (
            <div className="p-3 my-2 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-indigo-900 dark:text-indigo-200">6-Digit Verification Code</span>
                {devOtp && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, verificationCode: devOtp }));
                      setIsEmailVerified(true);
                    }}
                    className="text-[11px] font-mono font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded hover:underline"
                    title="Click to auto-verify"
                  >
                    Code: {devOtp} (Click to auto-verify)
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <div className="auth-inp-wrap flex-1 min-h-[42px]">
                  <input
                    className="auth-inp font-mono font-bold tracking-widest text-center"
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    name="verificationCode"
                    value={formData.verificationCode}
                    onChange={handleChange}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (formData.verificationCode.length === 6) {
                      setIsEmailVerified(true);
                    }
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
                >
                  Confirm Code
                </button>
              </div>
            </div>
          )}

          {/* Password & Password Verification / Confirm Password */}
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
                <Loader2 size={16} className="spin" /> Creating Profile...
              </>
            ) : (
              <>
                <span>Complete Registration</span> <ArrowRight size={16} />
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
    </div>
  );
};

export default RegisterPage;
