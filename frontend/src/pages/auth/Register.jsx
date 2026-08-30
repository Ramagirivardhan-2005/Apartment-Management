import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/client';
import {
  Building2,
  Lock,
  Mail,
  Phone,
  User,
  Calendar,
  MapPin,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  DoorClosed,
  CreditCard,
  Car,
  Megaphone,
  KeyRound,
} from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    dob: '',
    gender: 'Male',
    street: '',
    city: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await api.post('/auth/register', {
        fullName: formData.fullName,
        email: formData.email,
        mobile: formData.mobile,
        password: formData.password,
        dob: formData.dob || undefined,
        gender: formData.gender,
        address: {
          street: formData.street,
          villageCity: formData.city,
        },
      });

      if (res.data?.success) {
        // Navigate to OTP Verification with email
        navigate(`/verify-otp?email=${encodeURIComponent(formData.email)}`, {
          state: {
            email: formData.email,
            registrationId: res.data.registrationId,
            message: 'A 6-digit verification code has been dispatched to your email. Please enter it below.',
          },
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please check your details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-4 sm:p-6 lg:p-12 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center relative z-10">
        
        {/* Left Side: Apartment Community Showcase with Auto-Playing Video */}
        <div className="lg:col-span-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center shadow-xl shadow-brand-500/30 border border-white/20">
              <Building2 size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-brand-300 bg-brand-500/20 px-2.5 py-0.5 rounded-full border border-brand-500/30">
                  Residential Community
                </span>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                  Resident Registration
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1 drop-shadow-md">
                Vijaya Laxmi Complex
              </h1>
            </div>
          </div>

          {/* Auto-Playing Hero Video Container */}
          <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-800/90 aspect-video sm:aspect-16/9 bg-slate-950 group">
            <video
              src="/videos/hero_video.mp4"
              autoPlay
              loop
              muted
              playsInline
              onEnded={(e) => e.target.play()}
              className="w-full h-full object-cover"
            />
            {/* Ambient overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/25 to-transparent pointer-events-none"></div>

            {/* Video overlay badge and tagline */}
            <div className="absolute bottom-4 left-4 right-4 text-white z-10">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-300">
                  Vijaya Laxmi Complex Living
                </span>
              </div>
              <p className="text-xs text-slate-200 font-medium">
                Spacious sunlit apartments, 24/7 guarded security, and lush green family community.
              </p>
            </div>
          </div>

          {/* Resident Feature Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-slate-900/75 backdrop-blur-md rounded-2xl border border-slate-800 flex items-start gap-2.5 hover:border-brand-500/40 transition shadow-lg">
              <div className="w-8 h-8 rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30 flex items-center justify-center shrink-0 mt-0.5">
                <DoorClosed size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Spacious Flats</h4>
                <p className="text-[11px] text-slate-400">Expansive balconies &amp; natural sunlight.</p>
              </div>
            </div>

            <div className="p-3 bg-slate-900/75 backdrop-blur-md rounded-2xl border border-slate-800 flex items-start gap-2.5 hover:border-brand-500/40 transition shadow-lg">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Safe Gated Enclave</h4>
                <p className="text-[11px] text-slate-400">24/7 manned security &amp; CCTV coverage.</p>
              </div>
            </div>

            <div className="p-3 bg-slate-900/75 backdrop-blur-md rounded-2xl border border-slate-800 flex items-start gap-2.5 hover:border-brand-500/40 transition shadow-lg">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
                <Car size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Sheltered Parking</h4>
                <p className="text-[11px] text-slate-400">Covered parking with EV charge points.</p>
              </div>
            </div>

            <div className="p-3 bg-slate-900/75 backdrop-blur-md rounded-2xl border border-slate-800 flex items-start gap-2.5 hover:border-brand-500/40 transition shadow-lg">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Lush Gardens</h4>
                <p className="text-[11px] text-slate-400">Park, jog tracks, and fitness gym.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Registration Form Container */}
        <div className="lg:col-span-6 w-full max-w-lg mx-auto">
          <div className="bg-slate-900/90 backdrop-blur-2xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
            
            {/* Header */}
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-brand-400">
                New Account Registration
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                Register as Resident / User
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Fill in your details below to receive a secure email verification code.
              </p>
            </div>

            {error && (
              <div className="p-3.5 bg-red-950/70 border border-red-800/60 rounded-2xl text-red-200 text-xs flex items-center gap-2.5 animate-in fade-in">
                <AlertCircle size={16} className="text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Full Name *</label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-white font-medium placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Personal Email *</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-3 text-slate-500" />
                    <input
                      type="email"
                      required
                      placeholder="rahul@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-white font-medium placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Mobile Number *</label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3.5 top-3 text-slate-500" />
                    <input
                      type="tel"
                      required
                      placeholder="9876543210"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-white font-medium placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Password *</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-3 text-slate-500" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-white font-medium placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Confirm Password *</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-3 text-slate-500" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-white font-medium placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Date of Birth</label>
                  <div className="relative">
                    <Calendar size={15} className="absolute left-3.5 top-3 text-slate-500" />
                    <input
                      type="date"
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-white focus:outline-none focus:border-brand-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none focus:border-brand-500 transition"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-2xl transition flex items-center justify-center gap-2 shadow-lg shadow-brand-600/30 cursor-pointer border border-brand-400/20 mt-2"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Register &amp; Send Verification Code</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>

            <div className="text-center pt-2 text-xs border-t border-slate-800/80">
              <span className="text-slate-400">Already registered with Skyline? </span>
              <Link to="/login" className="text-brand-400 hover:text-brand-300 font-bold hover:underline">
                Sign In &rarr;
              </Link>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default Register;
