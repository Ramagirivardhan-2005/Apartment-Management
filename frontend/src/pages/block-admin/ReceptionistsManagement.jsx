import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  UserCheck,
  Plus,
  Mail,
  Phone,
  Building2,
  CheckCircle2,
  X,
  AlertCircle,
  ShieldCheck,
  Trash2,
  RotateCw,
  KeyRound,
} from 'lucide-react';

const ReceptionistsManagement = () => {
  const { user } = useAuth();
  const [receptionists, setReceptionists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobile: '',
    employeeId: '',
  });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchReceptionists = async () => {
    try {
      const res = await api.get('/receptionists');
      if (res.data?.success) {
        setReceptionists(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching receptionists:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceptionists();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (receptionists.length >= 2) {
      setError('This block already has the maximum permitted number of receptionists (2).');
      return;
    }

    try {
      const res = await api.post('/receptionists', formData);
      if (res.data?.success) {
        setSuccessMsg(res.data.message);
        setShowModal(false);
        setFormData({ fullName: '', email: '', mobile: '', employeeId: '' });
        fetchReceptionists();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create receptionist');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to deactivate receptionist ${name}?`)) return;
    try {
      const res = await api.delete(`/receptionists/${id}`);
      if (res.data?.success) {
        setSuccessMsg(`Receptionist ${name} deactivated.`);
        fetchReceptionists();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to deactivate receptionist');
    }
  };

  const handleResendOtp = async (rec) => {
    try {
      const res = await api.post('/auth/resend-otp', { email: rec.email });
      if (res.data?.success) {
        setSuccessMsg(`New 6-digit verification OTP sent to ${rec.email}`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to resend OTP');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Block Receptionists</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 font-bold border border-brand-200">
              {receptionists.length} / 2 Active
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage front-desk staff assigned to your block (Maximum 2 receptionists)
          </p>
        </div>

        <button
          onClick={() => {
            setError('');
            setShowModal(true);
          }}
          disabled={receptionists.length >= 2}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl transition shadow-sm self-start sm:self-auto cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={16} />
          <span>Add Receptionist</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-700 hover:text-emerald-900">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Receptionists List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {receptionists.length === 0 ? (
          <div className="col-span-2 p-12 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <UserCheck size={24} />
            </div>
            <h4 className="font-bold text-slate-800 text-sm">No Receptionists Added Yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Add up to 2 receptionists for your block. They will receive a 6-digit OTP to verify their email before managing resident check-ins and room allocations.
            </p>
          </div>
        ) : (
          receptionists.map((rec) => (
            <div
              key={rec._id}
              className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center font-bold text-base">
                    {rec.fullName?.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{rec.fullName}</h3>
                    <p className="text-[11px] font-mono text-emerald-700 font-semibold">
                      {rec.employeeId || 'REC-STAFF'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {rec.isEmailVerified ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 size={11} /> Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      <AlertCircle size={11} /> Pending OTP
                    </span>
                  )}
                  <button
                    onClick={() => handleDelete(rec._id, rec.fullName)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                    title="Deactivate Receptionist"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <Mail size={13} className="text-slate-400" />
                  <span>{rec.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={13} className="text-slate-400" />
                  <span>{rec.mobile}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 size={13} className="text-slate-400" />
                  <span>Assigned: <strong>{rec.assignedBlock?.name || 'This Block'}</strong></span>
                </div>
              </div>

              {!rec.isEmailVerified && (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Link
                    to={`/verify-otp?email=${encodeURIComponent(rec.email)}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-[11px] transition shadow-xs"
                  >
                    <KeyRound size={12} />
                    <span>Verify OTP</span>
                  </Link>
                  <button
                    onClick={() => handleResendOtp(rec)}
                    className="text-[11px] font-bold text-slate-500 hover:text-brand-600 transition cursor-pointer"
                  >
                    Resend OTP
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Receptionist Modal (Section 6 & 7) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Add Block Receptionist</h3>
                <p className="text-xs text-slate-500">6-Digit OTP verification email will be dispatched</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Sharma"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-brand-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Personal Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="priya@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-brand-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="9876543210"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-brand-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Receptionist ID</label>
                  <input
                    type="text"
                    placeholder="REC-1001"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-brand-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-900 space-y-1">
                <p className="font-bold flex items-center gap-1 text-emerald-950">
                  <ShieldCheck size={14} className="text-emerald-600" /> Mandatory 6-Digit Email OTP
                </p>
                <p className="leading-relaxed">
                  The receptionist will receive their OTP and login activation instructions. Once verified, they can record manual payments and allocate rooms.
                </p>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl transition"
                >
                  Create & Send OTP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceptionistsManagement;
