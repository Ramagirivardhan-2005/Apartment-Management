import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  DoorClosed,
  Users,
  Car,
  CreditCard,
  AlertCircle,
  Building2,
  TrendingUp,
  Sparkles,
  ArrowUpRight,
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
} from 'recharts';
import { Link } from 'react-router-dom';

const BlockAdminDashboard = () => {
  const { user } = useAuth();
  const [blockData, setBlockData] = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.assignedBlock) {
        setLoading(false);
        return;
      }

      const blockId = user.assignedBlock._id || user.assignedBlock;
      try {
        const [bRes, revRes] = await Promise.allSettled([
          api.get(`/blocks/${blockId}`),
          api.get(`/payments/revenue?blockId=${blockId}`),
        ]);

        if (bRes.status === 'fulfilled' && bRes.value?.data?.success) {
          setBlockData(bRes.value.data.data);
        }
        if (revRes.status === 'fulfilled' && revRes.value?.data?.success) {
          setRevenueData(revRes.value.data);
        }
      } catch (err) {
        console.error('Error fetching block admin dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const roomChartData = [
    { name: 'Occupied', value: blockData?.stats?.occupiedRooms || 0, color: '#3b82f6' },
    { name: 'Available', value: blockData?.stats?.availableRooms || 0, color: '#10b981' },
    { name: 'Maintenance', value: blockData?.stats?.maintenanceRooms || 0, color: '#f59e0b' },
    { name: 'Reserved', value: blockData?.stats?.reservedRooms || 0, color: '#8b5cf6' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-brand-300 font-bold text-xs uppercase tracking-wider mb-1">
            <Building2 size={15} /> Assigned Block Manager
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            {blockData?.name || 'Block Dashboard'} ({blockData?.code || 'N/A'})
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
            {blockData?.address || 'Apartment block operations, room allocations, dues, and complaints'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/block-admin/rooms"
            className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl transition shadow-sm"
          >
            Manage Rooms
          </Link>
          <Link
            to="/block-admin/overdue"
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition shadow-sm"
          >
            Overdue Dues
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Rooms */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Rooms</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <DoorClosed size={18} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-slate-900">{blockData?.stats?.totalRooms || 0}</h3>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
              <span className="text-emerald-600 font-semibold">{blockData?.stats?.availableRooms || 0} Avail</span>
              <span>•</span>
              <span className="text-blue-600 font-semibold">{blockData?.stats?.occupiedRooms || 0} Occupied</span>
            </div>
          </div>
        </div>

        {/* Total Parking */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Parking Slots</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Car size={18} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-slate-900">{blockData?.stats?.totalParking || 0}</h3>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
              <span className="text-emerald-600 font-semibold">{blockData?.stats?.availableParking || 0} Avail</span>
              <span>•</span>
              <span className="text-blue-600 font-semibold">{blockData?.stats?.allocatedParking || 0} Allocated</span>
            </div>
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Block Revenue</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CreditCard size={18} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-emerald-600">
              ₹{Number(revenueData?.summary?.totalRevenue || 0).toLocaleString()}
            </h3>
            <p className="text-xs text-slate-500 mt-1">₹{Number(revenueData?.summary?.monthRevenue || 0).toLocaleString()} this month</p>
          </div>
        </div>

        {/* Complaints */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Active Complaints</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle size={18} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-slate-900">{blockData?.stats?.activeComplaints || 0}</h3>
            <Link to="/block-admin/complaints" className="text-xs text-brand-600 font-semibold mt-1 inline-block hover:underline">
              Resolve complaints &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Block Revenue History</h3>
              <p className="text-xs text-slate-500">Rent collections vs Parking fees</p>
            </div>
            <Link to="/block-admin/revenue" className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1">
              Details <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData?.monthlyBreakdown || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} />
                <Tooltip
                  formatter={(value) => [`₹${Number(value).toLocaleString()}`, '']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="roomRevenue" name="Room Rent" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="parkingRevenue" name="Parking" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Room Status</h3>
            <p className="text-xs text-slate-500">Block distribution</p>
          </div>

          <div className="h-48 my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={roomChartData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value">
                  {roomChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-100">
            {roomChartData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                <span className="text-slate-600">{item.name}: <strong className="text-slate-900">{item.value}</strong></span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlockAdminDashboard;
