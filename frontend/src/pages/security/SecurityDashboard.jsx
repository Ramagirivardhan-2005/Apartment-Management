import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import {
  ShieldAlert,
  Users,
  UserCheck,
  LogIn,
  LogOut,
  Car,
  Search,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const SecurityDashboard = () => {
  const [stats, setStats] = useState(null);
  const [activeVisitors, setActiveVisitors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSecurityData = async () => {
      try {
        const [statsRes, visRes] = await Promise.allSettled([
          api.get('/security/stats'),
          api.get('/visitors?status=inside'),
        ]);

        if (statsRes.status === 'fulfilled' && statsRes.value?.data?.success) {
          setStats(statsRes.value.data.data);
        }
        if (visRes.status === 'fulfilled' && visRes.value?.data?.success) {
          setActiveVisitors(visRes.value.data.data.slice(0, 5));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSecurityData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const quickActions = [
    { label: 'Visitor Check-In', to: '/security/check-in', icon: LogIn, color: 'bg-emerald-600', text: 'Log incoming visitor & issue pass' },
    { label: 'Visitor Check-Out', to: '/security/check-out', icon: LogOut, color: 'bg-rose-600', text: 'Mark departure & calculate duration' },
    { label: 'Resident Lookup', to: '/security/lookup', icon: Search, color: 'bg-blue-600', text: 'Privacy-restricted resident verification' },
    { label: 'Resident Entry / Exit', to: '/security/movements', icon: UserCheck, color: 'bg-purple-600', text: 'Log resident gate movements' },
  ];

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-1">
            <ShieldAlert size={15} /> Main Security Gate Command
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Security Desk</h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
            Gate access control, visitor tracking, departure duration calculations, and resident privacy lookup.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/security/check-in"
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shadow-sm"
          >
            + Check In Visitor
          </Link>
          <Link
            to="/security/check-out"
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition shadow-sm"
          >
            Check Out Visitor
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Currently Inside</span>
          <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">
            {stats?.currentlyInsideVisitors || 0}
          </h3>
          <p className="text-[11px] text-slate-400">Visitors on premises</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Today's Total Visitors</span>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
            {stats?.todayTotalVisitors || 0}
          </h3>
          <p className="text-[11px] text-slate-400">Passed main gate</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Resident Movements</span>
          <h3 className="text-2xl font-extrabold text-brand-600 mt-1">
            {stats?.todayResidentMovements || 0}
          </h3>
          <p className="text-[11px] text-slate-400">Logged entries / exits today</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Total Security Logs</span>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
            {stats?.totalLogsCount || 0}
          </h3>
          <p className="text-[11px] text-slate-400">Audit gate trail</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-3">Gate Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((act) => {
            const Icon = act.icon;
            return (
              <Link
                key={act.label}
                to={act.to}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition flex items-center gap-4 group"
              >
                <div className={`w-11 h-11 rounded-2xl ${act.color} text-white flex items-center justify-center shrink-0`}>
                  <Icon size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs group-hover:text-brand-600 transition">{act.label}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">{act.text}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Active Visitors Inside */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Visitors Currently Inside ({activeVisitors.length})</h3>
          <Link to="/security/check-out" className="text-xs font-bold text-rose-600 hover:underline">
            Check-out manager &rarr;
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-4">Visitor</th>
                <th className="px-6 py-4">Resident / Room</th>
                <th className="px-6 py-4">Purpose</th>
                <th className="px-6 py-4">Vehicle</th>
                <th className="px-6 py-4">Entry Time</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeVisitors.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-400 text-xs">
                    No visitors currently inside the premises.
                  </td>
                </tr>
              ) : (
                activeVisitors.map((v) => (
                  <tr key={v._id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {v.visitorName} ({v.mobile})
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {v.residentName || v.resident?.fullName} (Room {v.roomNumber || v.room?.roomNumber})
                    </td>
                    <td className="px-6 py-4 text-slate-600">{v.purpose}</td>
                    <td className="px-6 py-4 font-mono font-medium text-slate-700">{v.vehicleNumber || '—'}</td>
                    <td className="px-6 py-4 text-emerald-700 font-semibold">
                      {new Date(v.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to="/security/check-out"
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl transition"
                      >
                        Check Out
                      </Link>
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

export default SecurityDashboard;
