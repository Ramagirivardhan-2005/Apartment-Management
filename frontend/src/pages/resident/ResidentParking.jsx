import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Car, AlertCircle, Plus, CheckCircle2, X, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';

const ResidentParking = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [formData, setFormData] = useState({
    category: 'parking_slot_occupied',
    description: '',
    vehicleNumber: '',
    priority: 'Medium',
  });
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchParking = async () => {
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
    fetchParking();
  }, [user]);

  const handleRaiseComplaint = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const parkingAllocation = profile?.parkingAllocations?.[0];
      await api.post('/complaints', {
        ...formData,
        parkingSlotId: parkingAllocation?.slot?._id,
        blockId: parkingAllocation?.block?._id || profile?.currentRoom?.block?._id,
        roomId: profile?.currentRoom?._id,
      });

      setSuccessMsg('Parking complaint registered! Block admin and security desk notified.');
      setShowComplaintModal(false);
      setFormData({
        category: 'parking_slot_occupied',
        description: '',
        vehicleNumber: '',
        priority: 'Medium',
      });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit complaint');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const parking = profile?.parkingAllocations?.[0];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">My Parking & Vehicle Details</h2>
          <p className="text-xs sm:text-sm text-slate-500">Allocated vehicle bay and parking issue reporting</p>
        </div>
        <button
          onClick={() => setShowComplaintModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <AlertCircle size={15} /> Raise Parking Issue
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

      {parking ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-6 border-b border-slate-100 flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-extrabold text-xl border border-amber-100">
                <Car size={28} />
              </div>
              <div>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Allocated Slot</span>
                <h3 className="text-2xl font-extrabold text-slate-900">Slot {parking.slot?.slotNumber}</h3>
                <p className="text-xs text-slate-500">{parking.block?.name} • {parking.slot?.floorLocation}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Monthly Fee</span>
              <span className="text-2xl font-extrabold text-brand-600">₹{parking.monthlyFee || parking.slot?.monthlyFee}/mo</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-slate-400 block mb-1">Registered Vehicle</span>
              <strong className="text-brand-600 font-mono text-sm">{parking.vehicleNumber}</strong>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-slate-400 block mb-1">Vehicle Type</span>
              <strong className="text-slate-900 text-sm">{parking.vehicleType}</strong>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-slate-400 block mb-1">Allocated Since</span>
              <strong className="text-slate-900 text-sm">{new Date(parking.allocationDate).toLocaleDateString()}</strong>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-10 rounded-3xl border border-slate-200 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Car size={24} />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Parking Allocated</h3>
          <p className="text-xs text-slate-500">Contact reception to allocate a vehicle bay for your apartment.</p>
        </div>
      )}

      {/* Raise Parking Complaint Modal */}
      {showComplaintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">Report Parking Issue</h3>
              <button onClick={() => setShowComplaintModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRaiseComplaint} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Issue Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                >
                  <option value="parking_slot_occupied">My Slot is Occupied by Another Vehicle</option>
                  <option value="wrong_vehicle_parked">Wrong Vehicle Parked in Assigned Slot</option>
                  <option value="unauthorized_parking">Unauthorized Vehicle in Parking Area</option>
                  <option value="vehicle_blocking_access">Vehicle Blocking Driveway / Access</option>
                  <option value="parking_damaged">Parking Slot / Floor Damaged</option>
                  <option value="parking_gate_problem">Basement Boom Barrier / Gate Issue</option>
                  <option value="parking_cleanliness_problem">Water Slush / Oil Cleanliness Issue</option>
                  <option value="parking_light_problem">Lighting / Visibility Problem</option>
                  <option value="other">Other Parking Problem</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Offending Vehicle Number (If applicable)</label>
                <input
                  type="text"
                  placeholder="e.g. KA-04-QQ-1122"
                  value={formData.vehicleNumber}
                  onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 uppercase"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description *</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Describe the parking issue in detail..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                ></textarea>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowComplaintModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResidentParking;
