import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/common/StatusBadge';
import {
  DoorClosed,
  Plus,
  Edit2,
  Wrench,
  LogOut,
  Search,
  CheckCircle2,
  X,
  AlertTriangle,
  User,
} from 'lucide-react';

const RoomManagement = () => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [viewMode, setViewMode] = useState('grid');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [maintenanceRoom, setMaintenanceRoom] = useState(null);
  const [maintenanceReason, setMaintenanceReason] = useState('');
  const [vacatingRoom, setVacatingRoom] = useState(null);
  const [vacateReason, setVacateReason] = useState('');

  const [formData, setFormData] = useState({
    roomNumber: '',
    floor: 1,
    roomType: 'Double',
    ac: true,
    maxOccupants: 2,
    monthlyRent: 15000,
    securityDeposit: 30000,
    otherCharges: 0,
  });

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchRooms = async () => {
    try {
      const res = await api.get('/rooms', {
        params: {
          floor: selectedFloor || undefined,
          roomType: selectedType || undefined,
          status: selectedStatus || undefined,
          search: search || undefined,
        },
      });
      if (res.data?.success) setRooms(res.data.data);
    } catch (err) {
      console.error('Error fetching rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [selectedFloor, selectedType, selectedStatus, search]);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/rooms', formData);
      setSuccessMsg(`Room ${formData.roomNumber} created successfully`);
      setShowAddModal(false);
      fetchRooms();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create room');
    }
  };

  const handleUpdateRoom = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.put(`/rooms/${editingRoom._id}`, formData);
      setSuccessMsg(`Room ${formData.roomNumber} updated successfully`);
      setShowEditModal(false);
      fetchRooms();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update room');
    }
  };

  const handleToggleMaintenance = async () => {
    if (!maintenanceRoom) return;
    try {
      await api.post(`/rooms/${maintenanceRoom._id}/maintenance`, { maintenanceReason });
      setSuccessMsg(`Room ${maintenanceRoom.roomNumber} status updated`);
      setMaintenanceRoom(null);
      setMaintenanceReason('');
      fetchRooms();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle maintenance');
    }
  };

  const handleVacateRoom = async () => {
    if (!vacatingRoom) return;
    try {
      await api.post(`/rooms/${vacatingRoom._id}/vacate`, { vacateReason });
      setSuccessMsg(`Room ${vacatingRoom.roomNumber} vacated and marked Available`);
      setVacatingRoom(null);
      setVacateReason('');
      fetchRooms();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to vacate room');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Room Management</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Assigned Block: {user?.assignedBlock?.name || 'My Block'} • Inventory & Occupancy
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                viewMode === 'grid' ? 'bg-brand-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                viewMode === 'table' ? 'bg-brand-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Table
            </button>
          </div>
          <button
            onClick={() => {
              setFormData({
                roomNumber: '',
                floor: 1,
                roomType: 'Double',
                ac: true,
                maxOccupants: 2,
                monthlyRent: 15000,
                securityDeposit: 30000,
                otherCharges: 0,
              });
              setError('');
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl transition shadow-sm cursor-pointer"
          >
            <Plus size={15} /> Add Room
          </button>
        </div>
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

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-4 gap-3">
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
            value={selectedFloor}
            onChange={(e) => setSelectedFloor(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-brand-500"
          >
            <option value="">All Floors</option>
            <option value="1">Floor 1</option>
            <option value="2">Floor 2</option>
            <option value="3">Floor 3</option>
            <option value="4">Floor 4</option>
            <option value="5">Floor 5</option>
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

      {/* Content */}
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
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-extrabold text-lg text-slate-900">Room {room.roomNumber}</span>
                  <StatusBadge status={room.status} />
                </div>

                <div className="space-y-1 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Floor:</span>
                    <span className="font-medium text-slate-800">{room.floor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Type:</span>
                    <span className="font-medium text-slate-800">{room.roomType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">AC:</span>
                    <span className="font-medium text-slate-800">{room.ac ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Monthly Rent:</span>
                    <span className="font-bold text-slate-900">₹{room.monthlyRent.toLocaleString()}</span>
                  </div>
                </div>

                {/* Resident Info & Overdue Status */}
                {room.currentResident && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-900">Resident: {room.currentResident.fullName}</p>
                    {room.activeDue && room.activeDue.overdueDays > 0 ? (
                      <div className="mt-2 p-2 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                        <StatusBadge tier={room.activeDue.tier} />
                        <div className="flex justify-between text-[11px] font-bold text-slate-900 pt-1">
                          <span>Due: ₹{room.activeDue.amountDue.toLocaleString()}</span>
                          <span className="text-red-600">Overdue: {room.activeDue.overdueDays} days</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-emerald-600 font-semibold mt-1">Payment Status: Paid</p>
                    )}
                  </div>
                )}

                {room.status === 'maintenance' && room.maintenanceReason && (
                  <div className="mt-2.5 p-2 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800">
                    <strong>Reason:</strong> {room.maintenanceReason}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  onClick={() => {
                    setEditingRoom(room);
                    setFormData({
                      roomNumber: room.roomNumber,
                      floor: room.floor,
                      roomType: room.roomType,
                      ac: room.ac,
                      maxOccupants: room.maxOccupants,
                      monthlyRent: room.monthlyRent,
                      securityDeposit: room.securityDeposit,
                      otherCharges: room.otherCharges || 0,
                    });
                    setShowEditModal(true);
                  }}
                  className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 flex items-center gap-1 font-medium cursor-pointer"
                >
                  <Edit2 size={13} /> Edit
                </button>

                {room.status !== 'occupied' && (
                  <button
                    onClick={() => {
                      setMaintenanceRoom(room);
                      setMaintenanceReason(room.maintenanceReason || '');
                    }}
                    className="p-1.5 text-amber-600 hover:text-amber-700 rounded-lg hover:bg-amber-50 flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <Wrench size={13} /> {room.status === 'maintenance' ? 'Exit Maint' : 'Maintenance'}
                  </button>
                )}

                {room.status === 'occupied' && (
                  <button
                    onClick={() => setVacatingRoom(room)}
                    className="p-1.5 text-red-600 hover:text-red-700 rounded-lg hover:bg-red-50 flex items-center gap-1 font-bold cursor-pointer"
                  >
                    <LogOut size={13} /> Vacate
                  </button>
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
                  <th className="px-6 py-4">Floor & Type</th>
                  <th className="px-6 py-4">Rent</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Resident</th>
                  <th className="px-6 py-4">Overdue Days</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rooms.map((room) => (
                  <tr key={room._id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4 font-bold text-slate-900">{room.roomNumber}</td>
                    <td className="px-6 py-4 text-slate-700">Floor {room.floor} • {room.roomType} ({room.ac ? 'AC' : 'Non-AC'})</td>
                    <td className="px-6 py-4 font-bold text-slate-900">₹{room.monthlyRent.toLocaleString()}</td>
                    <td className="px-6 py-4"><StatusBadge status={room.status} /></td>
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
                        <StatusBadge tier={room.activeDue.tier} label={`${room.activeDue.overdueDays} Days Overdue`} />
                      ) : (
                        <span className="text-emerald-600 font-semibold">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {room.status === 'occupied' && (
                        <button
                          onClick={() => setVacatingRoom(room)}
                          className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-lg transition"
                        >
                          Vacate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Room Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                {showEditModal ? `Edit Room ${editingRoom?.roomNumber}` : 'Add New Room'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={showEditModal ? handleUpdateRoom : handleCreateRoom} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Room Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.roomNumber}
                    onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                    placeholder="e.g. A-101"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Floor *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Room Type</label>
                  <select
                    value={formData.roomType}
                    onChange={(e) => setFormData({ ...formData, roomType: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                  >
                    <option value="Single">Single</option>
                    <option value="Double">Double</option>
                    <option value="Triple">Triple</option>
                    <option value="Four sharing">Four sharing</option>
                    <option value="Deluxe">Deluxe</option>
                    <option value="Suite">Suite</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Air Conditioning</label>
                  <select
                    value={formData.ac ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, ac: e.target.value === 'true' })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                  >
                    <option value="true">AC Room</option>
                    <option value="false">Non-AC Room</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Monthly Rent (₹) *</label>
                  <input
                    type="number"
                    required
                    value={formData.monthlyRent}
                    onChange={(e) => setFormData({ ...formData, monthlyRent: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Security Deposit (₹)</label>
                  <input
                    type="number"
                    value={formData.securityDeposit}
                    onChange={(e) => setFormData({ ...formData, securityDeposit: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                  }}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl"
                >
                  {showEditModal ? 'Save Room' : 'Add Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Maintenance Modal */}
      {maintenanceRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Toggle Maintenance Mode: {maintenanceRoom.roomNumber}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {maintenanceRoom.status === 'maintenance'
                ? 'This will restore the room to Available status.'
                : 'Marking this room for maintenance will temporarily prevent bookings.'}
            </p>
            {maintenanceRoom.status !== 'maintenance' && (
              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Maintenance</label>
                <input
                  type="text"
                  placeholder="e.g. AC repair, plumbing inspection"
                  value={maintenanceReason}
                  onChange={(e) => setMaintenanceReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                />
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setMaintenanceRoom(null)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleToggleMaintenance}
                className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-xl"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vacate Modal */}
      {vacatingRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Vacate Room {vacatingRoom.roomNumber}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Resident: <strong>{vacatingRoom.currentResident?.fullName}</strong>. This will complete the checkout and automatically notify waiting queue users.
            </p>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Checkout / Vacate Reason</label>
              <input
                type="text"
                placeholder="e.g. End of stay duration, relocation"
                value={vacateReason}
                onChange={(e) => setVacateReason(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setVacatingRoom(null)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleVacateRoom}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-xl"
              >
                Confirm Vacate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomManagement;
