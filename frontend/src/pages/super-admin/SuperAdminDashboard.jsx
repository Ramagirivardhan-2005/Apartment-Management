import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import {
  Building2,
  DoorClosed,
  Users,
  Car,
  CreditCard,
  AlertCircle,
  TrendingUp,
  ShieldCheck,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Link } from 'react-router-dom';

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [overviewRes, revRes] = await Promise.allSettled([
          api.get('/reports/system-overview'),
          api.get('/payments/revenue'),
        ]);

        if (overviewRes.status === 'fulfilled' && overviewRes.value?.data?.success) {
          setStats(overviewRes.value.data.data);
        }
        if (revRes.status === 'fulfilled' && revRes.value?.data?.success) {
          setRevenueData(revRes.value.data);
        }
      } catch (err) {
        console.error('Error fetching super admin stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const roomDistributionData = [
    { name: 'Occupied', value: stats?.rooms?.occupiedRooms || 0, color: '#3b82f6' },
    { name: 'Available', value: stats?.rooms?.availableRooms || 0, color: '#10b981' },
    { name: 'Maintenance', value: stats?.rooms?.maintenanceRooms || 0, color: '#f59e0b' },
    { name: 'Reserved', value: stats?.rooms?.reservedRooms || 0, color: '#8b5cf6' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-brand-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Sparkles size={15} /> System-Wide Central Control
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Super Admin Dashboard</h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
            Live overview across all apartment blocks, rooms occupancy, financial revenue streams, dues, and security operations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/super-admin/blocks"
            className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl transition shadow-sm"
          >
            Manage Blocks
          </Link>
          <Link
            to="/super-admin/block-admins"
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition border border-slate-700"
          >
            Block Admins
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Blocks KPI */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Blocks</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Building2 size={18} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-slate-900">{stats?.blocks?.totalBlocks || 0}</h3>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
              <span className="text-emerald-600 font-semibold">{stats?.blocks?.activeBlocks || 0} Active</span>
              <span>•</span>
              <span>{stats?.blocks?.inactiveBlocks || 0} Inactive</span>
            </div>
          </div>
        </div>

        {/* Rooms KPI */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rooms Inventory</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <DoorClosed size={18} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-slate-900">{stats?.rooms?.totalRooms || 0}</h3>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
              <span className="text-emerald-600 font-semibold">{stats?.rooms?.availableRooms || 0} Available</span>
              <span>•</span>
              <span className="text-blue-600 font-semibold">{stats?.rooms?.occupiedRooms || 0} Occupied</span>
            </div>
          </div>
        </div>

        {/* Residents KPI */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Residents</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users size={18} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-slate-900">{stats?.residents?.totalResidents || 0}</h3>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
              <span className="text-emerald-600 font-semibold">{stats?.residents?.activeResidents || 0} Active</span>
              <span>•</span>
              <span className="text-purple-600 font-semibold">+{stats?.residents?.newResidentsThisMonth || 0} this month</span>
            </div>
          </div>
        </div>

        {/* Parking Slots KPI */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Parking Slots</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Car size={18} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-slate-900">{stats?.parking?.totalParking || 0}</h3>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
              <span className="text-emerald-600 font-semibold">{stats?.parking?.availableParking || 0} Available</span>
              <span>•</span>
              <span className="text-blue-600 font-semibold">{stats?.parking?.allocatedParking || 0} Allocated</span>
            </div>
          </div>
        </div>
      </div>

      {/* Financial KPIs Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Today's Revenue</span>
          <h4 className="text-xl font-extrabold text-slate-900 mt-2">
            ₹{Number(stats?.financial?.todayRevenue || 0).toLocaleString()}
          </h4>
          <span className="text-[11px] text-emerald-600 font-medium">Real-time collections</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">This Month's Revenue</span>
          <h4 className="text-xl font-extrabold text-brand-600 mt-2">
            ₹{Number(stats?.financial?.monthRevenue || 0).toLocaleString()}
          </h4>
          <span className="text-[11px] text-slate-500 font-medium">Monthly collection target</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Total Revenue (All Time)</span>
          <h4 className="text-xl font-extrabold text-emerald-600 mt-2">
            ₹{Number(stats?.financial?.totalRevenue || 0).toLocaleString()}
          </h4>
          <span className="text-[11px] text-slate-500 font-medium">Includes rent, advance & late fees</span>
        </div>

        <div className="bg-rose-50/50 p-5 rounded-2xl border border-rose-200 shadow-xs">
          <span className="text-xs font-bold text-rose-700 uppercase">Total Outstanding Dues</span>
          <h4 className="text-xl font-extrabold text-rose-700 mt-2">
            ₹{Number(stats?.financial?.totalOutstanding || 0).toLocaleString()}
          </h4>
          <span className="text-[11px] text-rose-600 font-semibold">
            {stats?.financial?.overdueCount || 0} overdue units ({stats?.financial?.criticalOverdueCount || 0} critical)
          </span>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Trend */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Revenue Breakdown (Current Year)</h3>
              <p className="text-xs text-slate-500">Monthly Room Rent vs Parking vs Late Fees</p>
            </div>
            <Link to="/super-admin/reports" className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1">
              Full Report <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData?.monthlyBreakdown || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value) => [`₹${Number(value).toLocaleString()}`, '']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px', border: 'none' }}
                />
                <Bar dataKey="roomRevenue" name="Room Rent" fill="#3b82f6" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="parkingRevenue" name="Parking" fill="#10b981" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="lateFees" name="Late Fees" fill="#f59e0b" stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Room Occupancy Pie Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Room Status Distribution</h3>
            <p className="text-xs text-slate-500">Real-time status breakdown</p>
          </div>

          <div className="h-52 my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roomDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {roomDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value} Rooms`, '']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-100">
            {roomDistributionData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                <span className="text-slate-600">{item.name}: <strong className="text-slate-900">{item.value}</strong></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Visitors & Complaints Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase">Today's Visitors</span>
            <div className="flex items-baseline gap-2 mt-1">
              <h4 className="text-2xl font-extrabold text-slate-900">{stats?.visitors?.todayVisitors || 0}</h4>
              <span className="text-xs text-emerald-600 font-bold">({stats?.visitors?.currentlyInsideVisitors || 0} inside)</span>
            </div>
            <p className="text-[11px] text-slate-500">{stats?.visitors?.checkedOutVisitors || 0} checked out today</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Users size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase">Active Complaints</span>
            <div className="flex items-baseline gap-2 mt-1">
              <h4 className="text-2xl font-extrabold text-slate-900">{stats?.complaints?.inProgressComplaints || 0}</h4>
              <span className="text-xs text-amber-600 font-bold">({stats?.complaints?.newComplaints || 0} new)</span>
            </div>
            <p className="text-[11px] text-slate-500">{stats?.complaints?.resolvedComplaints || 0} resolved this month</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertCircle size={20} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
