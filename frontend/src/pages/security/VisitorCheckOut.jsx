import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { LogOut, Search, Clock, CheckCircle2, User, Phone, Car } from 'lucide-react';

const VisitorCheckOut = () => {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchActiveVisitors = async () => {
    try {
      const res = await api.get('/visitors', {
        params: { status: 'inside', search: search || undefined },
      });
      if (res.data?.success) setVisitors(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveVisitors();
  }, [search]);

  const handleCheckOut = async (visitor) => {
    try {
      const res = await api.put(`/visitors/${visitor._id}/checkout`);
      if (res.data?.success) {
        const v = res.data.data;
        setSuccessMsg(
          `Visitor ${v.visitorName} checked out successfully! Total duration: ${v.durationMinutes || 0} minutes.`
        );
        fetchActiveVisitors();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to checkout visitor');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Visitor Gate Check-Out</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Mark guest departure, calculate stay duration, and record exit log
          </p>
        </div>
        <div className="w-full sm:w-72 relative">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search visitor, vehicle, resident..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-brand-500 shadow-xs"
          />
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Active Visitors List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-4">Visitor</th>
                <th className="px-6 py-4">Resident / Room</th>
                <th className="px-6 py-4">Purpose</th>
                <th className="px-6 py-4">Vehicle</th>
                <th className="px-6 py-4">Entry Time</th>
                <th className="px-6 py-4 text-right">Gate Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visitors.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400 text-xs">
                    No active visitors inside matching criteria.
                  </td>
                </tr>
              ) : (
                visitors.map((v) => (
                  <tr key={v._id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{v.visitorName}</p>
                      <p className="text-[11px] text-slate-500">{v.mobile} ({v.numberOfVisitors} person)</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-800">{v.residentName || v.resident?.fullName}</p>
                      <p className="text-[11px] text-slate-500">Room {v.roomNumber || v.room?.roomNumber}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{v.purpose}</td>
                    <td className="px-6 py-4 font-mono font-medium text-slate-700">
                      {v.vehicleNumber || '—'}
                    </td>
                    <td className="px-6 py-4 text-emerald-700 font-semibold">
                      {new Date(v.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleCheckOut(v)}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-xs"
                      >
                        Check Out
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VisitorCheckOut;
