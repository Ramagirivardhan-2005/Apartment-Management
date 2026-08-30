import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import { Car, Plus, Search, CheckCircle2, X } from 'lucide-react';

const ReceptionParking = () => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [residents, setResidents] = useState([]);
  const [formData, setFormData] = useState({
    residentId: '',
    vehicleNumber: '',
    vehicleType: '4-wheeler',
  });
  const [successMsg, setSuccessMsg] = useState('');

  const fetchSlots = async () => {
    try {
      const [slotsRes, resRes] = await Promise.all([
        api.get('/parking'),
        api.get('/users?role=resident'),
      ]);
      if (slotsRes.data?.success) setSlots(slotsRes.data.data);
      if (resRes.data?.success) setResidents(resRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, []);

  const handleAllocate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/parking/allocate', {
        slotId: selectedSlot._id,
        residentId: formData.residentId,
        vehicleNumber: formData.vehicleNumber,
        vehicleType: formData.vehicleType,
      });
      setSuccessMsg(`Parking slot ${selectedSlot.slotNumber} allocated successfully`);
      setShowAllocateModal(false);
      fetchSlots();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to allocate parking slot');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Parking Slot Allocations</h2>
        <p className="text-xs sm:text-sm text-slate-500">Front desk vehicle slot assignment</p>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {slots.map((slot) => (
          <div key={slot._id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-extrabold text-base text-slate-900">{slot.slotNumber}</span>
                <StatusBadge status={slot.status} />
              </div>
              <div className="space-y-1 text-xs text-slate-600">
                <p>{slot.block?.name} • {slot.floorLocation}</p>
                <p>Type: {slot.slotType}</p>
                <p className="font-bold text-brand-600">₹{slot.monthlyFee}/mo</p>
              </div>

              {slot.currentResident && (
                <div className="mt-3 pt-2 border-t border-slate-100 text-xs">
                  <p className="font-bold text-slate-900">{slot.currentResident.fullName}</p>
                  <p className="font-mono text-[11px] text-brand-600">{slot.currentVehicle?.vehicleNumber}</p>
                </div>
              )}
            </div>

            {slot.status === 'available' && (
              <button
                onClick={() => {
                  setSelectedSlot(slot);
                  setShowAllocateModal(true);
                }}
                className="mt-4 w-full py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Allocate Slot
              </button>
            )}
          </div>
        ))}
      </div>

      {showAllocateModal && selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4">Allocate Slot: {selectedSlot.slotNumber}</h3>
            <form onSubmit={handleAllocate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Resident</label>
                <select
                  required
                  value={formData.residentId}
                  onChange={(e) => setFormData({ ...formData, residentId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                >
                  <option value="">-- Choose Resident --</option>
                  {residents.map((r) => (
                    <option key={r._id} value={r._id}>{r.fullName} ({r.mobile})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Vehicle Type</label>
                <select
                  value={formData.vehicleType}
                  onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                >
                  <option value="4-wheeler">4-Wheeler Car</option>
                  <option value="2-wheeler">2-Wheeler Motorcycle</option>
                  <option value="EV">EV Electric Vehicle</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Vehicle License Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. KA-01-AB-1122"
                  value={formData.vehicleNumber}
                  onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 uppercase"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAllocateModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl"
                >
                  Confirm Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceptionParking;
