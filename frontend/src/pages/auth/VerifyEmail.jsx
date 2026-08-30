import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../../api/client';
import { Building2, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [status, setStatus] = useState('verifying');
  const [msg, setMsg] = useState('Verifying your email address...');

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus('error');
        setMsg('Missing verification token');
        return;
      }

      try {
        const res = await api.post('/auth/verify-email', { token, email });
        if (res.data?.success) {
          setStatus('success');
          setMsg('Email verified successfully! You can now access all services and book rooms.');
        }
      } catch (err) {
        setStatus('error');
        setMsg(err.response?.data?.message || 'Verification link is invalid or has expired.');
      }
    };

    verify();
  }, [token, email]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl">
        <div className="w-12 h-12 rounded-2xl bg-brand-500 flex items-center justify-center text-white font-bold mx-auto mb-4">
          <Building2 size={24} />
        </div>

        <h2 className="text-xl font-bold text-white mb-2">Email Verification</h2>
        <p className="text-xs text-slate-400 mb-6">{email}</p>

        {status === 'verifying' && (
          <div className="py-6 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-300">{msg}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-4 space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} />
            </div>
            <p className="text-xs text-emerald-300">{msg}</p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition"
            >
              <span>Continue to Sign In</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="py-4 space-y-4">
            <div className="w-14 h-14 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
              <XCircle size={32} />
            </div>
            <p className="text-xs text-red-300">{msg}</p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-6 py-2.5 rounded-xl transition"
            >
              <span>Back to Sign In</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
