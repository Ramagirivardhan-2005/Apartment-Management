import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import { Users, Plus, Phone, Clock, User, CheckCircle2, X } from 'lucide-react';

const ReceptionVisitors = () => {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [residents, setResidents] = useState([]);
  const [blocks, setBlocks] = useState([]);

  const [formData, setFormData] = useState({
    visitorName: '',
    mobile: '',
    purpose: '',
    residentId: '',
    blockId: '',
    numberOfVisitors: 1,
    vehicleNumber: '',
  });

  const [successMsg, setSuccessMsg] = useState('');

  const fetchVisitors = async () => {
    try {
      const [visRes, resRes, blkRes] = await Promise.all([
        api.get('/visitors'),
        api.get('/users?role=resident'),
        api.get('/blocks'),
      ]);

      if (visRes.data?.success) setVisitors(visRes.data.data);
      if (resRes.data?.success) setResidents(resRes.data.data);
      if (blkRes.data?.success) setBlocks(blkRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors();
  }, []);

  const handleCreateVisitor = async (e) => {
    e.preventDefault();
    try {
      await api.post('/visitors', formData);
      setSuccessMsg(`Visitor pass issued for ${formData.visitorName}`);
      setShowModal(false);
      fetchVisitors();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to issue visitor pass');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Visitor Passes & Check-In</h2>
          <p className="text-xs sm:text-sm text-slate-500">Issue visitor gate passes and guest check-ins</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl transition shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <Plus size={16} /> Issue Visitor Pass
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-700">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Visitors List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-4">Visitor</th>
                <th className="px-6 py-4">Resident Visiting</th>
                <th className="px-6 py-4">Purpose</th>
                <th className="px-6 py-4">Vehicle</th>
                <th className="px-6 py-4">Entry Time</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visitors.map((v) => (
                <tr key={v._id} className="hover:bg-slate-50/60 transition">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900">{v.visitorName}</p>
                    <p className="text-[11px] text-slate-500">{v.mobile} ({v.numberOfVisitors} guests)</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-800">{v.residentName || v.resident?.fullName || 'Resident'}</p>
                    <p className="text-[11px] text-slate-500">Room {v.roomNumber || v.room?.roomNumber || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4 text-slate-700">{v.purpose}</td>
                  <td className="px-6 py-4 font-mono font-medium text-slate-600">
                    {v.vehicleNumber || 'No vehicle'}
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {new Date(v.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={v.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4">Issue Visitor Gate Pass</h3>
            <form onSubmit={handleCreateVisitor} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Visitor Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Suresh Raina"
                  value={formData.visitorName}
                  onChange={(e) => setFormData({ ...formData, visitorName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="9876543210"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Guests Count</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.numberOfVisitors}
                    onChange={(e) => setFormData({ ...formData, numberOfVisitors: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Select Resident</label>
                  <select
                    required
                    value={formData.residentId}
                    onChange={(e) => setFormData({ ...formData, residentId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                  >
                    <option value="">-- Resident --</option>
                    {residents.map((r) => (
                      <option key={r._id} value={r._id}>{r.fullName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Block</label>
                  <select
                    required
                    value={formData.blockId}
                    onChange={(e) => setFormData({ ...formData, blockId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                  >
                    <option value="">-- Block --</option>
                    {blocks.map((b) => (
                      <option key={b._id} value={b._id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Purpose of Visit *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Family visit, delivery, maintenance"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Vehicle Number (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. KA-03-JJ-9988"
                  value={formData.vehicleNumber}
                  onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 uppercase"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl"
                >
                  Issue Pass & Check In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceptionVisitors;
