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
    { label: 'Register User', to: '/receptionist/users', icon: UserPlus, color: 'bg-blue-600', text: 'Register new resident' },
    { label: 'Book Room (Wizard)', to: '/receptionist/book-room', icon: CalendarDays, color: 'bg-emerald-600', text: '8-step booking wizard' },
    { label: 'Search User Profile', to: '/receptionist/users', icon: Search, color: 'bg-purple-600', text: 'Lookup by mobile/email' },
    { label: 'Visitor Pass', to: '/receptionist/visitors', icon: Users, color: 'bg-teal-600', text: 'Issue guest visitor pass' },
    { label: 'Allocate Parking', to: '/receptionist/parking', icon: Car, color: 'bg-amber-600', text: 'Assign vehicle slot' },
    { label: 'Collect Payment', to: '/receptionist/payments', icon: CreditCard, color: 'bg-rose-600', text: 'Process rent & receipts' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Sparkles size={15} /> Front-Desk Central Operations
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Receptionist Desk</h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
            Streamlined user registrations, multi-room bookings, proof verifications, and front-desk services.
          </p>
        </div>
        <Link
          to="/receptionist/book-room"
          className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold rounded-xl transition shadow-lg shadow-emerald-500/20 flex items-center gap-2 self-start md:self-auto"
        >
          <span>Start Room Booking</span>
          <ArrowRight size={16} />
        </Link>
      </div>

      {/* Quick Action Cards */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-3">Front-Desk Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                to={action.to}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition flex items-center gap-4 group"
              >
                <div className={`w-12 h-12 rounded-2xl ${action.color} text-white flex items-center justify-center shadow-md group-hover:scale-105 transition`}>
                  <Icon size={22} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm group-hover:text-brand-600 transition">{action.label}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{action.text}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Available Rooms</span>
          <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">
            {stats?.rooms?.availableRooms || 0}
          </h3>
          <p className="text-[11px] text-slate-400">Ready for immediate check-in</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Available Parking</span>
          <h3 className="text-2xl font-extrabold text-brand-600 mt-1">
            {stats?.parking?.availableParking || 0}
          </h3>
          <p className="text-[11px] text-slate-400">Open vehicle bays</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Today's Visitors</span>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
            {stats?.visitors?.todayVisitors || 0}
          </h3>
          <p className="text-[11px] text-emerald-600 font-semibold">{stats?.visitors?.currentlyInsideVisitors || 0} currently inside</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Today's Collections</span>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
            ₹{Number(stats?.financial?.todayRevenue || 0).toLocaleString()}
          </h3>
          <p className="text-[11px] text-slate-400">Rent & advance payments</p>
        </div>
      </div>
    </div>
  );
};

export default ReceptionistDashboard;
