import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { BarChart3, Download, TrendingUp, CreditCard, Users, DoorClosed, Car } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const SystemReports = () => {
  const [revenue, setRevenue] = useState(null);
  const [overview, setOverview] = useState(null);
  const [overdueStats, setOverdueStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const [revRes, ovRes, overdueRes] = await Promise.all([
          api.get('/payments/revenue'),
          api.get('/reports/system-overview'),
          api.get('/payments/overdue-dashboard'),
        ]);

        if (revRes.data?.success) setRevenue(revRes.data);
        if (ovRes.data?.success) setOverview(ovRes.data.data);
        if (overdueRes.data?.success) setOverdueStats(overdueRes.data.stats);
      } catch (err) {
        console.error('Error fetching system reports:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const exportCSV = () => {
    if (!revenue?.monthlyBreakdown) return;
    const headers = 'Month,Room Revenue,Parking Revenue,Late Fees,Other Revenue,Total\n';
    const rows = revenue.monthlyBreakdown
      .map(
        (m) =>
          `${m.month},${m.roomRevenue},${m.parkingRevenue},${m.lateFees},${m.otherRevenue},${m.total}`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Revenue_Report_${new Date().getFullYear()}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">System Reports & Financial Analytics</h2>
          <p className="text-xs sm:text-sm text-slate-500">Comprehensive revenue, occupancy metrics, and overdue aging</p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <Download size={15} /> Export Revenue CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Room Rental Collections</span>
          <h3 className="text-xl font-extrabold text-brand-600 mt-1">
            ₹{Number(revenue?.summary?.roomRevenue || 0).toLocaleString()}
          </h3>
          <p className="text-[11px] text-slate-400">Advance & recurring rents</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Parking Revenue</span>
          <h3 className="text-xl font-extrabold text-emerald-600 mt-1">
            ₹{Number(revenue?.summary?.parkingRevenue || 0).toLocaleString()}
          </h3>
          <p className="text-[11px] text-slate-400">Monthly slot subscriptions</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Late Fees Collected</span>
          <h3 className="text-xl font-extrabold text-amber-600 mt-1">
            ₹{Number(revenue?.summary?.lateFees || 0).toLocaleString()}
          </h3>
          <p className="text-[11px] text-slate-400">Automated late charge engine</p>
        </div>

        <div className="bg-rose-50/50 p-5 rounded-2xl border border-rose-200 shadow-xs">
          <span className="text-xs font-bold text-rose-700 uppercase">Total Outstanding Dues</span>
          <h3 className="text-xl font-extrabold text-rose-700 mt-1">
            ₹{Number(overdueStats?.totalOutstanding || 0).toLocaleString()}
          </h3>
          <p className="text-[11px] text-rose-600 font-semibold">
            {overdueStats?.overdue10Plus?.count || 0} units &gt;10d overdue
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 mb-1">Monthly Financial Collections</h3>
        <p className="text-xs text-slate-500 mb-4">Complete breakdown across all payment streams</p>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenue?.monthlyBreakdown || []}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(value) => [`₹${Number(value).toLocaleString()}`, '']}
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
              />
              <Bar dataKey="roomRevenue" name="Room Rent" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="parkingRevenue" name="Parking" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="lateFees" name="Late Fees" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default SystemReports;
