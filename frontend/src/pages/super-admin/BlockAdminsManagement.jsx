import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import {
  UserCheck,
  Plus,
  Mail,
  Phone,
  Building2,
  Send,
  CheckCircle2,
  X,
  AlertCircle,
  RotateCw,
  Edit2,
  ShieldCheck,
  Search,
  Filter,
} from 'lucide-react';

const BlockAdminsManagement = () => {
  const [admins, setAdmins] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterVerification, setFilterVerification] = useState('all'); // 'all', 'verified', 'pending'
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'active', 'pending_verification', 'inactive'
  const [search, setSearch] = useState('');

  // Add Admin Modal
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobile: '',
    employeeId: '',
    assignedBlock: '',
  });

  // Change Email Modal (Section 16: Changing Email Later)
  const [emailModalAdmin, setEmailModalAdmin] = useState(null);
  const [newEmail, setNewEmail] = useState('');
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);

  // Feedback states
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchData = async () => {
    try {
      const [adminsRes, blocksRes] = await Promise.all([
        api.get('/users/block-admins', {
          params: {
            verification: filterVerification !== 'all' ? filterVerification : undefined,
            status: filterStatus !== 'all' ? filterStatus : undefined,
            search: search || undefined,
          },
        }),
        api.get('/blocks'),
      ]);

      if (adminsRes.data?.success) setAdmins(adminsRes.data.data);
      if (blocksRes.data?.success) setBlocks(blocksRes.data.data);
    } catch (err) {
      console.error('Error fetching block admins:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterVerification, filterStatus, search]);

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    try {
      const res = await api.post('/users/block-admin', formData);
      if (res.data?.success) {
        setSuccessMsg(res.data.message || `Block Admin created! 6-digit OTP verification code sent to ${formData.email}`);
        setShowModal(false);
        setFormData({ fullName: '', email: '', mobile: '', employeeId: '', assignedBlock: '' });
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create Block Admin');
    }
  };

  const handleResendOtp = async (admin) => {
    setActionLoadingId(admin._id);
    setError('');
    try {
      const res = await api.post(`/users/block-admin/${admin._id}/resend-otp`);
      if (res.data?.success) {
        setSuccessMsg(`New 6-digit OTP sent to ${admin.email}`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleChangeEmailSubmit = async (e) => {
    e.preventDefault();
    if (!emailModalAdmin || !newEmail) return;

    setIsUpdatingEmail(true);
    try {
      const res = await api.put(`/users/block-admin/${emailModalAdmin._id}/email`, {
        newEmail,
      });

      if (res.data?.success) {
        setSuccessMsg(res.data.message);
        setEmailModalAdmin(null);
        setNewEmail('');
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update administrator email');
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Block Administrators</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Designated managers, email verification status, and block assignments
          </p>
        </div>
        <button
          onClick={() => {
            setError('');
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl transition shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <Plus size={16} />
          <span>Add Block Admin</span>
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

      {/* Filter Bar (Section 16: Filters) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, employee ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2 text-slate-900 focus:outline-none focus:border-brand-500"
          />
        </div>

        {/* Verification Filter */}
        <div>
          <select
            value={filterVerification}
            onChange={(e) => setFilterVerification(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-semibold focus:outline-none focus:border-brand-500"
          >
            <option value="all">Email Verification: All</option>
            <option value="verified">✓ Verified Only</option>
            <option value="pending">⚠ Pending Verification</option>
          </select>
        </div>

        {/* Account Status Filter */}
        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-semibold focus:outline-none focus:border-brand-500"
          >
            <option value="all">Account Status: All</option>
            <option value="active">Active</option>
            <option value="pending_verification">Pending Verification</option>
            <option value="inactive">Disabled / Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-4">Administrator</th>
                <th className="px-6 py-4">Email Address</th>
                <th className="px-6 py-4">Assigned Block</th>
                <th className="px-6 py-4">Account Status</th>
                <th className="px-6 py-4">Email Verification</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {admins.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400 text-xs">
                    No block administrators found matching the selected filters.
                  </td>
                </tr>
              ) : (
                admins.map((admin) => (
                  <tr key={admin._id} className="hover:bg-slate-50/60 transition">
                    {/* Admin Name & Joined */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold text-sm">
                          {admin.fullName?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{admin.fullName}</p>
                          <p className="text-slate-500 text-[11px]">ID: {admin.employeeId || 'N/A'}</p>
                        </div>
                      </div>
                    </td>

                    {/* Email & Contact */}
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        <p className="text-slate-800 flex items-center gap-1.5 font-medium">
                          <Mail size={12} className="text-slate-400" /> {admin.email}
                        </p>
                        {admin.pendingEmail && (
                          <p className="text-amber-600 text-[11px] font-semibold">
                            Pending Change: {admin.pendingEmail}
                          </p>
                        )}
                        <p className="text-slate-500 flex items-center gap-1.5">
                          <Phone size={12} className="text-slate-400" /> {admin.mobile}
                        </p>
                      </div>
                    </td>

                    {/* Block */}
                    <td className="px-6 py-4">
                      {admin.assignedBlock ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-50 text-brand-700 border border-brand-200 rounded-lg font-bold">
                          <Building2 size={12} /> {admin.assignedBlock.name}
                        </span>
                      ) : (
                        <span className="text-amber-600 font-medium flex items-center gap-1">
                          <AlertCircle size={13} /> Unassigned
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                          admin.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : admin.status === 'pending_verification'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {admin.status?.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Email Verification Column (Section 16 Table Specification) */}
                    <td className="px-6 py-4">
                      {admin.isEmailVerified ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold text-[11px]">
                            <CheckCircle2 size={12} /> Verified
                          </span>
                          {admin.emailVerifiedAt && (
                            <p className="text-[10px] text-slate-400">
                              {new Date(admin.emailVerifiedAt).toLocaleString([], {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-full font-bold text-[11px]">
                            <AlertCircle size={12} className="text-amber-600" /> Pending
                          </span>
                          <p className="text-[10px] text-amber-700 font-semibold">Awaiting OTP</p>
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right space-x-2">
                      {!admin.isEmailVerified && (
                        <>
                          <a
                            href={`/verify-otp?email=${encodeURIComponent(admin.email)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold transition cursor-pointer"
                            title="Open verification screen for this administrator"
                          >
                            <CheckCircle2 size={12} />
                            <span>Verify OTP</span>
                          </a>

                          <button
                            onClick={() => handleResendOtp(admin)}
                            disabled={actionLoadingId === admin._id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold transition cursor-pointer disabled:opacity-50"
                            title="Resend 6-digit verification OTP"
                          >
                            <RotateCw size={12} className={actionLoadingId === admin._id ? 'animate-spin' : ''} />
                            <span>Resend OTP</span>
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => {
                          setEmailModalAdmin(admin);
                          setNewEmail('');
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition cursor-pointer"
                        title="Update Administrator Email"
                      >
                        <Edit2 size={12} />
                        <span>Change Email</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Admin Modal (Section 16: Mandatory OTP Verification) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Add New Block Administrator</h3>
                <p className="text-xs text-slate-500">Account will be created in Pending Verification state with OTP</p>
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

            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Rahul Kumar"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-brand-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Personal Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="rahul@example.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-brand-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    placeholder="9876543210"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-brand-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Employee ID</label>
                  <input
                    type="text"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    placeholder="BA-1001"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-brand-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assign Block</label>
                  <select
                    value={formData.assignedBlock}
                    onChange={(e) => setFormData({ ...formData, assignedBlock: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-brand-500 focus:bg-white"
                  >
                    <option value="">-- Select Block --</option>
                    {blocks.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 text-[11px] text-amber-900 space-y-1">
                <p className="font-bold flex items-center gap-1 text-amber-950">
                  <ShieldCheck size={14} className="text-amber-600" /> Mandatory 6-Digit OTP Email Verification
                </p>
                <p className="leading-relaxed">
                  A secure 6-digit OTP will be generated and dispatched to the administrator's email. The account remains in <strong>Pending Verification</strong> state until the OTP is verified.
                </p>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
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

      {/* Change Email Modal (Section 16: Changing Email Later) */}
      {emailModalAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Update Administrator Email</h3>
                <p className="text-xs text-slate-500">{emailModalAdmin.fullName}</p>
              </div>
              <button onClick={() => setEmailModalAdmin(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleChangeEmailSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[11px]">Current Active Email</span>
                <span className="font-bold text-slate-900 font-mono">{emailModalAdmin.email}</span>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">New Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="new.email@apartment.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="p-3 bg-blue-50 text-blue-800 rounded-xl text-[11px] leading-relaxed border border-blue-200">
                A verification OTP will be sent to the new email address. The current email will remain active until the new email is confirmed.
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEmailModalAdmin(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingEmail}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl transition"
                >
                  {isUpdatingEmail ? 'Sending OTP...' : 'Send OTP to New Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlockAdminsManagement;
