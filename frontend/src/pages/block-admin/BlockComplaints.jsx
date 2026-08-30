import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/common/StatusBadge';
import {
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  X,
  MessageSquare,
  Clock,
  User,
  Car,
  DoorClosed,
} from 'lucide-react';

const BlockComplaints = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [newStatus, setNewStatus] = useState('ACKNOWLEDGED');
  const [statusNote, setStatusNote] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchComplaints = async () => {
    try {
      const res = await api.get('/complaints', {
        params: {
          blockId: user?.assignedBlock?._id || user?.assignedBlock || undefined,
          status: selectedStatus || undefined,
          category: selectedCategory || undefined,
        },
      });
      if (res.data?.success) setComplaints(res.data.data);
    } catch (err) {
      console.error('Error fetching complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [user, selectedStatus, selectedCategory]);

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    try {
      await api.put(`/complaints/${selectedComplaint._id}/status`, {
        status: newStatus,
        note: statusNote,
      });

      setSuccessMsg(`Complaint ${selectedComplaint.complaintId} updated to ${newStatus}. Resident notified.`);
      setSelectedComplaint(null);
      setStatusNote('');
      fetchComplaints();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update complaint status');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Complaints & Maintenance Tickets</h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Manage resident parking complaints, room repairs, and lifecycle status workflow
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-700 hover:text-emerald-900">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-brand-500"
          >
            <option value="">All Complaint Statuses</option>
            <option value="NEW">NEW</option>
            <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
            <option value="ASSIGNED">ASSIGNED</option>
            <option value="IN_PROGRESS">IN PROGRESS</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="CLOSED">CLOSED</option>
          </select>
        </div>

        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-brand-500"
          >
            <option value="">All Categories</option>
            <option value="parking_slot_occupied">Parking Slot Occupied</option>
            <option value="wrong_vehicle_parked">Wrong Vehicle Parked</option>
            <option value="unauthorized_parking">Unauthorized Parking</option>
            <option value="parking_damaged">Parking Damaged</option>
            <option value="parking_cleanliness_problem">Parking Cleanliness</option>
            <option value="room_maintenance">Room Maintenance</option>
            <option value="electrical">Electrical</option>
            <option value="plumbing">Plumbing</option>
          </select>
        </div>
      </div>

      {/* Complaints List */}
      <div className="space-y-4">
        {complaints.map((c) => (
          <div
            key={c._id}
            className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition flex flex-col md:flex-row md:items-center justify-between gap-6"
          >
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg">
                  {c.complaintId}
                </span>
                <StatusBadge status={c.status} />
                <span className="text-[11px] font-bold uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                  {c.priority} Priority
                </span>
                <span className="text-xs text-slate-400">
                  {new Date(c.createdAt).toLocaleDateString()}
                </span>
              </div>

              <h4 className="text-sm font-bold text-slate-900 capitalize">
                {c.category?.replace(/_/g, ' ')}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">{c.description}</p>

              <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 flex-wrap">
                <span className="flex items-center gap-1 font-medium text-slate-700">
                  <User size={13} className="text-slate-400" /> {c.resident?.fullName} ({c.resident?.mobile})
                </span>
                {c.room && (
                  <span className="flex items-center gap-1">
                    <DoorClosed size={13} className="text-slate-400" /> Room {c.room?.roomNumber}
                  </span>
                )}
                {c.parkingSlot && (
                  <span className="flex items-center gap-1">
                    <Car size={13} className="text-slate-400" /> Slot {c.parkingSlot?.slotNumber}
                  </span>
                )}
                {c.vehicleNumber && (
                  <span className="font-mono text-brand-600 font-bold bg-brand-50 px-1.5 py-0.5 rounded">
                    Vehicle: {c.vehicleNumber}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedComplaint(c);
                setNewStatus(c.status);
                setStatusNote('');
              }}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition self-start md:self-auto cursor-pointer"
            >
              Update Status
            </button>
          </div>
        ))}
      </div>

      {/* Update Status Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Update Complaint Status</h3>
                <p className="text-xs text-slate-500">{selectedComplaint.complaintId}</p>
              </div>
              <button onClick={() => setSelectedComplaint(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select New Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-bold"
                >
                  <option value="NEW">NEW</option>
                  <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
                  <option value="ASSIGNED">ASSIGNED</option>
                  <option value="IN_PROGRESS">IN PROGRESS</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="CLOSED">CLOSED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Admin Resolution Note / Message</label>
                <textarea
                  rows="3"
                  required
                  placeholder="e.g. Technician has completed the plumbing check. Slot cleared."
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900"
                ></textarea>
              </div>

              <div className="p-3 bg-blue-50 text-blue-800 rounded-xl text-[11px]">
                Updating this status will automatically dispatch an email and in-app notification to resident <strong>{selectedComplaint.resident?.fullName}</strong>.
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedComplaint(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl"
                >
                  Update & Notify
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlockComplaints;
