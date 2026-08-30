import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { CreditCard, TrendingUp, Download, Calendar } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const BlockRevenue = () => {
  const { user } = useAuth();
  const [revenue, setRevenue] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRevenue = async () => {
      const blockId = user?.assignedBlock?._id || user?.assignedBlock;
      try {
        const [revRes, payRes] = await Promise.all([
          api.get('/payments/revenue', { params: { blockId } }),
          api.get('/payments', { params: { blockId } }),
        ]);

        if (revRes.data?.success) setRevenue(revRes.data);
        if (payRes.data?.success) setPayments(payRes.data.data);
      } catch (err) {
        console.error('Error fetching block revenue:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRevenue();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Block Revenue & Collections</h2>
        <p className="text-xs sm:text-sm text-slate-500">Rental revenue, parking charges, and late fee collections</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Room Rental Income</span>
          <h3 className="text-2xl font-extrabold text-brand-600 mt-1">
            ₹{Number(revenue?.summary?.roomRevenue || 0).toLocaleString()}
          </h3>
          <p className="text-[11px] text-slate-400">Advance and monthly rent</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Parking Subscriptions</span>
          <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">
            ₹{Number(revenue?.summary?.parkingRevenue || 0).toLocaleString()}
          </h3>
          <p className="text-[11px] text-slate-400">Allocated parking slots</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Total Block Collections</span>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
            ₹{Number(revenue?.summary?.totalRevenue || 0).toLocaleString()}
          </h3>
          <p className="text-[11px] text-slate-400">All payment categories</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 mb-1">Monthly Trend</h3>
        <p className="text-xs text-slate-500 mb-4">Breakdown for the current year</p>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenue?.monthlyBreakdown || []}>
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

      {/* Recent Transactions */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">Recent Block Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-4">Receipt</th>
                <th className="px-6 py-4">Resident</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((p) => (
                <tr key={p._id} className="hover:bg-slate-50/60 transition">
                  <td className="px-6 py-4 font-mono font-bold text-slate-900">{p.receiptNumber}</td>
                  <td className="px-6 py-4 font-medium text-slate-800">{p.user?.fullName}</td>
                  <td className="px-6 py-4 uppercase font-semibold text-slate-700">{p.paymentType}</td>
                  <td className="px-6 py-4 font-bold text-brand-600">₹{Number(p.amount || p.totalAmount || 0).toLocaleString()}</td>
                  <td className="px-6 py-4 text-slate-500">{new Date(p.paymentDate || p.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 uppercase">
                      {p.status}
                    </span>
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

export default BlockRevenue;
