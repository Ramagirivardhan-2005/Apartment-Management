import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import {
  Users,
  UserPlus,
  DoorClosed,
  CalendarDays,
  Car,
  CreditCard,
  UserCheck,
  Search,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const ReceptionistDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/reports/system-overview');
        if (res.data?.success) setStats(res.data.data);
      } catch (err) {
        console.error('Error fetching receptionist dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const quickActions = [
    { label: 'Register User', to: '/receptionist/users', icon: UserPlus, color: 'from-blue-600 to-indigo-600', text: 'Register new resident' },
    { label: 'Book Room (Wizard)', to: '/receptionist/book-room', icon: CalendarDays, color: 'from-emerald-600 to-teal-600', text: '8-step booking wizard' },
    { label: 'Search User Profile', to: '/receptionist/users', icon: Search, color: 'from-purple-600 to-pink-600', text: 'Lookup by mobile/email' },
    { label: 'Visitor Pass', to: '/receptionist/visitors', icon: Users, color: 'from-cyan-600 to-blue-600', text: 'Issue guest visitor pass' },
    { label: 'Allocate Parking', to: '/receptionist/parking', icon: Car, color: 'from-amber-600 to-orange-600', text: 'Assign vehicle slot' },
    { label: 'Collect Payment', to: '/receptionist/payments', icon: CreditCard, color: 'from-rose-600 to-red-600', text: 'Process rent & receipts' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-emerald-800/40 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-xs uppercase tracking-wider mb-2">
            <Sparkles size={15} /> Front-Desk Central Operations
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Receptionist Desk</h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
            Streamlined user registrations, multi-room bookings, proof verifications, and front-desk services.
          </p>
        </div>
        <Link
          to="/receptionist/book-room"
          className="px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black rounded-2xl transition shadow-lg shadow-emerald-500/25 flex items-center gap-2 self-start md:self-auto cursor-pointer relative z-10"
        >
          <span>Start Room Booking</span>
          <ArrowRight size={16} />
        </Link>
      </div>

      {/* Quick Action Cards */}
      <div>
        <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">
          Front-Desk Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                to={action.to}
                className="bg-slate-900/80 hover:bg-slate-850 p-5 rounded-3xl border border-slate-800/90 shadow-xl hover:border-brand-500/40 transition-all duration-200 flex items-center gap-4 group"
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${action.color} text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition duration-200 border border-white/10`}>
                  <Icon size={22} />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm group-hover:text-brand-400 transition">{action.label}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{action.text}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 p-5 rounded-3xl border border-slate-800/90 shadow-xl">
          <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Available Rooms</span>
          <h3 className="text-3xl font-black text-emerald-400 mt-1 font-mono">
            {stats?.rooms?.availableRooms || 0}
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">Ready for immediate check-in</p>
        </div>

        <div className="bg-slate-900/80 p-5 rounded-3xl border border-slate-800/90 shadow-xl">
          <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Available Parking</span>
          <h3 className="text-3xl font-black text-brand-400 mt-1 font-mono">
            {stats?.parking?.availableParking || 0}
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">Open vehicle bays</p>
        </div>

        <div className="bg-slate-900/80 p-5 rounded-3xl border border-slate-800/90 shadow-xl">
          <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Today's Visitors</span>
          <h3 className="text-3xl font-black text-white mt-1 font-mono">
            {stats?.visitors?.todayVisitors || 0}
          </h3>
          <p className="text-[11px] text-emerald-400 font-semibold mt-1">{stats?.visitors?.currentlyInsideVisitors || 0} currently inside</p>
        </div>

        <div className="bg-slate-900/80 p-5 rounded-3xl border border-slate-800/90 shadow-xl">
          <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Today's Collections</span>
          <h3 className="text-3xl font-black text-white mt-1 font-mono">
            ₹{Number(stats?.financial?.todayRevenue || 0).toLocaleString()}
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">Rent & advance payments</p>
        </div>
      </div>
    </div>
  );
};

export default ReceptionistDashboard;
