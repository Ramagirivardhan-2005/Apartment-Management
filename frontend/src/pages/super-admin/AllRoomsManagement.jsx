import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import { DoorClosed, Search, Filter, Building2, User, Wrench, CheckCircle2 } from 'lucide-react';

const AllRoomsManagement = () => {
  const [rooms, setRooms] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBlock, setSelectedBlock] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'

  const fetchData = async () => {
    try {
      const [roomsRes, blocksRes] = await Promise.all([
        api.get('/rooms', {
          params: {
            blockId: selectedBlock || undefined,
            status: selectedStatus || undefined,
            roomType: selectedType || undefined,
            search: search || undefined,
          },
        }),
        api.get('/blocks'),
      ]);

      if (roomsRes.data?.success) setRooms(roomsRes.data.data);
      if (blocksRes.data?.success) setBlocks(blocksRes.data.data);
    } catch (err) {
      console.error('Error fetching rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedBlock, selectedStatus, selectedType, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">All Rooms Inventory</h2>
          <p className="text-xs sm:text-sm text-slate-500">System-wide room registry, occupancy, and maintenance status</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              viewMode === 'grid' ? 'bg-brand-600 text-white' : 'bg-white border border-slate-200 text-slate-700'
            }`}
          >
            Grid View
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              viewMode === 'table' ? 'bg-brand-600 text-white' : 'bg-white border border-slate-200 text-slate-700'
            }`}
          >
            Table View
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
            value={selectedBlock}
            onChange={(e) => setSelectedBlock(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-brand-500"
          >
            <option value="">All Blocks</option>
            {blocks.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-brand-500"
          >
            <option value="">All Statuses</option>
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
            <option value="maintenance">Maintenance</option>
            <option value="reserved">Reserved</option>
          </select>
        </div>

        <div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-brand-500"
          >
            <option value="">All Types</option>
            <option value="Single">Single</option>
            <option value="Double">Double</option>
            <option value="Triple">Triple</option>
            <option value="Four sharing">Four sharing</option>
            <option value="Deluxe">Deluxe</option>
            <option value="Suite">Suite</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {rooms.map((room) => (
            <div
              key={room._id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-extrabold text-base text-slate-900">{room.roomNumber}</span>
                  <StatusBadge status={room.status} />
                </div>

                <div className="space-y-1 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Block:</span>
                    <span className="font-medium text-slate-800">{room.block?.name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Floor:</span>
                    <span className="font-medium text-slate-800">Floor {room.floor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Type:</span>
                    <span className="font-medium text-slate-800">{room.roomType} {room.ac ? '(AC)' : '(Non-AC)'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Rent:</span>
                    <span className="font-bold text-brand-600">₹{room.monthlyRent.toLocaleString()}/mo</span>
                  </div>
                </div>

                {room.currentResident && (
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold">
                      {room.currentResident.fullName?.charAt(0)}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-900 truncate">{room.currentResident.fullName}</p>
                      <p className="text-[10px] text-slate-500">{room.currentResident.mobile}</p>
                    </div>
                  </div>
                )}

                {/* Overdue alert if active */}
                {room.activeDue && room.activeDue.overdueDays > 0 && (
                  <div className="mt-2.5">
                    <StatusBadge tier={room.activeDue.tier} />
                    <p className="text-[11px] text-red-600 font-bold mt-1">
                      Due: ₹{room.activeDue.totalOutstanding.toLocaleString()} ({room.activeDue.overdueDays}d overdue)
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="px-6 py-4">Room</th>
                  <th className="px-6 py-4">Block & Floor</th>
                  <th className="px-6 py-4">Type & AC</th>
                  <th className="px-6 py-4">Monthly Rent</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Current Resident</th>
                  <th className="px-6 py-4">Overdue Dues</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rooms.map((room) => (
                  <tr key={room._id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4 font-bold text-slate-900">{room.roomNumber}</td>
                    <td className="px-6 py-4 text-slate-700">
                      {room.block?.name} (Floor {room.floor})
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {room.roomType} • {room.ac ? 'AC' : 'Non-AC'}
                    </td>
                    <td className="px-6 py-4 font-bold text-brand-600">
                      ₹{room.monthlyRent.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={room.status} />
                    </td>
                    <td className="px-6 py-4">
                      {room.currentResident ? (
                        <div>
                          <p className="font-bold text-slate-900">{room.currentResident.fullName}</p>
                          <p className="text-[11px] text-slate-500">{room.currentResident.mobile}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {room.activeDue && room.activeDue.overdueDays > 0 ? (
                        <div>
                          <StatusBadge tier={room.activeDue.tier} />
                          <p className="text-[11px] font-bold text-red-600 mt-0.5">
                            ₹{room.activeDue.totalOutstanding.toLocaleString()}
                          </p>
                        </div>
                      ) : (
                        <span className="text-emerald-600 font-semibold">No Dues</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllRoomsManagement;
