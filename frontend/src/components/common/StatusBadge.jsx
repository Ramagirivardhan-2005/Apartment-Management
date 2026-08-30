import React from 'react';

const StatusBadge = ({ status, tier, label }) => {
  const normStatus = (status || tier || '').toLowerCase();
  const text = label || status || tier || 'Unknown';

  // Overdue / Payment Dues Color System
  if (normStatus === 'overdue_1_10' || normStatus === '1-10 days overdue') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-orange-950/80 text-orange-300 border border-orange-700/70 shadow-xs shadow-orange-950/50">
        <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
        1-10 Days Overdue (Orange)
      </span>
    );
  }

  if (normStatus === 'overdue_10_plus' || normStatus === '>10 days overdue') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-red-950/90 text-red-200 border border-red-700/80 shadow-md shadow-red-950/60 animate-soft-pulse">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
        &gt;10 Days Overdue (Red)
      </span>
    );
  }

  if (normStatus === 'critical' || normStatus === 'critical overdue') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-rose-950 text-rose-100 border border-rose-600 shadow-lg shadow-rose-950/80">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping"></span>
        CRITICAL OVERDUE (Dark Red)
      </span>
    );
  }

  if (normStatus === 'due_today') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-950/80 text-amber-300 border border-amber-700/70">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
        Due Today
      </span>
    );
  }

  if (normStatus === 'due_soon') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-blue-950/80 text-blue-300 border border-blue-800/60">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
        Due Soon
      </span>
    );
  }

  if (normStatus === 'paid' || normStatus === 'active' || normStatus === 'available') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-950/80 text-emerald-300 border border-emerald-800/70 shadow-xs shadow-emerald-950/40">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
        {text.toUpperCase()}
      </span>
    );
  }

  if (normStatus === 'occupied') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-800/60">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
        OCCUPIED
      </span>
    );
  }

  if (normStatus === 'maintenance') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800/60">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
        MAINTENANCE
      </span>
    );
  }

  if (normStatus === 'reserved') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-purple-950/80 text-purple-300 border border-purple-800/60">
        <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
        RESERVED
      </span>
    );
  }

  // Complaint Status
  if (normStatus === 'new') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-indigo-950/80 text-indigo-300 border border-indigo-700/70">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
        NEW
      </span>
    );
  }

  if (normStatus === 'in_progress') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-950/80 text-amber-300 border border-amber-700/70">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
        IN PROGRESS
      </span>
    );
  }

  if (normStatus === 'resolved') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-950/80 text-emerald-300 border border-emerald-700/70 shadow-xs">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
        RESOLVED
      </span>
    );
  }

  if (normStatus === 'closed') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-slate-900 text-slate-400 border border-slate-800">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
        CLOSED
      </span>
    );
  }

  // Visitor Status
  if (normStatus === 'inside') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-950/90 text-emerald-300 border border-emerald-700 shadow-md shadow-emerald-950/50">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
        INSIDE
      </span>
    );
  }

  if (normStatus === 'checked_out') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-slate-900 text-slate-400 border border-slate-800">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
        CHECKED OUT
      </span>
    );
  }

  // General Status
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-slate-850 text-slate-300 border border-slate-700/70 capitalize">
      {text}
    </span>
  );
};

export default StatusBadge;
