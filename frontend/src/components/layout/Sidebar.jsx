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
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const role = user?.role;

  const getNavLinks = () => {
    switch (role) {
      case 'super_admin':
        return [
          { to: '/super-admin/dashboard', label: 'Super Dashboard', icon: LayoutDashboard },
          { to: '/super-admin/blocks', label: 'Block Management', icon: Building2 },
          { to: '/super-admin/block-admins', label: 'Block Admins', icon: UserCheck },
          { to: '/super-admin/rooms', label: 'All Rooms', icon: DoorClosed },
          { to: '/super-admin/parking', label: 'Parking Slots', icon: Car },
          { to: '/super-admin/residents', label: 'All Residents', icon: Users },
          { to: '/super-admin/reports', label: 'System Reports', icon: BarChart3 },
          { to: '/super-admin/audit-logs', label: 'Audit Trail', icon: FileCheck2 },
        ];

      case 'block_admin':
        return [
          { to: '/block-admin/dashboard', label: 'Block Dashboard', icon: LayoutDashboard },
          { to: '/block-admin/rooms', label: 'Room Management', icon: DoorClosed },
          { to: '/block-admin/parking', label: 'Parking Slots', icon: Car },
          { to: '/block-admin/receptionists', label: 'Receptionists (1-2)', icon: UserCheck },
          { to: '/block-admin/residents', label: 'Residents & Users', icon: Users },
          { to: '/block-admin/overdue', label: 'Overdue Payments', icon: AlertCircle },
          { to: '/block-admin/revenue', label: 'Revenue & Payments', icon: CreditCard },
          { to: '/block-admin/complaints', label: 'Complaints', icon: ShieldAlert },
          { to: '/block-admin/announcements', label: 'Announcements', icon: Megaphone },
        ];

      case 'receptionist':
        return [
          { to: '/receptionist/dashboard', label: 'Reception Dashboard', icon: LayoutDashboard },
          { to: '/receptionist/users', label: 'Search & Register User', icon: UserPlus },
          { to: '/receptionist/book-room', label: 'Book Room (Wizard)', icon: CalendarDays },
          { to: '/receptionist/rooms', label: 'Room Inventory', icon: DoorClosed },
          { to: '/receptionist/parking', label: 'Allocate Parking', icon: Car },
          { to: '/receptionist/payments', label: 'Payments & Receipts', icon: CreditCard },
          { to: '/receptionist/visitors', label: 'Visitor Pass', icon: Users },
        ];

      case 'security':
        return [
          { to: '/security/dashboard', label: 'Security Dashboard', icon: LayoutDashboard },
          { to: '/security/visitor-check-in', label: 'Visitor Check-In', icon: UserPlus },
          { to: '/security/visitor-check-out', label: 'Visitor Check-Out', icon: Clock },
          { to: '/security/movements', label: 'Resident Movements', icon: Users },
          { to: '/security/logs', label: 'Security Access Logs', icon: FileCheck2 },
          { to: '/security/lookup', label: 'Resident Lookup', icon: Search },
        ];

      case 'resident':
      default:
        return [
          { to: '/resident/dashboard', label: 'My Dashboard', icon: LayoutDashboard },
          { to: '/resident/room', label: 'My Room Stay', icon: DoorClosed },
          { to: '/resident/book-room', label: 'Book Room / Queue', icon: CalendarDays },
          { to: '/resident/payments', label: 'Payments & Dues', icon: CreditCard },
          { to: '/resident/parking', label: 'My Parking', icon: Car },
          { to: '/resident/complaints', label: 'Raise Complaint', icon: AlertCircle },
          { to: '/resident/announcements', label: 'Announcements', icon: Megaphone },
          { to: '/resident/history', label: 'Room History', icon: History },
          { to: '/resident/profile', label: 'My Profile', icon: Lock },
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
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out border-r border-slate-800 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-500 text-white flex items-center justify-center font-bold">
            <Building2 size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">Skyline Complex</h2>
            <p className="text-[11px] text-brand-400 capitalize font-medium">
              {role?.replace('_', ' ')}
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <Icon size={17} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-800 text-[11px] text-slate-500 text-center">
          <span>Skyline Residence OS v2.0</span>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
