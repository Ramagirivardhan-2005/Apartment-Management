import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  Bell,
  LogOut,
  User,
  Building2,
  Menu,
  Check,
  ExternalLink,
  ChevronDown,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifs(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRoleBadge = (role) => {
    switch (role) {
      case 'super_admin':
        return (
          <span className="inline-flex items-center gap-1.5 bg-purple-950/80 text-purple-300 border border-purple-800/60 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider shadow-sm shadow-purple-950/40">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></span>
            Super Admin
          </span>
        );
      case 'block_admin':
        return (
          <span className="inline-flex items-center gap-1.5 bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider shadow-sm shadow-indigo-950/40">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
            Block Admin
          </span>
        );
      case 'receptionist':
        return (
          <span className="inline-flex items-center gap-1.5 bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider shadow-sm shadow-emerald-950/40">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Reception Desk
          </span>
        );
      case 'security':
        return (
          <span className="inline-flex items-center gap-1.5 bg-slate-800/80 text-slate-300 border border-slate-700/60 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            Gate Security
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 bg-teal-950/80 text-teal-300 border border-teal-800/60 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
            Resident
          </span>
        );
    }
  };

  return (
    <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-30 shadow-glass">
      <div className="flex items-center justify-between px-4 lg:px-8 h-16">
        {/* Left: Mobile Toggle & Brand Title */}
        <div className="flex items-center gap-3.5">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-brand-500/20 font-bold border border-white/10">
              <Building2 size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight">Vijaya Laxmi Complex</h1>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-400 border border-brand-500/30 hidden sm:inline-block">
                  RESIDENCY
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Residential Community &amp; Enclave</p>
            </div>
          </div>
        </div>

        {/* Right: Role Badge, Notifications, User Menu */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden md:block">
            {getRoleBadge(user?.role)}
          </div>

          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="p-2.5 rounded-2xl text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800 transition relative cursor-pointer"
              aria-label="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full text-[10px] font-extrabold flex items-center justify-center animate-soft-pulse shadow-sm shadow-rose-500/50">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifs && (
              <div className="absolute right-0 mt-2.5 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell size={16} className="text-brand-400" />
                    <span className="font-bold text-xs text-white uppercase tracking-wider">System Alerts</span>
                    {unreadCount > 0 && (
                      <span className="bg-brand-600 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
                        {unreadCount} unread
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-slate-400 hover:text-brand-400 flex items-center gap-1 transition cursor-pointer"
                    >
                      <Check size={13} /> Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs">
                      No notifications at this time
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n._id}
                        onClick={() => markAsRead(n._id)}
                        className={`p-4 hover:bg-slate-800/60 transition cursor-pointer ${
                          !n.isRead ? 'bg-indigo-950/25 border-l-2 border-brand-500' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-bold text-slate-200">{n.title}</h4>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{n.message}</p>
                        {n.link && (
                          <Link
                            to={n.link}
                            onClick={() => setShowNotifs(false)}
                            className="inline-flex items-center gap-1 text-[11px] text-brand-400 font-semibold mt-2 hover:underline"
                          >
                            View details <ExternalLink size={10} />
                          </Link>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Avatar & Dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2.5 p-1.5 pr-3 rounded-2xl bg-slate-850 hover:bg-slate-800 border border-slate-800 transition cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center font-extrabold text-xs shadow-md shadow-brand-600/30">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-slate-200 leading-tight">{user?.fullName}</p>
                <p className="text-[10px] text-slate-400 capitalize">{user?.role?.replace('_', ' ')}</p>
              </div>
              <ChevronDown size={13} className="text-slate-400 hidden sm:block" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2.5 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150 divide-y divide-slate-800">
                <div className="px-4 py-2.5">
                  <p className="text-xs font-bold text-white">{user?.fullName}</p>
                  <p className="text-[11px] font-mono text-slate-400 truncate">{user?.email}</p>
                  {user?.registrationId && (
                    <span className="text-[10px] font-mono text-brand-400 mt-1 block">ID: {user.registrationId}</span>
                  )}
                </div>
                <div className="py-1">
                  <Link
                    to={user?.role === 'resident' ? '/resident/profile' : '#'}
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition"
                  >
                    <User size={14} className="text-slate-400" /> Account Profile
                  </Link>
                </div>
                <div className="pt-1">
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-rose-400 hover:bg-rose-950/40 text-left font-bold transition cursor-pointer"
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
