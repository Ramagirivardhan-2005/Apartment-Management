import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import {
  Building2,
  Mail,
  Lock,
  KeyRound,
  ArrowRight,
  Clock,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';

const ForgotPassword = () => {
  const navigate = useNavigate();

  // Multi-step flow: 1 = Enter Email, 2 = Verify OTP, 3 = Set New Password, 4 = Success
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);

  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Timers
  const [otpExpirySeconds, setOtpExpirySeconds] = useState(600); // 10 mins
  const [resendCooldown, setResendCooldown] = useState(60); // 60s cooldown

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 10-min countdown timer in Step 2
  useEffect(() => {
    if (step !== 2) return;
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
  }, [step]);

  // 60-second resend cooldown timer
  useEffect(() => {
    if (step !== 2 || resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [step, resendCooldown]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // STEP 1: Request Password Reset OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await api.post('/auth/forgot-password', {
        email: email.toLowerCase().trim(),
      });

      if (res.data?.success) {
        setStep(2);
        setOtp(['', '', '', '', '', '']);
        setOtpExpirySeconds(600);
        setResendCooldown(60);
        setSuccessMsg(res.data.message || '6-digit OTP sent to your email.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send password reset OTP');
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Handle OTP input
  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError('');

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
      setOtp(pastedData.split(''));
      inputRefs.current[5]?.focus();
      setError('');
    }
  };

  // STEP 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    const fullOtp = otp.join('');

    if (fullOtp.length !== 6) {
      setError('Please enter the complete 6-digit OTP.');
      return;
    }

    if (otpExpirySeconds <= 0) {
      setError('OTP has expired. Please click Resend OTP to receive a new code.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/verify-reset-otp', {
        email: email.toLowerCase().trim(),
        otp: fullOtp,
      });

      if (res.data?.success) {
        setResetToken(res.data.resetToken);
        setStep(3);
        setSuccessMsg('');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || loading) return;
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await api.post('/auth/forgot-password', {
        email: email.toLowerCase().trim(),
      });

      if (res.data?.success) {
        setOtp(['', '', '', '', '', '']);
        setOtpExpirySeconds(600);
        setResendCooldown(60);
        setSuccessMsg('Fresh 6-digit OTP sent to your email.');
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/reset-password-otp', {
        email: email.toLowerCase().trim(),
        resetToken,
        newPassword,
      });

      if (res.data?.success) {
        setStep(4);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
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
            Account Recovery
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
            {step === 1 && 'Forgot Password'}
            {step === 2 && 'Verify Reset OTP'}
            {step === 3 && 'Create New Password'}
            {step === 4 && 'Password Reset Complete'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {step === 1 && 'Enter your registered email to receive a 6-digit verification OTP'}
            {step === 2 && `Enter the 6-digit code dispatched to ${email}`}
            {step === 3 && 'Choose a secure password for your account'}
            {step === 4 && 'Your password has been successfully updated'}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-950/70 border border-red-800/60 rounded-2xl text-red-200 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle size={15} className="text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-950/70 border border-emerald-800/60 rounded-2xl text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* STEP 1: ENTER EMAIL */}
        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Registered Email Address *</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="admin@apartment.com or user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-3 py-2.5 text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-xs rounded-2xl transition flex items-center justify-center gap-2 shadow-lg shadow-brand-600/30 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Send 6-Digit OTP</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: ENTER OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-5 text-xs">
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
                  OTP expires in: <strong className="font-mono text-slate-200">{formatTimer(otpExpirySeconds)}</strong>
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otp.join('').length !== 6 || otpExpirySeconds <= 0}
              className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-xs rounded-2xl transition flex items-center justify-center gap-2 shadow-lg shadow-brand-600/30 cursor-pointer disabled:opacity-40"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Verify OTP</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>

            <div className="pt-3 border-t border-slate-800 text-center">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || loading}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-400 hover:text-brand-300 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                <RotateCw size={13} className={loading ? 'animate-spin' : ''} />
                <span>
                  {resendCooldown > 0
                    ? `Resend OTP in ${resendCooldown}s`
                    : 'Resend 6-Digit OTP'}
                </span>
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: CREATE NEW PASSWORD */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">New Password *</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-3 py-2.5 text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Confirm New Password *</label>
              <div className="relative">
                <KeyRound size={15} className="absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-3 py-2.5 text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-2xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Save New Password</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 4: SUCCESS */}
        {step === 4 && (
          <div className="text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-3xl bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Password Updated!</h3>
              <p className="text-xs text-slate-400 mt-1">
                Your password has been changed successfully. You can now sign in to your portal account.
              </p>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-xs rounded-2xl transition shadow-lg shadow-brand-600/30 cursor-pointer"
            >
              Proceed to Sign In &rarr;
            </button>
          </div>
        )}

        {/* Footer link */}
        {step !== 4 && (
          <div className="text-center pt-2">
            <Link to="/login" className="text-xs text-slate-400 hover:text-white font-medium">
              &larr; Back to Sign In
            </Link>
          </div>
        )}

      </div>
    </div>
  );
};

export default ForgotPassword;
