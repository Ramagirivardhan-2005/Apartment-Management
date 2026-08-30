import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Phone, ShieldCheck, KeyRound, CheckCircle2, X } from 'lucide-react';

const ResidentProfile = () => {
  const { user, login } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [isChangingPw, setIsChangingPw] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await api.get(`/users/${user._id}`);
      if (res.data?.success) setProfile(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPwError('New passwords do not match');
      return;
    }

    setIsChangingPw(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      setPwSuccess('Password changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPwError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setIsChangingPw(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const u = profile?.user || user;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Resident Profile & Security</h2>
        <p className="text-xs sm:text-sm text-slate-500">Personal information, emergency contacts, and credential management</p>
      </div>

      {/* Profile Overview */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-3xl bg-brand-600 text-white flex items-center justify-center font-extrabold text-2xl shadow-md">
            {u.fullName?.charAt(0)}
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">{u.fullName}</h3>
            <p className="text-xs text-slate-500">{u.email} • {u.mobile}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {u.isDocumentVerified ? '✓ Identity Verified' : 'Pending Verification'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-50 text-brand-700">
                Resident Account
              </span>
            </div>
          </div>
        </div>

        {/* Address & Emergency Contacts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2">Permanent Address</h4>
            <p className="text-slate-600">
              {[u.address?.houseNo, u.address?.street, u.address?.villageCity, u.address?.district, u.address?.state, u.address?.pincode].filter(Boolean).join(', ') || 'Address not updated.'}
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2">Emergency Contact</h4>
            <p className="font-bold text-slate-900">{u.emergencyContact?.name || 'Not provided'}</p>
            <p className="text-slate-600">{u.emergencyContact?.relationship || 'Contact'} • {u.emergencyContact?.mobile || 'No mobile'}</p>
          </div>
        </div>

        {/* ID Proofs */}
        <div>
          <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2">Verified Identity Proofs</h4>
          {u.identityProofs?.length === 0 ? (
            <p className="text-xs text-slate-400">No identity proofs registered.</p>
          ) : (
            <div className="space-y-2">
              {u.identityProofs?.map((p, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900">{p.proofType}: </span>
                    <span className="font-mono text-slate-700">{p.proofNumber || 'Uploaded'}</span>
                  </div>
                  <span className={`text-[10px] font-bold uppercase ${p.verificationStatus === 'verified' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {p.verificationStatus}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Change Password Form */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <KeyRound size={18} className="text-brand-600" />
          <h3 className="text-base font-bold text-slate-900">Change Account Password</h3>
        </div>

        {pwError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
            {pwError}
          </div>
        )}

        {pwSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{pwSuccess}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Current Password</label>
            <input
              type="password"
              required
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">New Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900"
            />
          </div>

          <button
            type="submit"
            disabled={isChangingPw}
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl transition cursor-pointer disabled:opacity-50"
          >
            {isChangingPw ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResidentProfile;
