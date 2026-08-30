import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  UserCheck,
  CheckCircle2,
  X,
  AlertTriangle,
  Mail,
  Phone,
  User,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

const BlocksManagement = () => {
  const [blocks, setBlocks] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBlock, setEditingBlock] = useState(null);

  // Form State supporting Block Details & Block Admin Onboarding (Section 2)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    floors: 4,
    totalRooms: 20,
    adminMode: 'new', // 'new' or 'existing'
    adminName: '',
    adminEmail: '',
    adminMobile: '',
    adminEmployeeId: '',
    admin: '',
  });

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [blocksRes, adminsRes] = await Promise.all([
        api.get('/blocks'),
        api.get('/users/block-admins'),
      ]);

      if (blocksRes.data?.success) setBlocks(blocksRes.data.data);
      if (adminsRes.data?.success) setAdmins(adminsRes.data.data);
    } catch (err) {
      console.error('Error fetching blocks data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingBlock(null);
    setFormData({
      name: '',
      code: '',
      address: '',
      floors: 4,
      totalRooms: 20,
      adminMode: 'new',
      adminName: '',
      adminEmail: '',
      adminMobile: '',
      adminEmployeeId: '',
      admin: '',
    });
    setError('');
    setShowModal(true);
  };

  const openEditModal = (block) => {
    setEditingBlock(block);
    setFormData({
      name: block.name,
      code: block.code,
      address: block.address,
      floors: block.floors,
      totalRooms: block.totalRooms || 20,
      adminMode: 'existing',
      adminName: '',
      adminEmail: '',
      adminMobile: '',
      adminEmployeeId: '',
      admin: block.admin?._id || '',
    });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      if (editingBlock) {
        const payload = {
          name: formData.name,
          address: formData.address,
          floors: formData.floors,
          totalRooms: formData.totalRooms,
          admin: formData.admin || null,
        };
        const res = await api.put(`/blocks/${editingBlock._id}`, payload);
        if (res.data?.success) {
          setSuccessMsg(`Block ${formData.name} updated successfully.`);
          setShowModal(false);
          fetchData();
        }
      } else {
        // Create new Block + Onboard Admin with OTP (Section 2)
        const payload = {
          name: formData.name,
          code: formData.code,
          address: formData.address,
          floors: formData.floors,
          totalRooms: formData.totalRooms,
        };

        if (formData.adminMode === 'new' && formData.adminEmail && formData.adminName && formData.adminMobile) {
          payload.adminName = formData.adminName;
          payload.adminEmail = formData.adminEmail;
          payload.adminMobile = formData.adminMobile;
          payload.adminEmployeeId = formData.adminEmployeeId || undefined;
        } else if (formData.adminMode === 'existing' && formData.admin) {
          payload.admin = formData.admin;
        }

        const res = await api.post('/blocks', payload);
        if (res.data?.success) {
          setSuccessMsg(res.data.message || `Block ${formData.name} created successfully.`);
          setShowModal(false);
          fetchData();
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save block.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to deactivate ${name}?`)) {
      return;
    }

    try {
      const res = await api.delete(`/blocks/${id}`);
      if (res.data?.success) {
        setSuccessMsg(`Block ${name} deactivated successfully.`);
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete block.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Block Management</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure residential towers, floors, and onboard block administrators with 6-digit OTP verification
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl transition shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <Plus size={16} />
          <span>Add New Block</span>
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

      {/* Blocks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {blocks.length === 0 ? (
          <div className="col-span-full p-12 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Building2 size={24} />
            </div>
            <h4 className="font-bold text-slate-800 text-sm">No Blocks Configured Yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Click &quot;Add New Block&quot; above to create your first residential tower and assign a Block Administrator.
            </p>
          </div>
        ) : (
          blocks.map((block) => (
            <div
              key={block._id}
              className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between hover:shadow-md transition space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 bg-brand-50 text-brand-700 border border-brand-200 rounded-lg font-mono font-bold text-xs">
                    {block.code}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    block.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {block.status || 'Active'}
                  </span>
                </div>

                <h3 className="text-lg font-extrabold text-slate-900 leading-snug">{block.name}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{block.address}</p>

                {/* Assigned Admin */}
                <div className="mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Block Administrator
                  </span>
                  {block.admin ? (
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <UserCheck size={13} className="text-brand-600" />
                        <span>{block.admin.fullName}</span>
                      </div>
                      <div className="text-[11px] text-slate-500">{block.admin.email}</div>
                      <div className="mt-1 flex items-center gap-2">
                        {block.admin.isEmailVerified ? (
                          <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 size={11} /> Verified
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-600">
                            ⚠ Pending Email OTP
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-slate-400">
                          {block.admin.employeeId || 'BA-ADMIN'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">No Administrator Assigned</span>
                  )}
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">Total Rooms:</span>
                    <strong className="text-slate-900">{block.totalRooms || 0}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Floors:</span>
                    <strong className="text-slate-900">{block.floors} Floors</strong>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
                <button
                  onClick={() => openEditModal(block)}
                  className="px-3 py-1.5 text-slate-700 hover:bg-slate-100 rounded-xl font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 size={13} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(block._id, block.name)}
                  className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-xl font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Block Modal (Section 2) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingBlock ? 'Edit Block Details' : 'Create Block & Onboard Admin'}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingBlock ? 'Update block information' : 'Creates tower and dispatches 6-digit OTP to Block Admin'}
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Block Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Block A (Rosewood Tower)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-brand-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Block Code *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingBlock}
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="BLK-A"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 uppercase focus:outline-none focus:border-brand-500 focus:bg-white disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Floors *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.floors}
                    onChange={(e) => setFormData({ ...formData, floors: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-brand-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Address / Wing Location *</label>
                <textarea
                  required
                  rows="2"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. North Wing, Boulevard Avenue, Phase 1"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-brand-500 focus:bg-white"
                ></textarea>
              </div>

              {/* BLOCK ADMIN ONBOARDING (Section 2) */}
              {!editingBlock && (
                <div className="p-4 bg-brand-50/60 rounded-2xl border border-brand-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                      <ShieldCheck size={15} className="text-brand-600" />
                      <span>Block Administrator Details</span>
                    </span>
                    <span className="text-[10px] text-brand-700 font-bold uppercase">6-Digit OTP Email</span>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Admin Full Name *</label>
                    <div className="relative">
                      <User size={13} className="absolute left-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rahul Verma"
                        value={formData.adminName}
                        onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-900 focus:outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Personal Email *</label>
                      <div className="relative">
                        <Mail size={13} className="absolute left-3 top-3 text-slate-400" />
                        <input
                          type="email"
                          required
                          placeholder="rahul@example.com"
                          value={formData.adminEmail}
                          onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-900 focus:outline-none focus:border-brand-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Mobile Number *</label>
                      <div className="relative">
                        <Phone size={13} className="absolute left-3 top-3 text-slate-400" />
                        <input
                          type="tel"
                          required
                          placeholder="9876543210"
                          value={formData.adminMobile}
                          onChange={(e) => setFormData({ ...formData, adminMobile: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-900 focus:outline-none focus:border-brand-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Admin Employee ID (Optional)</label>
                    <input
                      type="text"
                      placeholder="BA-1001"
                      value={formData.adminEmployeeId}
                      onChange={(e) => setFormData({ ...formData, adminEmployeeId: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>
              )}

              {/* Editing Mode: Admin Reassignment */}
              {editingBlock && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assign Block Administrator</label>
                  <select
                    value={formData.admin}
                    onChange={(e) => setFormData({ ...formData, admin: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-brand-500 focus:bg-white"
                  >
                    <option value="">-- No Admin Assigned --</option>
                    {admins.map((a) => (
                      <option key={a._id} value={a._id}>
                        {a.fullName} ({a.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

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
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span>{editingBlock ? 'Save Changes' : 'Create Block & Send OTP'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlocksManagement;
