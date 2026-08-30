import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Building2, ArrowRight, CheckCircle2, AlertCircle, CreditCard, Sparkles } from 'lucide-react';

const ActivateAccount = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verifiedUser, setVerifiedUser] = useState(null);
  const { setAuthSession } = useAuth();
  const navigate = useNavigate();

  const handleActivate = async () => {
    if (!email) {
      setError('Email address is missing from the verification link.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await api.post('/auth/activate-account', { token, email });
      if (res.data?.success) {
        const user = res.data.user;
        const authToken = res.data.token;

        if (authToken && user) {
          localStorage.setItem('apartment_token', authToken);
          localStorage.setItem('apartment_user', JSON.stringify(user));
          if (setAuthSession) {
            setAuthSession(authToken, user);
          }
        }

        setVerifiedUser(user);
        setIsVerified(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Activation link is invalid or has expired');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Attempt auto-activation if email & token present
  useEffect(() => {
    if (email) {
      handleActivate();
    }
  }, [email]);

  const handleProceed = (user) => {
    const role = user?.role || verifiedUser?.role;
    if (role === 'receptionist') navigate('/receptionist/payments', { replace: true });
    else if (role === 'block_admin') navigate('/block-admin/dashboard', { replace: true });
    else if (role === 'super_admin') navigate('/super-admin/dashboard', { replace: true });
    else navigate('/resident/payments', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center text-white font-bold shadow-md shadow-brand-500/20">
            <Building2 size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">
              {isVerified ? 'Account Verified' : 'Account Verification'}
            </h2>
            <p className="text-xs text-slate-400">
              {isVerified ? 'Ready for Advance Payment' : 'Confirm your registration'}
            </p>
          </div>
        </div>

        {email && (
          <div className="p-3 bg-brand-950/40 border border-brand-800/40 rounded-xl text-xs text-brand-300">
            Verifying account for: <strong>{email}</strong>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-950/60 border border-red-800/60 rounded-xl text-red-200 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isVerified ? (
          <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-emerald-950/70 border border-emerald-800/60 rounded-2xl text-emerald-200 text-xs flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-900 text-emerald-300 flex items-center justify-center shrink-0">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <p className="font-bold text-sm text-emerald-300">Verification Successful!</p>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Your account is active. No password creation required.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-800/70 border border-slate-700/60 rounded-xl text-xs text-slate-300 flex items-center gap-2">
              <CreditCard size={16} className="text-brand-400 shrink-0" />
              <span>Next step: Proceed to Advance Payment Flow</span>
            </div>

            <button
              type="button"
              onClick={() => handleProceed(verifiedUser)}
              className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-3 rounded-2xl text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-brand-600/30 cursor-pointer"
            >
              <span>Proceed to Advance Payment</span>
              <ArrowRight size={15} />
            </button>
          </div>
        ) : (
          <div>
            <button
              type="button"
              onClick={handleActivate}
              disabled={isSubmitting}
              className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-3 rounded-2xl text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-brand-600/30 cursor-pointer"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Verify Account & Proceed to Advance Payment</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivateAccount;
