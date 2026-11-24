import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Mail,
  ArrowRight,
  RotateCcw,
  AlertCircle,
  Loader2,
  X,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

export const EmailPinModal = ({
  isOpen,
  email,
  devPin,
  onClose,
  onVerify,
  onResend,
  loading = false,
  error = ''
}) => {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [resendCooldown, setResendCooldown] = useState(30);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef([]);

  // Timer countdown for resending PIN
  useEffect(() => {
    if (!isOpen) return;
    if (resendCooldown <= 0) return;

    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, resendCooldown]);

  // Focus first input when modal opens
  useEffect(() => {
    if (isOpen) {
      setDigits(['', '', '', '', '', '']);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const pinValue = digits.join('');

  const handleDigitChange = (index, value) => {
    // Only accept numeric input
    const cleanVal = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = cleanVal;
    setDigits(newDigits);

    // Auto-advance to next input
    if (cleanVal && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newDigits = [...digits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pastedData[i] || '';
    }
    setDigits(newDigits);

    // Focus last filled or next empty input
    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleAutoFillDevPin = () => {
    if (!devPin || devPin.length !== 6) return;
    const newDigits = devPin.split('');
    setDigits(newDigits);
    inputRefs.current[5]?.focus();
  };

  const handleResendClick = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    try {
      await onResend();
      setResendCooldown(30);
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pinValue.length === 6) {
      onVerify(pinValue);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-4 overscroll-contain overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-[#161b22] max-w-md w-full p-6 sm:p-7 rounded-2xl shadow-2xl border border-slate-200 dark:border-[#30363d] space-y-5 my-auto relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* Top Header Badge & Text */}
        <div className="text-center space-y-2 pt-1">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
            <ShieldCheck size={26} strokeWidth={2.2} />
          </div>

          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Enter Verification PIN
          </h3>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
            We sent a 6-digit confirmation PIN to<br />
            <span className="font-semibold text-slate-800 dark:text-slate-200">{email}</span>
          </p>
        </div>

        {/* Dev PIN Auto-fill Banner */}
        {devPin && (
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-500 flex-shrink-0" />
              <span>Dev PIN:</span>
            </div>
            <button
              type="button"
              onClick={handleAutoFillDevPin}
              className="font-mono font-bold px-2 py-0.5 bg-amber-200/70 dark:bg-amber-900/60 rounded text-amber-900 dark:text-amber-200 hover:underline flex items-center gap-1"
              title="Click to auto-fill PIN"
            >
              <span>{devPin}</span>
              <span className="text-[10px] font-normal opacity-80">(Auto-fill)</span>
            </button>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 animate-fadeIn">
            <AlertCircle size={15} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* PIN Inputs Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 6 Individual PIN Digit Boxes */}
          <div className="flex justify-center items-center gap-2 sm:gap-2.5" onPaste={handlePaste}>
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-11 h-13 sm:w-12 sm:h-14 text-center font-mono text-xl sm:text-2xl font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-[#1c2128] text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-2xs"
              />
            ))}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || pinValue.length !== 6}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="spin" /> Verifying PIN...
              </>
            ) : (
              <>
                <CheckCircle2 size={16} /> Verify & Complete Registration
              </>
            )}
          </button>
        </form>

        {/* Resend & Change Email Footer */}
        <div className="pt-2 border-t border-slate-100 dark:border-[#30363d] flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <button
            type="button"
            onClick={handleResendClick}
            disabled={resendCooldown > 0 || resending}
            className="flex items-center gap-1.5 font-medium text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50 disabled:no-underline"
          >
            <RotateCcw size={13} className={resending ? 'spin' : ''} />
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend PIN'}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="font-medium text-slate-600 dark:text-slate-300 hover:underline"
          >
            Edit Registration Form
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailPinModal;
