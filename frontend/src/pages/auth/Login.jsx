import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import {
  Building2,
  Lock,
  Mail,
  ArrowRight,
  Shield,
  Clock,
  RotateCw,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [setupRequired, setSetupRequired] = useState(false);

  // 2FA OTP Step State
  const [step, setStep] = useState(1); // 1 = Credentials, 2 = 2FA OTP
  const [verificationToken, setVerificationToken] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [userRole, setUserRole] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpExpirySeconds, setOtpExpirySeconds] = useState(600); // 10 minutes
  const [resendCooldown, setResendCooldown] = useState(60); // 60s cooldown
  const [resendMsg, setResendMsg] = useState('');

  const inputRefs = useRef([]);
  const { login, verifyLoginOtp, resendLoginOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if system has root Super Admin initialized
  useEffect(() => {
    const checkSetupStatus = async () => {
      try {
        const res = await api.get('/auth/setup-status');
        if (res.data?.success && res.data.setupRequired) {
          setSetupRequired(true);
          navigate('/setup', { replace: true });
        }
      } catch (err) {
        console.error('Setup status check failed:', err);
      }
    };
    checkSetupStatus();
  }, [navigate]);

  // 10-Minute Expiry Countdown Timer
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

  // 60-Second Resend Cooldown Timer
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

  const redirectUserByRole = (user) => {
    if (user?.mustChangePassword) {
      navigate('/force-change-password', { replace: true });
      return;
    }

    const from = location.state?.from?.pathname;
    if (from && from !== '/login' && from !== '/force-change-password') {
      navigate(from, { replace: true });
      return;
    }

    switch (user.role) {
      case 'super_admin':
        navigate('/super-admin/dashboard', { replace: true });
        break;
      case 'block_admin':
        navigate('/block-admin/dashboard', { replace: true });
        break;
      case 'receptionist':
        navigate('/receptionist/dashboard', { replace: true });
        break;
      case 'resident':
        navigate('/resident/dashboard', { replace: true });
        break;
      default:
        navigate('/', { replace: true });
    }
  };

  // STEP 1: Submit Credentials
  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResendMsg('');
    setLoading(true);

    const result = await login(identifier, password);

    if (result.requiresOtp) {
      // Transition to Step 2: 2FA OTP
      setVerificationToken(result.verificationToken);
      setMaskedEmail(result.email || 'your registered email');
      setUserRole(result.role);
      setOtp(['', '', '', '', '', '']);
      setOtpExpirySeconds(600);
      setResendCooldown(60);
      setStep(2);
      setLoading(false);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } else if (result.success) {
      redirectUserByRole(result.user);
    } else if (result.isEmailUnverified) {
      navigate('/verify-otp', {
        state: { email: result.email, role: result.role },
      });
    } else {
      setError(result.message || 'Invalid credentials.');
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

  // STEP 2: Verify 6-digit OTP
  const handleOtpSubmit = async (e) => {
    e?.preventDefault();
    const fullOtp = otp.join('');

    if (fullOtp.length !== 6) {
      setError('Please enter the complete 6-digit OTP code.');
      return;
    }

    if (otpExpirySeconds <= 0) {
      setError('The OTP has expired. Please click Resend OTP to receive a new code.');
      return;
    }

    setError('');
    setResendMsg('');
    setLoading(true);

    const result = await verifyLoginOtp(verificationToken, fullOtp);

    if (result.success) {
      redirectUserByRole(result.user);
    } else {
      setError(result.message || 'OTP verification failed.');
      setLoading(false);
    }
  };

  // Resend Login OTP
  const handleResend = async () => {
    if (resendCooldown > 0 || loading) return;
    setError('');
    setResendMsg('');
    setLoading(true);

    const res = await resendLoginOtp(verificationToken);
    setLoading(false);

    if (res.success) {
      setOtp(['', '', '', '', '', '']);
      setOtpExpirySeconds(600);
      setResendCooldown(60);
      setResendMsg('Fresh 6-digit login verification OTP sent.');
      inputRefs.current[0]?.focus();
    } else {
      setError(res.message || 'Failed to resend OTP.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* Brand & Title */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-brand-500/20">
            <Building2 size={24} />
          </div>
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-brand-400">
            {step === 1 ? 'Apartment Management Portal' : 'Two-Factor Authentication'}
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
            {step === 1 ? 'Sign In to Your Account' : 'Verify Login OTP'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {step === 1
              ? 'Role-based management system with mandatory 2FA email security'
              : `Enter the 6-digit verification code dispatched to ${maskedEmail}`}
          </p>
        </div>

        {/* First-time Setup Alert */}
        {setupRequired && step === 1 && (
          <div className="p-4 bg-brand-950/80 border border-brand-800/80 rounded-2xl text-xs text-brand-200 flex flex-col gap-2 animate-in fade-in">
            <div className="flex items-center gap-2 font-bold text-white">
              <Shield size={16} className="text-brand-400 shrink-0" />
              <span>Initial Setup Required</span>
            </div>
            <p className="text-[11px] text-slate-300">
              No Super Admin detected in the database. Initialize your master account to start.
            </p>
            <Link
              to="/setup"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl text-xs transition mt-1"
            >
              <span>Setup Root Super Admin</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="p-3 bg-red-950/70 border border-red-800/60 rounded-2xl text-red-200 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle size={15} className="text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Resend Success Banner */}
        {resendMsg && (
          <div className="p-3 bg-emerald-950/70 border border-emerald-800/60 rounded-2xl text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
            <span>{resendMsg}</span>
          </div>
        )}

        {/* STEP 1: CREDENTIALS FORM */}
        {step === 1 && (
          <form onSubmit={handleCredentialsSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Email, Mobile, or Registration ID *
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="admin@apartment.com or REG-2026-XXXXXX"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-3 py-2.5 text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-semibold">Password *</label>
                <Link to="/forgot-password" tabIndex={-1} className="text-brand-400 hover:text-brand-300 text-[11px]">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-3 py-2.5 text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-xs rounded-2xl transition flex items-center justify-center gap-2 shadow-lg shadow-brand-600/30 cursor-pointer disabled:opacity-50 mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Sign In with 2FA</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: 2FA 6-DIGIT OTP FORM */}
        {step === 2 && (
          <form onSubmit={handleOtpSubmit} className="space-y-5 text-xs animate-in fade-in">
            {/* Purpose Badge */}
            <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60 flex items-center justify-between">
              <span className="text-[11px] text-slate-300 flex items-center gap-1.5 font-medium">
                <ShieldCheck size={14} className="text-brand-400" />
                <span>Purpose: Secure Login Verification</span>
              </span>
              <span className="text-[10px] uppercase font-bold text-brand-400 bg-brand-950 px-2 py-0.5 rounded-md border border-brand-800">
                {userRole || '2FA'}
              </span>
            </div>

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
                  <span>Verify OTP &amp; Access Dashboard</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>

            <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <ArrowLeft size={13} />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || loading}
                className="inline-flex items-center gap-1 text-brand-400 hover:text-brand-300 font-bold disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                <RotateCw size={12} className={loading ? 'animate-spin' : ''} />
                <span>
                  {resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : 'Resend OTP'}
                </span>
              </button>
            </div>
          </form>
        )}

        {/* Footer Link */}
        {step === 1 && (
          <div className="text-center pt-2 text-xs text-slate-400">
            <span>New resident? </span>
            <Link to="/register" className="text-brand-400 font-bold hover:underline">
              Self-Register Online &rarr;
            </Link>
          </div>
        )}

      </div>
    </div>
  );
};

export default Login;
