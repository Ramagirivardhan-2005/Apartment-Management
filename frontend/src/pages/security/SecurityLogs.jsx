import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { Shield, Search, Filter, Calendar } from 'lucide-react';

const SecurityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [logType, setLogType] = useState('');

  const fetchLogs = async () => {
    try {
      const res = await api.get('/security/logs', {
        params: {
          search: search || undefined,
          logType: logType || undefined,
        },
      });
      if (res.data?.success) setLogs(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [search, logType]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Gate Security Logs</h2>
        <p className="text-xs sm:text-sm text-slate-500">Chronological history of visitor check-ins, check-outs, and resident movements</p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search visitor, resident, vehicle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div>
          <select
            value={logType}
            onChange={(e) => setLogType(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-brand-500"
          >
            <option value="">All Gate Log Types</option>
            <option value="visitor_checkin">Visitor Check-In</option>
            <option value="visitor_checkout">Visitor Check-Out</option>
            <option value="resident_movement">Resident Movement</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-4">Log Type</th>
                <th className="px-6 py-4">Person</th>
                <th className="px-6 py-4">Action Details</th>
                <th className="px-6 py-4">Vehicle</th>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Logged By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log._id} className="hover:bg-slate-50/60 transition">
                  <td className="px-6 py-4">
                    <span className="font-mono font-bold text-[11px] bg-slate-100 text-slate-800 px-2 py-0.5 rounded uppercase">
                      {log.logType?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900">
                    {log.visitorName || log.residentName || 'Visitor / Resident'}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {log.movementType && <span className="font-bold text-brand-600 mr-2">{log.movementType}</span>}
                    {log.purpose || log.remarks || '—'}
                  </td>
                  <td className="px-6 py-4 font-mono font-medium text-slate-700">{log.vehicleNumber || '—'}</td>
                  <td className="px-6 py-4 text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="px-6 py-4 text-slate-500">{log.guardName || 'Security Desk'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SecurityLogs;
