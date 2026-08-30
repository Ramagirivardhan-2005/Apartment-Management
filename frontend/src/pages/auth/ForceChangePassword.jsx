import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import {
  Building2,
  Lock,
  KeyRound,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';

const ForceChangePassword = () => {
  const { user, setUser, token, setAuthSession } = useAuth();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const redirectUserByRole = (role) => {
    switch (role) {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/force-change-password', {
        newPassword,
      });

      if (res.data?.success) {
        setSuccessMsg(res.data.message || 'Password changed successfully!');
        
        // Update user state in AuthContext and localStorage
        const updatedUser = {
          ...(user || {}),
          ...(res.data.user || {}),
          mustChangePassword: false,
        };

        if (setAuthSession && token) {
          setAuthSession(token, updatedUser);
        } else if (setUser) {
          setUser(updatedUser);
          localStorage.setItem('apartment_user', JSON.stringify(updatedUser));
        }

        setTimeout(() => {
          redirectUserByRole(updatedUser.role);
        }, 1000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* Brand Header */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/20">
            <ShieldAlert size={26} />
          </div>
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-400">
            Security Requirement
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
            Change Temporary Password
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            You signed in with temporary credentials. Please set your new personal password to continue.
          </p>
        </div>

        {/* User Card */}
        {user && (
          <div className="p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700/60 flex items-center justify-between text-xs">
            <div>
              <p className="font-bold text-white">{user.fullName}</p>
              <p className="text-slate-400 text-[11px]">{user.email}</p>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-brand-950 text-brand-400 border border-brand-800 font-bold uppercase text-[10px]">
              {user.role?.replace('_', ' ')}
            </span>
          </div>
        )}

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

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">New Personal Password *</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-3 text-slate-500" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="Minimum 6 characters"
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
            className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-xs rounded-2xl transition flex items-center justify-center gap-2 shadow-lg shadow-brand-600/30 cursor-pointer disabled:opacity-50 mt-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Update Password &amp; Open Dashboard</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-2">
          <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
          <span>Your password is encrypted using high-security bcrypt hashing.</span>
        </div>

      </div>
    </div>
  );
};

export default ForceChangePassword;
