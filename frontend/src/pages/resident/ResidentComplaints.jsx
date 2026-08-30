import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import { AlertCircle, Plus, Clock, MessageSquare, CheckCircle2, X } from 'lucide-react';

const ResidentComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    category: 'room_maintenance',
    description: '',
    vehicleNumber: '',
    priority: 'Medium',
  });
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchComplaints = async () => {
    try {
      const res = await api.get('/complaints');
      if (res.data?.success) setComplaints(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/complaints', formData);
      setSuccessMsg('Complaint submitted successfully! You will receive updates via email.');
      setShowModal(false);
      setFormData({ category: 'room_maintenance', description: '', vehicleNumber: '', priority: 'Medium' });
      fetchComplaints();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit complaint');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">My Complaints & Service Requests</h2>
          <p className="text-xs sm:text-sm text-slate-500">Track maintenance, plumbing, electrical, and parking issues</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl transition shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <Plus size={16} /> New Request
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

      {/* Complaints List */}
      <div className="space-y-4">
        {complaints.length === 0 ? (
          <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center text-slate-400 text-xs shadow-xs">
            No complaints raised yet.
          </div>
        ) : (
          complaints.map((c) => (
            <div key={c._id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg">
                    {c.complaintId}
                  </span>
                  <StatusBadge status={c.status} />
                </div>
                <span className="text-xs text-slate-400">{new Date(c.createdAt).toLocaleDateString()}</span>
              </div>

              <h4 className="text-sm font-bold text-slate-900 capitalize">
                {c.category?.replace(/_/g, ' ')}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">{c.description}</p>

              {/* Updates timeline if any */}
              {c.updates && c.updates.length > 1 && (
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Status Updates</span>
                  {c.updates.slice(1).map((u, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs flex items-start gap-2">
                      <MessageSquare size={14} className="text-brand-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-slate-900">
                          Status: <span className="text-brand-700">{u.status}</span>
                        </p>
                        <p className="text-slate-600 text-[11px] mt-0.5">{u.note}</p>
                        <span className="text-[10px] text-slate-400">{new Date(u.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">Submit Service Request</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Issue Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                >
                  <option value="room_maintenance">Room Maintenance / Carpentry</option>
                  <option value="electrical">Electrical / Light Issue</option>
                  <option value="plumbing">Plumbing / Water Leakage</option>
                  <option value="parking_slot_occupied">Parking Slot Occupied</option>
                  <option value="wrong_vehicle_parked">Wrong Vehicle Parked</option>
                  <option value="noise_complaint">Noise Disturbance</option>
                  <option value="security_concern">Security Concern</option>
                  <option value="other">Other Request</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Detailed Description *</label>
                <textarea
                  rows="4"
                  required
                  placeholder="Describe your issue with room location..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                ></textarea>
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
                  disabled={isSubmitting}
                  className="px-5 py-2 font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResidentComplaints;
