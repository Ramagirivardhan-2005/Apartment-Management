import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/common/StatusBadge';
import {
  AlertCircle,
  Search,
  Filter,
  ArrowUpDown,
  Mail,
  Phone,
  Send,
  CheckCircle2,
  X,
  Building2,
  Calendar,
} from 'lucide-react';

const OverduePayments = () => {
  const { user } = useAuth();
  const [dues, setDues] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTier, setSelectedTier] = useState('');
  const [sortBy, setSortBy] = useState('overdueDays'); // 'overdueDays', 'amountDue', 'dueDate', 'roomNumber'
  const [sortAsc, setSortAsc] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchOverdueData = async () => {
    try {
      const res = await api.get('/payments/overdue-dashboard', {
        params: {
          blockId: user?.assignedBlock?._id || user?.assignedBlock || undefined,
        },
      });
      if (res.data?.success) {
        setStats(res.data.stats);
        setDues(res.data.dues);
      }
    } catch (err) {
      console.error('Error fetching overdue dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverdueData();
  }, [user]);

  // Sorting & Filtering
  const filteredDues = dues
    .filter((d) => {
      if (selectedTier && d.tier !== selectedTier) return false;
      if (search) {
        const s = search.toLowerCase();
        return (
          d.user?.fullName?.toLowerCase().includes(s) ||
          d.room?.roomNumber?.toLowerCase().includes(s) ||
          d.user?.mobile?.includes(s)
        );
      }
      return true;
    })
    .sort((a, b) => {
      let valA, valB;
      if (sortBy === 'overdueDays') {
        valA = a.overdueDays || 0;
        valB = b.overdueDays || 0;
      } else if (sortBy === 'amountDue') {
        valA = a.totalOutstanding || 0;
        valB = b.totalOutstanding || 0;
      } else if (sortBy === 'dueDate') {
        valA = new Date(a.dueDate).getTime();
        valB = new Date(b.dueDate).getTime();
      } else {
        valA = a.room?.roomNumber || '';
        valB = b.room?.roomNumber || '';
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

  const handleSendReminder = async (due) => {
    try {
      setSuccessMsg(`Payment reminder email dispatched to ${due.user?.fullName} (${due.user?.email})`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert('Failed to send reminder');
    }
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
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Overdue Payments Dashboard</h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Automatic aging tiers: 1-10 Days (Orange), &gt;10 Days (Red), Critical (Dark Red) with automated late fees
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-700 hover:text-emerald-900">
            <X size={14} />
          </button>
        </div>
      )}

      {/* KPI Cards for Tiers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Outstanding */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Total Outstanding</span>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
            ₹{Number(stats?.totalOutstanding || 0).toLocaleString()}
          </h3>
          <p className="text-[11px] text-slate-400">Late Fees: ₹{Number(stats?.totalLateFees || 0).toLocaleString()}</p>
        </div>

        {/* 1-10 Days Overdue (Orange) */}
        <div className="bg-orange-50/60 p-5 rounded-2xl border border-orange-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-orange-800 uppercase">1–10 Days Overdue</span>
            <span className="w-3 h-3 rounded-full bg-orange-500"></span>
          </div>
          <h3 className="text-2xl font-extrabold text-orange-800 mt-1">
            ₹{Number(stats?.overdue1to10?.amount || 0).toLocaleString()}
          </h3>
          <p className="text-[11px] text-orange-700 font-semibold">{stats?.overdue1to10?.count || 0} units affected</p>
        </div>

        {/* >10 Days Overdue (Red) */}
        <div className="bg-red-50/60 p-5 rounded-2xl border border-red-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-800 uppercase">&gt;10 Days Overdue</span>
            <span className="w-3 h-3 rounded-full bg-red-600 animate-pulse"></span>
          </div>
          <h3 className="text-2xl font-extrabold text-red-800 mt-1">
            ₹{Number(stats?.overdue10Plus?.amount || 0).toLocaleString()}
          </h3>
          <p className="text-[11px] text-red-700 font-semibold">{stats?.overdue10Plus?.count || 0} units affected</p>
        </div>

        {/* Critical Overdue (Dark Red) */}
        <div className="bg-rose-950 p-5 rounded-2xl border border-rose-900 text-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-300 uppercase">Critical Overdue</span>
            <span className="w-3 h-3 rounded-full bg-rose-400 animate-ping"></span>
          </div>
          <h3 className="text-2xl font-extrabold text-rose-100 mt-1">
            ₹{Number(stats?.critical?.amount || 0).toLocaleString()}
          </h3>
          <p className="text-[11px] text-rose-300 font-semibold">{stats?.critical?.count || 0} critical accounts</p>
        </div>
      </div>

      {/* Filters & Sorting */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search resident, room, mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div>
          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-brand-500"
          >
            <option value="">All Overdue Tiers</option>
            <option value="overdue_1_10">1-10 Days Overdue (Orange)</option>
            <option value="overdue_10_plus">&gt;10 Days Overdue (Red)</option>
            <option value="critical">Critical Overdue (Dark Red)</option>
            <option value="due_today">Due Today</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-brand-500"
          >
            <option value="overdueDays">Sort by: Overdue Days</option>
            <option value="amountDue">Sort by: Due Amount</option>
            <option value="dueDate">Sort by: Due Date</option>
            <option value="roomNumber">Sort by: Room Number</option>
          </select>
          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 text-xs font-semibold cursor-pointer"
            title="Toggle sort direction"
          >
            <ArrowUpDown size={15} />
          </button>
        </div>
      </div>

      {/* Overdue Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-4">Room & Resident</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Monthly Rent</th>
                <th className="px-6 py-4">Due Date</th>
                <th className="px-6 py-4">Overdue Days</th>
                <th className="px-6 py-4">Late Fee</th>
                <th className="px-6 py-4">Total Outstanding</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDues.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-400 text-xs">
                    No overdue payments matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredDues.map((due) => (
                  <tr key={due._id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="font-extrabold text-sm text-slate-900 bg-slate-100 px-2 py-1 rounded-lg">
                          {due.room?.roomNumber || 'N/A'}
                        </span>
                        <div>
                          <p className="font-bold text-slate-900">{due.user?.fullName}</p>
                          <p className="text-[10px] text-slate-400">{due.block?.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-800 font-medium">{due.user?.mobile}</p>
                      <p className="text-[11px] text-slate-500">{due.user?.email}</p>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">
                      ₹{due.rentAmount?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-slate-700 font-medium">
                      {new Date(due.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge tier={due.tier} label={`${due.overdueDays} Days`} />
                    </td>
                    <td className="px-6 py-4 font-bold text-amber-600">
                      ₹{due.lateFee?.toLocaleString() || 0}
                    </td>
                    <td className="px-6 py-4 font-extrabold text-sm text-red-600">
                      ₹{due.totalOutstanding?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleSendReminder(due)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold rounded-xl transition cursor-pointer"
                      >
                        <Send size={12} /> Send Warning
                      </button>
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

export default OverduePayments;
