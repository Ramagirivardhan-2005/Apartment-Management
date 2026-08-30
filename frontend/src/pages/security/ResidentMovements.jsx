import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { UserCheck, Search, LogIn, LogOut, CheckCircle2, X } from 'lucide-react';

const ResidentMovements = () => {
  const [residents, setResidents] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedResident, setSelectedResident] = useState('');
  const [movementType, setMovementType] = useState('ENTRY');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [remarks, setRemarks] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchData = async () => {
    try {
      const [resRes, logRes] = await Promise.all([
        api.get('/security/resident-lookup'),
        api.get('/security/logs?logType=resident_movement'),
      ]);

      if (resRes.data?.success) setResidents(resRes.data.data);
      if (logRes.data?.success) setMovements(logRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogMovement = async (e) => {
    e.preventDefault();
    try {
      const residentObj = residents.find((r) => r._id === selectedResident);
      await api.post('/security/resident-movement', {
        residentId: selectedResident,
        movementType,
        vehicleNumber,
        remarks,
      });

      setSuccessMsg(`Resident ${movementType} logged for ${residentObj?.fullName || 'Resident'}`);
      setSelectedResident('');
      setVehicleNumber('');
      setRemarks('');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record movement');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Resident Gate Movements</h2>
        <p className="text-xs sm:text-sm text-slate-500">Record resident entry and exit movements through the security gate</p>
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

      {/* Entry / Exit Form */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs max-w-2xl">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Log Gate Movement</h3>
        <form onSubmit={handleLogMovement} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Resident *</label>
            <select
              required
              value={selectedResident}
              onChange={(e) => setSelectedResident(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-medium"
            >
              <option value="">-- Choose Resident --</option>
              {residents.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.fullName} ({r.mobile}) • Room: {r.currentRoom?.roomNumber || 'N/A'} ({r.currentRoom?.block?.name || ''})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Movement Type</label>
              <select
                value={movementType}
                onChange={(e) => setMovementType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-bold"
              >
                <option value="ENTRY">ENTRY (Entering Complex)</option>
                <option value="EXIT">EXIT (Leaving Complex)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Vehicle (If driving)</label>
              <input
                type="text"
                placeholder="e.g. KA-05-AB-9988"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 uppercase font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Remarks / Note</label>
            <input
              type="text"
              placeholder="e.g. Returning from work, luggage"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-3 rounded-xl transition cursor-pointer shadow-md mt-2"
          >
            Record Movement Log
          </button>
        </form>
      </div>

      {/* Movements Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">Recent Movements Log</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-4">Resident</th>
                <th className="px-6 py-4">Movement</th>
                <th className="px-6 py-4">Vehicle</th>
                <th className="px-6 py-4">Time</th>
                <th className="px-6 py-4">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movements.map((m) => (
                <tr key={m._id} className="hover:bg-slate-50/60 transition">
                  <td className="px-6 py-4 font-bold text-slate-900">{m.residentName || 'Resident'}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                        m.movementType === 'ENTRY' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {m.movementType}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono font-medium text-slate-700">{m.vehicleNumber || 'On Foot'}</td>
                  <td className="px-6 py-4 text-slate-500">{new Date(m.timestamp).toLocaleTimeString()}</td>
                  <td className="px-6 py-4 text-slate-600">{m.remarks || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ResidentMovements;
