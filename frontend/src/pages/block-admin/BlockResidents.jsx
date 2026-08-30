import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Users, Search, Mail, Phone, DoorClosed, CheckCircle2 } from 'lucide-react';

const BlockResidents = () => {
  const { user } = useAuth();
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchResidents = async () => {
      try {
        const res = await api.get('/users', {
          params: {
            role: 'resident',
            search: search || undefined,
          },
        });
        if (res.data?.success) setResidents(res.data.data);
      } catch (err) {
        console.error('Error fetching block residents:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResidents();
  }, [user, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Block Residents</h2>
          <p className="text-xs sm:text-sm text-slate-500">Contact information and residency records</p>
        </div>
        <div className="w-full sm:w-72 relative">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search residents..."
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
                <th className="px-6 py-4">Resident</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Emergency Contact</th>
                <th className="px-6 py-4">ID Verification</th>
                <th className="px-6 py-4">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {residents.map((r) => (
                <tr key={r._id} className="hover:bg-slate-50/60 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold text-sm">
                        {r.fullName?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{r.fullName}</p>
                        <p className="text-slate-500 text-[11px]">{r.gender || 'Resident'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-800 font-medium">{r.mobile}</p>
                    <p className="text-slate-500 text-[11px]">{r.email}</p>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {r.emergencyContact?.name ? (
                      <div>
                        <p className="font-medium text-slate-800">{r.emergencyContact.name} ({r.emergencyContact.relationship})</p>
                        <p className="text-[11px] text-slate-500">{r.emergencyContact.mobile}</p>
                      </div>
                    ) : '—'}
                  </td>
                  <td className="px-6 py-4">
                    {r.isDocumentVerified ? (
                      <span className="text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle2 size={13} /> Verified
                      </span>
                    ) : (
                      <span className="text-amber-600 font-semibold">Pending</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BlockResidents;
