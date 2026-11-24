import React, { useState } from 'react';
import { authApi } from '../../api/client';
import {
  KeyRound,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  X,
  Sparkles
} from 'lucide-react';

export const ForgotPasswordModal = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP + New Password
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [devOtpHint, setDevOtpHint] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // Step 1: Send OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authApi.forgotPassword(email.trim());
      if (res.data?.otpCode) {
        setDevOtpHint(res.data.otpCode);
      }
      setStep(2);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.msg ||
        err.message ||
        'Failed to dispatch reset code.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify your new password.');
      return;
    }

    setLoading(true);

    try {
      const res = await authApi.resetPassword({
        email: email.trim(),
        otpCode: otpCode.trim(),
        newPassword,
        confirmPassword
      });

      onSuccess({
        email: email.trim(),
        message: res.data?.message || 'Password reset successfully! Please sign in with your new password.'
      });
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.msg ||
        err.message ||
        'Password reset failed.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overscroll-contain overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-[#161b22] max-w-md w-full p-6 rounded-2xl shadow-2xl border border-slate-200 dark:border-[#30363d] space-y-4 my-auto relative">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-100 dark:border-[#30363d] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
              <KeyRound size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {step === 1 ? 'Reset your password' : 'Set new password'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {step === 1
                  ? 'Enter your registered email to receive a 6-digit verification code.'
                  : `Enter the code sent to ${email}`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Dev OTP Helper Banner */}
        {devOtpHint && step === 2 && (
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-500 flex-shrink-0" />
              <span>Simulated Verification Code:</span>
            </div>
            <button
              type="button"
              onClick={() => setOtpCode(devOtpHint)}
              className="font-mono font-bold px-2 py-0.5 bg-amber-200/60 dark:bg-amber-900/60 rounded text-amber-900 dark:text-amber-200 hover:underline"
              title="Click to auto-fill OTP"
            >
              {devOtpHint}
            </button>
          </div>
        )}

        {/* STEP 1: Email Form */}
        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div className="auth-field">
              <label className="auth-label">
                Account Email <span className="auth-required">*</span>
              </label>
              <div className="auth-inp-wrap">
                <Mail size={16} className="auth-inp-icon" />
                <input
                  className="auth-inp"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="spin" /> Generating Code...
                </>
              ) : (
                <>
                  <span>Send Verification Code</span> <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: OTP + New Password Form */}
        {step === 2 && (
          <form onSubmit={handleResetPassword} className="space-y-3.5">
            {/* 6-Digit Code */}
            <div className="auth-field">
              <label className="auth-label">
                6-Digit Verification Code <span className="auth-required">*</span>
              </label>
              <div className="auth-inp-wrap">
                <KeyRound size={16} className="auth-inp-icon" />
                <input
                  className="auth-inp font-mono tracking-widest text-base font-bold"
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* New Password */}
            <div className="auth-field">
              <label className="auth-label">
                New Password <span className="auth-required">*</span>
              </label>
              <div className="auth-inp-wrap">
                <Lock size={16} className="auth-inp-icon" />
                <input
                  className="auth-inp"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="auth-pw-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="auth-field">
              <label className="auth-label">
                Verify New Password <span className="auth-required">*</span>
              </label>
              <div className="auth-inp-wrap">
                <Lock size={16} className="auth-inp-icon" />
                <input
                  className="auth-inp"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter new password"
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="auth-pw-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirmPassword && (
                <p className={`text-[11px] mt-1 font-medium ${newPassword === confirmPassword ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                  {newPassword === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-2.5 px-3 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <ArrowLeft size={14} /> Back
              </button>

              <button
                type="submit"
                disabled={loading || !otpCode || !newPassword || newPassword !== confirmPassword}
                className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="spin" /> Updating Password...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} /> Reset Password
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
