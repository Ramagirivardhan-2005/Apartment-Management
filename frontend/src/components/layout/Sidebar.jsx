import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Building2,
  Users,
  DoorClosed,
  Car,
  CreditCard,
  AlertCircle,
  Megaphone,
  BarChart3,
  ShieldAlert,
  UserPlus,
  CalendarDays,
  Clock,
  History,
  FileCheck2,
  Lock,
  UserCheck,
  Search,
  Sparkles,
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const role = user?.role;

  const getNavLinks = () => {
    switch (role) {
      case 'super_admin':
        return [
          { to: '/super-admin/dashboard', label: 'Super Dashboard', icon: LayoutDashboard },
          { to: '/super-admin/blocks', label: 'Block Towers', icon: Building2 },
          { to: '/super-admin/block-admins', label: 'Block Admins', icon: UserCheck },
          { to: '/super-admin/rooms', label: 'All Rooms', icon: DoorClosed },
          { to: '/super-admin/parking', label: 'Global Parking', icon: Car },
          { to: '/super-admin/residents', label: 'All Residents', icon: Users },
          { to: '/super-admin/reports', label: 'Financial Reports', icon: BarChart3 },
          { to: '/super-admin/audit-logs', label: 'Audit Trail', icon: FileCheck2 },
        ];

      case 'block_admin':
        return [
          { to: '/block-admin/dashboard', label: 'Block Dashboard', icon: LayoutDashboard },
          { to: '/block-admin/rooms', label: 'Room Inventory', icon: DoorClosed },
          { to: '/block-admin/parking', label: 'Parking Slots', icon: Car },
          { to: '/block-admin/receptionists', label: 'Receptionists (1-2)', icon: UserCheck },
          { to: '/block-admin/residents', label: 'Block Residents', icon: Users },
          { to: '/block-admin/overdue', label: 'Overdue Dues', icon: AlertCircle },
          { to: '/block-admin/revenue', label: 'Revenue & Accounts', icon: CreditCard },
          { to: '/block-admin/complaints', label: 'Support Tickets', icon: ShieldAlert },
          { to: '/block-admin/announcements', label: 'Broadcast Notices', icon: Megaphone },
        ];

      case 'receptionist':
        return [
          { to: '/receptionist/dashboard', label: 'Desk Overview', icon: LayoutDashboard },
          { to: '/receptionist/users', label: 'Search / Register User', icon: UserPlus },
          { to: '/receptionist/book-room', label: 'Book Room (Wizard)', icon: CalendarDays },
          { to: '/receptionist/rooms', label: 'Room Availability', icon: DoorClosed },
          { to: '/receptionist/parking', label: 'Allocate Parking', icon: Car },
          { to: '/receptionist/payments', label: 'Payments & Receipts', icon: CreditCard },
          { to: '/receptionist/visitors', label: 'Visitor Passes', icon: Users },
        ];

      case 'security':
        return [
          { to: '/security/dashboard', label: 'Security Desk', icon: LayoutDashboard },
          { to: '/security/visitor-check-in', label: 'Visitor Check-In', icon: UserPlus },
          { to: '/security/visitor-check-out', label: 'Visitor Check-Out', icon: Clock },
          { to: '/security/movements', label: 'Resident Movements', icon: Users },
          { to: '/security/logs', label: 'Gate Access Logs', icon: FileCheck2 },
          { to: '/security/lookup', label: 'Resident Lookup', icon: Search },
        ];

      case 'resident':
      default:
        return [
          { to: '/resident/dashboard', label: 'My Dashboard', icon: LayoutDashboard },
          { to: '/resident/room', label: 'My Room Stay', icon: DoorClosed },
          { to: '/resident/book-room', label: 'Book Room / Queue', icon: CalendarDays },
          { to: '/resident/payments', label: 'Payments & Invoices', icon: CreditCard },
          { to: '/resident/parking', label: 'My Parking Slot', icon: Car },
          { to: '/resident/complaints', label: 'Raise Complaint', icon: AlertCircle },
          { to: '/resident/announcements', label: 'Notices & Board', icon: Megaphone },
          { to: '/resident/history', label: 'Booking History', icon: History },
          { to: '/resident/profile', label: 'Account Profile', icon: Lock },
        ];
    }
  };

  const navLinks = getNavLinks();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-64 bg-slate-900/95 backdrop-blur-xl text-slate-300 flex flex-col transition-transform duration-300 ease-in-out border-r border-slate-800/80 shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center gap-3 bg-slate-950/40">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center font-bold shadow-md shadow-brand-500/20 border border-white/10">
            <Building2 size={18} />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-white tracking-wide flex items-center gap-1.5">
              <span>Vijaya Laxmi</span>
            </h2>
            <p className="text-[10px] font-bold text-brand-400 uppercase tracking-wider">
              {role?.replace('_', ' ')}
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
          <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
            Navigation Menu
          </div>
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 group ${
                    isActive
                      ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-lg shadow-brand-600/30 border border-brand-400/30'
                      : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200 border border-transparent'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={17} className={`transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-brand-400'}`} />
                    <span className="truncate">{item.label}</span>
                    {isActive && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-xs"></span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/60 flex items-center justify-between text-[11px] text-slate-500">
          <span className="font-medium">Vijaya Laxmi Residency</span>
          <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 font-bold">
            v2.4
          </span>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
