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
  Sparkles,
  Check,
  CreditCard,
  DoorClosed,
  Users,
  Car,
  Megaphone,
  BarChart3,
  Layers,
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
      case 'security':
        navigate('/security/dashboard', { replace: true });
        break;
      default:
        navigate('/resident/dashboard', { replace: true });
        break;
    }
  };

  // Demo Credentials quick filler
  const handleQuickFill = (roleEmail, defaultPass = 'Password123!') => {
    setIdentifier(roleEmail);
    setPassword(defaultPass);
    setError('');
  };

  // Step 1: Submit Credentials
  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await login(identifier, password);
    setLoading(false);

    if (res.success) {
      if (res.requiresOtp) {
        setStep(2);
        setVerificationToken(res.verificationToken);
        setMaskedEmail(res.email);
        setUserRole(res.role);
        setOtp(['', '', '', '', '', '']);
        setOtpExpirySeconds(600);
        setResendCooldown(60);
      } else {
        redirectUserByRole(res.user);
      }
    } else {
      setError(res.message || 'Invalid login credentials. Please try again.');
    }
  };

  // Step 2: Segmented OTP Input Handling
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
      const digits = pastedData.split('');
      setOtp(digits);
      inputRefs.current[5]?.focus();
      setError('');
    }
  };

  // Step 2: Submit 2FA OTP
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const fullOtp = otp.join('');

    if (fullOtp.length !== 6) {
      setError('Please enter the full 6-digit OTP code.');
      return;
    }

    if (otpExpirySeconds <= 0) {
      setError('This OTP has expired. Please click Resend OTP.');
      return;
    }

    setError('');
    setLoading(true);

    const res = await verifyLoginOtp(verificationToken, fullOtp);
    setLoading(false);

    if (res.success) {
      redirectUserByRole(res.user);
    } else {
      setError(res.message || 'Invalid or expired OTP.');
    }
  };

  // Resend 2FA OTP
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-12 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center relative z-10">
        
        {/* Left Side: Apartment Management System Showcase */}
        <div className="lg:col-span-7 space-y-6">
          {/* Brand Header */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center shadow-xl shadow-brand-500/30 border border-white/20">
              <Building2 size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-brand-400">
                  Residential Community Platform
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Active
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Skyline Apartment Management System
              </h1>
            </div>
          </div>

          {/* System Purpose Description */}
          <div className="p-5 bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-800/90 shadow-xl space-y-2">
            <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Sparkles size={16} className="text-brand-400" />
              <span>About the Apartment Management System</span>
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              A modern, centralized residential ERP platform engineered to digitize community living, automate room bookings, manage multi-block towers, secure gate movements, and process transparent maintenance dues with Razorpay and automated overdue late fees.
            </p>
          </div>

          {/* Key Capabilities Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 flex items-start gap-3 hover:border-brand-500/40 transition">
              <div className="w-9 h-9 rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30 flex items-center justify-center shrink-0 mt-0.5">
                <Layers size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Multi-Block Tower Control</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Isolated block administration for rooms, parking slots, and staff.</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 flex items-start gap-3 hover:border-brand-500/40 transition">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                <DoorClosed size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">8-Step Booking Wizard</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Automates KYC checks, max 4 rooms rule, and 60%/4mo advance rent.</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 flex items-start gap-3 hover:border-brand-500/40 transition">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Gate Security &amp; 2FA</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Encrypted SHA-256 staff 2FA and privacy-masked visitor passes.</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 flex items-start gap-3 hover:border-brand-500/40 transition">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
                <CreditCard size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Razorpay &amp; Overdue Dues</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Tiered late fee calculation engine with stamped PDF vouchers.</p>
              </div>
            </div>
          </div>

          {/* 1-Click Demo Accounts Quick-Fill */}
          <div className="p-4 bg-slate-900/60 rounded-3xl border border-slate-800/80 space-y-2">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <span>⚡ 1-Click Demo Role Sign-In</span>
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('superadmin@apartment.com')}
                className="px-3 py-1.5 rounded-xl bg-purple-950/90 hover:bg-purple-900 border border-purple-800/80 text-purple-200 text-xs font-bold transition cursor-pointer shadow-xs"
              >
                Super Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('blockadmin.a@apartment.com')}
                className="px-3 py-1.5 rounded-xl bg-indigo-950/90 hover:bg-indigo-900 border border-indigo-800/80 text-indigo-200 text-xs font-bold transition cursor-pointer shadow-xs"
              >
                Block Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('receptionist@apartment.com')}
                className="px-3 py-1.5 rounded-xl bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-800/80 text-emerald-200 text-xs font-bold transition cursor-pointer shadow-xs"
              >
                Receptionist
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('resident1@apartment.com')}
                className="px-3 py-1.5 rounded-xl bg-teal-950/90 hover:bg-teal-900 border border-teal-800/80 text-teal-200 text-xs font-bold transition cursor-pointer shadow-xs"
              >
                Resident
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('security@apartment.com')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer shadow-xs"
              >
                Security Desk
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Form Container */}
        <div className="lg:col-span-5 w-full max-w-md mx-auto">
          <div className="bg-slate-900/90 backdrop-blur-2xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            
            {/* Header */}
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-brand-400">
                {step === 1 ? 'Portal Access' : 'Security Verification'}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                {step === 1 ? 'Sign In to Your Account' : 'Verify Login OTP'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {step === 1
                  ? 'Enter your credentials to access your assigned apartment management portal.'
                  : `Enter the 6-digit OTP code dispatched to ${maskedEmail}`}
              </p>
            </div>

            {/* Initial Setup Alert */}
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
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl text-xs transition mt-1 cursor-pointer"
                >
                  <span>Setup Root Super Admin</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            )}

            {/* Error Banner */}
            {error && (
              <div className="p-3.5 bg-red-950/70 border border-red-800/60 rounded-2xl text-red-200 text-xs flex items-center gap-2.5 animate-in fade-in">
                <AlertCircle size={16} className="text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Resend Success Banner */}
            {resendMsg && (
              <div className="p-3.5 bg-emerald-950/70 border border-emerald-800/60 rounded-2xl text-emerald-200 text-xs flex items-center gap-2.5 animate-in fade-in">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>{resendMsg}</span>
              </div>
            )}

            {/* STEP 1: CREDENTIALS FORM */}
            {step === 1 && (
              <form onSubmit={handleCredentialsSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">
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
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-white font-medium placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-slate-300 font-bold">Password *</label>
                    <Link to="/forgot-password" tabIndex={-1} className="text-brand-400 hover:text-brand-300 font-semibold text-[11px] transition">
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
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-white font-medium placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-2xl transition flex items-center justify-center gap-2 shadow-lg shadow-brand-600/30 cursor-pointer disabled:opacity-50 mt-3 border border-brand-400/20"
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
                <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-300 flex items-center gap-1.5 font-medium">
                    <ShieldCheck size={14} className="text-brand-400" />
                    <span>Purpose: Secure Login</span>
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
                        className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-mono font-extrabold rounded-2xl bg-slate-950 border transition focus:outline-none ${
                          digit
                            ? 'border-brand-500 text-white ring-2 ring-brand-500/20'
                            : 'border-slate-800 text-slate-400 focus:border-brand-500'
                        }`}
                      />
                    ))}
                  </div>

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
                  className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-2xl transition flex items-center justify-center gap-2 shadow-lg shadow-brand-600/30 cursor-pointer disabled:opacity-40 border border-brand-400/20"
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
              <div className="text-center pt-2 text-xs text-slate-400 border-t border-slate-800/80">
                <span>New resident? </span>
                <Link to="/register" className="text-brand-400 font-bold hover:underline">
                  Self-Register Online &rarr;
                </Link>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
