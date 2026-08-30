import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import { DoorClosed, Search, CalendarDays } from 'lucide-react';
import { Link } from 'react-router-dom';

const ReceptionRooms = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('available');

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await api.get('/rooms', {
          params: { status: status || undefined, search: search || undefined },
        });
        if (res.data?.success) setRooms(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, [status, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Room Inventory</h2>
          <p className="text-xs sm:text-sm text-slate-500">Live availability and allocation status</p>
        </div>
        <Link
          to="/receptionist/book-room"
          className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl transition self-start sm:self-auto"
        >
          + Book Room
        </Link>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search room number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-brand-500"
          />
        </div>
        <div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-brand-500"
          >
            <option value="">All Statuses</option>
            <option value="available">Available Only</option>
            <option value="occupied">Occupied Only</option>
            <option value="maintenance">Under Maintenance</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {rooms.map((r) => (
            <div key={r._id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-extrabold text-base text-slate-900">Room {r.roomNumber}</span>
                  <StatusBadge status={r.status} />
                </div>
                <div className="space-y-1 text-xs text-slate-600">
                  <p>{r.block?.name} • Floor {r.floor}</p>
                  <p>{r.roomType} • {r.ac ? 'AC' : 'Non-AC'}</p>
                  <p className="font-bold text-brand-600 pt-1">₹{r.monthlyRent.toLocaleString()} / month</p>
                </div>
              </div>
              {r.currentResident && (
                <div className="mt-3 pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-400">Resident:</span>
                  <p className="font-bold text-slate-900 truncate">{r.currentResident.fullName}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReceptionRooms;
