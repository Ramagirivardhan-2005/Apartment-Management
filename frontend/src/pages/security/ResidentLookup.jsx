import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { Search, Shield, User, Phone, DoorClosed, Building2, CheckCircle2 } from 'lucide-react';

const ResidentLookup = () => {
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchResidents = async () => {
    try {
      const res = await api.get('/security/resident-lookup', {
        params: { search: search || undefined },
      });
      if (res.data?.success) setResidents(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResidents();
  }, [search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full inline-flex mb-1">
            <Shield size={12} /> Privacy Protected Security View
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Resident Directory Lookup</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Verify residents and room locations at the main security desk (financial & document data masked)
          </p>
        </div>
        <div className="w-full sm:w-72 relative">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search name, phone, room..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-brand-500 shadow-xs"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-4">Resident Name</th>
                <th className="px-6 py-4">Phone Number</th>
                <th className="px-6 py-4">Allocated Room</th>
                <th className="px-6 py-4">Apartment Block</th>
                <th className="px-6 py-4">Emergency Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {residents.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400 text-xs">
                    No resident records found.
                  </td>
                </tr>
              ) : (
                residents.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 text-brand-600 flex items-center justify-center font-bold text-xs">
                          {r.fullName?.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-900">{r.fullName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">{r.mobile}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {r.currentRoom?.roomNumber ? `Room ${r.currentRoom.roomNumber}` : '—'}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {r.currentRoom?.block?.name || '—'}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {r.emergencyContact?.name ? `${r.emergencyContact.name} (${r.emergencyContact.mobile})` : '—'}
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

export default ResidentLookup;
