import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import { Car, Search, Building2, User, CheckCircle2 } from 'lucide-react';

const AllParkingManagement = () => {
  const [slots, setSlots] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBlock, setSelectedBlock] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    try {
      const [slotsRes, blocksRes] = await Promise.all([
        api.get('/parking', {
          params: {
            blockId: selectedBlock || undefined,
            status: selectedStatus || undefined,
            search: search || undefined,
          },
        }),
        api.get('/blocks'),
      ]);

      if (slotsRes.data?.success) setSlots(slotsRes.data.data);
      if (blocksRes.data?.success) setBlocks(blocksRes.data.data);
    } catch (err) {
      console.error('Error fetching parking slots:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedBlock, selectedStatus, search]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">All Parking Slots</h2>
        <p className="text-xs sm:text-sm text-slate-500">System-wide vehicle bays and resident allocations</p>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search slot number..."
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
            <option value="allocated">Allocated</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {slots.map((slot) => (
            <div
              key={slot._id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                      <Car size={16} />
                    </div>
                    <span className="font-extrabold text-base text-slate-900">{slot.slotNumber}</span>
                  </div>
                  <StatusBadge status={slot.status} />
                </div>

                <div className="space-y-1 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Block:</span>
                    <span className="font-medium text-slate-800">{slot.block?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Location:</span>
                    <span className="font-medium text-slate-800">{slot.floorLocation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Type:</span>
                    <span className="font-medium text-slate-800">{slot.slotType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Monthly Fee:</span>
                    <span className="font-bold text-brand-600">₹{slot.monthlyFee}/mo</span>
                  </div>
                </div>

                {slot.currentResident && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <p className="text-[11px] font-bold text-slate-900">{slot.currentResident.fullName}</p>
                    {slot.currentVehicle && (
                      <p className="text-[10px] text-brand-600 font-mono font-semibold">
                        {slot.currentVehicle.vehicleNumber} ({slot.currentVehicle.model || slot.currentVehicle.vehicleType})
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AllParkingManagement;
