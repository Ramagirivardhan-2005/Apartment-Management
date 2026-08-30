import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { LogIn, User, Phone, Car, CheckCircle2, ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const VisitorCheckIn = () => {
  const navigate = useNavigate();
  const [residents, setResidents] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [formData, setFormData] = useState({
    visitorName: '',
    mobile: '',
    purpose: 'Personal Visit',
    residentId: '',
    blockId: '',
    numberOfVisitors: 1,
    vehicleNumber: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [resRes, blkRes] = await Promise.all([
          api.get('/users?role=resident'),
          api.get('/blocks'),
        ]);

        if (resRes.data?.success) setResidents(resRes.data.data);
        if (blkRes.data?.success) setBlocks(blkRes.data.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchMetadata();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.post('/visitors', formData);
      if (res.data?.success) {
        setSuccessMsg(`Gate entry logged for ${formData.visitorName}! Status set to INSIDE.`);
        setFormData({
          visitorName: '',
          mobile: '',
          purpose: 'Personal Visit',
          residentId: '',
          blockId: '',
          numberOfVisitors: 1,
          vehicleNumber: '',
        });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to check-in visitor');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Visitor Gate Check-In</h2>
        <p className="text-xs sm:text-sm text-slate-500">Record incoming guest entry and set status to INSIDE</p>
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

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Visitor Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Anand Kumar"
              value={formData.visitorName}
              onChange={(e) => setFormData({ ...formData, visitorName: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mobile Number *</label>
              <input
                type="tel"
                required
                placeholder="9876543210"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Number of Visitors</label>
              <input
                type="number"
                min="1"
                value={formData.numberOfVisitors}
                onChange={(e) => setFormData({ ...formData, numberOfVisitors: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Resident Visiting *</label>
              <select
                required
                value={formData.residentId}
                onChange={(e) => setFormData({ ...formData, residentId: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900"
              >
                <option value="">-- Choose Resident --</option>
                {residents.map((r) => (
                  <option key={r._id} value={r._id}>{r.fullName} ({r.mobile})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Block *</label>
              <select
                required
                value={formData.blockId}
                onChange={(e) => setFormData({ ...formData, blockId: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900"
              >
                <option value="">-- Choose Block --</option>
                {blocks.map((b) => (
                  <option key={b._id} value={b._id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Purpose of Visit</label>
              <select
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900"
              >
                <option value="Personal Visit">Personal / Family Visit</option>
                <option value="Delivery / Courier">Delivery / Courier</option>
                <option value="Maintenance / Service">Maintenance / Repair</option>
                <option value="Cab / Taxi">Cab / Taxi Pickup</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Vehicle Number (If any)</label>
              <input
                type="text"
                placeholder="e.g. KA-01-AB-1234"
                value={formData.vehicleNumber}
                onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value.toUpperCase() })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 uppercase font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-md mt-4"
          >
            {isSubmitting ? 'Recording Entry...' : 'Complete Check-In (Status: Inside)'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default VisitorCheckIn;
