import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  Building2,
  ArrowRight,
  Clock,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Sparkles,
} from 'lucide-react';

const VerifyOtp = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setAuthSession } = useAuth();

  const queryParams = new URLSearchParams(location.search);
  const initialEmail = queryParams.get('email') || location.state?.email || '';

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);

  // Timer states
  const [otpExpirySeconds, setOtpExpirySeconds] = useState(600); // 10 minutes (600s)
  const [resendCooldown, setResendCooldown] = useState(60); // 60s cooldown
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // Status & Feedback
  const [error, setError] = useState(location.state?.message || '');
  const [remainingAttempts, setRemainingAttempts] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Verified & Navigation State (No password creation required)
  const [isVerified, setIsVerified] = useState(false);
  const [verifiedUser, setVerifiedUser] = useState(null);
  const [assignedId, setAssignedId] = useState(location.state?.registrationId || '');
  const [redirectCountdown, setRedirectCountdown] = useState(3);

  // Mask email for privacy (e.g. rahul******@gmail.com)
  const maskEmail = (str) => {
    if (!str || !str.includes('@')) return str || 'your email';
    const [local, domain] = str.split('@');
    if (local.length <= 2) return `${local}***@${domain}`;
    return `${local.slice(0, 3)}******@${domain}`;
  };

  // 10-Minute Expiry Countdown Timer
  useEffect(() => {
    if (isVerified) return;
    const timer = setInterval(() => {
      setOtpExpirySeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isVerified]);

  // 60-Second Resend Cooldown Countdown Timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const cooldownTimer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownTimer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(cooldownTimer);
  }, [resendCooldown]);

  // Auto-redirect countdown once verified
  useEffect(() => {
    if (!isVerified || !verifiedUser) return;
    const timer = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleProceedToAdvancePayment(verifiedUser);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isVerified, verifiedUser]);

  // Format seconds to MM:SS
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // OTP Input handlers (6 segmented inputs)
  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError('');

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtp(digits);
      inputRefs.current[5]?.focus();
      setError('');
    }
  };

  // Navigate to advance payment / dashboard according to role
  const handleProceedToAdvancePayment = (user) => {
    const role = user?.role || verifiedUser?.role;
    if (role === 'receptionist') {
      navigate('/receptionist/payments', { replace: true, state: { autoShowAdvancePayment: true } });
    } else if (role === 'block_admin') {
      navigate('/block-admin/dashboard', { replace: true });
    } else if (role === 'super_admin') {
      navigate('/super-admin/dashboard', { replace: true });
    } else {
      navigate('/resident/payments', { replace: true, state: { autoShowAdvancePayment: true } });
    }
  };

  // Verify OTP submission -> Direct Account Verification without asking for new password
  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    const fullOtp = otp.join('');

    if (fullOtp.length !== 6) {
      setError('Please enter the complete 6-digit OTP.');
      return;
    }

    if (!email) {
      setError('Email address is missing.');
      return;
    }

    if (otpExpirySeconds <= 0) {
      setError('This OTP has expired. Please click Resend OTP to receive a fresh 6-digit code.');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const res = await api.post('/auth/verify-otp', {
        email: email.toLowerCase().trim(),
        otp: fullOtp,
      });

      if (res.data?.success) {
        const user = res.data.user;
        const token = res.data.token;

        if (token && user) {
          localStorage.setItem('apartment_token', token);
          localStorage.setItem('apartment_user', JSON.stringify(user));
          if (setAuthSession) {
            setAuthSession(token, user);
          }
        }

        setVerifiedUser(user);
        setIsVerified(true);
        setAssignedId(user?.registrationId || user?.employeeId || '');
        setSuccessMessage(res.data.message || 'Account verified successfully!');
      }
    } catch (err) {
      const data = err.response?.data;
      setError(data?.message || 'Invalid verification OTP. Please try again.');
      if (data?.remainingAttempts !== undefined) {
        setRemainingAttempts(data.remainingAttempts);
      }
    } finally {
      setIsVerifying(false);
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isResending) return;

    setIsResending(true);
    setError('');
    setSuccessMessage('');

    try {
      const res = await api.post('/auth/resend-otp', {
        email: email.toLowerCase().trim(),
      });

      if (res.data?.success) {
        setOtp(['', '', '', '', '', '']);
        setOtpExpirySeconds(600); // Reset to 10 minutes
        setResendCooldown(60); // Reset 60s cooldown
        setRemainingAttempts(null);
        setSuccessMessage('A fresh 6-digit OTP has been dispatched to your email. Please check your inbox.');
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* Brand Header */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-brand-500/20">
            <Building2 size={24} />
          </div>
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-brand-400">
            Apartment Complex Portal
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
            {isVerified ? 'Account Verified' : 'Verify Your Email'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isVerified
              ? 'Verification complete. Ready to proceed to advance payment.'
              : 'Enter the 6-digit OTP sent to your registered email.'}
          </p>
        </div>

        {/* STEP 1: OTP VERIFICATION */}
        {!isVerified ? (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-xs text-slate-400">
                Enter the 6-digit OTP sent to
              </p>
              <p className="text-xs font-mono font-bold text-slate-200 mt-1 bg-slate-800/80 py-1.5 px-3 rounded-xl inline-block border border-slate-700">
                {maskEmail(email)}
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-950/70 border border-red-800/60 rounded-2xl text-red-200 text-xs flex items-center gap-2 animate-in fade-in">
                <AlertCircle size={16} className="text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-emerald-950/70 border border-emerald-800/60 rounded-2xl text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* 6 Segmented OTP Inputs */}
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div>
                <div className="flex justify-center gap-2 sm:gap-2.5" onPaste={handlePaste}>
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (inputRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-mono font-extrabold rounded-2xl bg-slate-800 border transition focus:outline-none ${
                        digit
                          ? 'border-brand-500 text-white ring-2 ring-brand-500/20'
                          : 'border-slate-700 text-slate-400 focus:border-brand-500'
                      }`}
                    />
                  ))}
                </div>

                {/* Expiry Timer */}
                <div className="flex items-center justify-center gap-1.5 mt-4 text-xs">
                  <Clock size={14} className={otpExpirySeconds < 60 ? 'text-red-400' : 'text-slate-400'} />
                  <span className={otpExpirySeconds < 60 ? 'text-red-400 font-bold' : 'text-slate-400'}>
                    OTP expires in:{' '}
                    <strong className="font-mono font-bold text-slate-200">
                      {formatTimer(otpExpirySeconds)}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Verify Button */}
              <button
                type="submit"
                disabled={isVerifying || otp.join('').length !== 6 || otpExpirySeconds <= 0}
                className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-xs rounded-2xl transition flex items-center justify-center gap-2 shadow-lg shadow-brand-600/30 disabled:opacity-40 cursor-pointer"
              >
                {isVerifying ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Verify Account</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>

            {/* Resend OTP Section */}
            <div className="pt-4 border-t border-slate-800 text-center space-y-2">
              <p className="text-xs text-slate-400">Didn't receive the code?</p>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || isResending}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-400 hover:text-brand-300 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                <RotateCw size={13} className={isResending ? 'animate-spin' : ''} />
                <span>
                  {resendCooldown > 0
                    ? `Resend OTP in ${resendCooldown}s`
                    : 'Resend 6-Digit OTP'}
                </span>
              </button>
            </div>

            {/* Back to Login */}
            <div className="text-center pt-2">
              <Link to="/login" className="text-xs text-slate-500 hover:text-slate-400 font-medium">
                &larr; Back to Login
              </Link>
            </div>
          </div>
        ) : (
          /* STEP 2: VERIFICATION SUCCESS & ADVANCE PAYMENT TRANSITION */
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 bg-emerald-950/70 border border-emerald-800/60 rounded-2xl text-emerald-200 text-xs flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-900/80 text-emerald-300 flex items-center justify-center shadow-inner">
                <CheckCircle2 size={28} />
              </div>
              <div>
                <p className="font-extrabold text-base text-emerald-300">Account Verified Successfully!</p>
                <p className="text-xs text-slate-300 mt-1">
                  Your identity has been confirmed without requiring password creation.
                </p>
                {assignedId && (
                  <div className="mt-3 inline-block bg-slate-900/80 border border-emerald-800/80 px-3 py-1.5 rounded-xl font-mono text-emerald-400 font-bold">
                    Assigned ID: {assignedId}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-850 p-4 rounded-2xl border border-slate-800 text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-brand-400 font-bold text-xs">
                <CreditCard size={16} />
                <span>Next Step: Advance Payment Flow</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Redirecting you to the portal in <strong className="text-white font-mono">{redirectCountdown}s</strong>...
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleProceedToAdvancePayment(verifiedUser)}
              className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-xs rounded-2xl transition flex items-center justify-center gap-2 shadow-lg shadow-brand-600/30 cursor-pointer"
            >
              <span>Proceed to Advance Payment Now</span>
              <ArrowRight size={15} />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default VerifyOtp;
