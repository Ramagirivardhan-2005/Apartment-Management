import React from 'react';

const StatusBadge = ({ status, tier, label }) => {
  const normStatus = (status || tier || '').toLowerCase();
  const text = label || status || tier || 'Unknown';

  // Overdue / Payment Dues Color System
  if (normStatus === 'overdue_1_10' || normStatus === '1-10 days overdue') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-300">
        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mr-1.5"></span>
        1-10 Days Overdue (Orange)
      </span>
    );
  }

  if (normStatus === 'overdue_10_plus' || normStatus === '>10 days overdue') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300 animate-pulse">
        <span className="w-1.5 h-1.5 rounded-full bg-red-600 mr-1.5"></span>
        &gt;10 Days Overdue (Red)
      </span>
    );
  }

  if (normStatus === 'critical' || normStatus === 'critical overdue') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-rose-950 text-rose-100 border border-rose-800 shadow-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mr-1.5 animate-ping"></span>
        CRITICAL OVERDUE (Dark Red)
      </span>
    );
  }

  if (normStatus === 'due_today') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
        Due Today
      </span>
    );
  }

  if (normStatus === 'due_soon') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
        Due Soon
      </span>
    );
  }

  // Room Status
  if (normStatus === 'available') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
        AVAILABLE
      </span>
    );
  }

  if (normStatus === 'occupied') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5"></span>
        OCCUPIED
      </span>
    );
  }

  if (normStatus === 'maintenance') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>
        MAINTENANCE
      </span>
    );
  }

  if (normStatus === 'reserved') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
        RESERVED
      </span>
    );
  }

  // Complaint Status
  if (normStatus === 'new') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
        NEW
      </span>
    );
  }

  if (normStatus === 'in_progress') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300">
        IN PROGRESS
      </span>
    );
  }

  if (normStatus === 'resolved') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        RESOLVED
      </span>
    );
  }

  if (normStatus === 'closed') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
        CLOSED
      </span>
    );
  }

  // Visitor Status
  if (normStatus === 'inside') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1.5 animate-pulse"></span>
        INSIDE
      </span>
    );
  }

  if (normStatus === 'checked_out') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
        CHECKED OUT
      </span>
    );
  }

  // General Status
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 capitalize">
      {text}
    </span>
  );
};

export default StatusBadge;
