import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { History, DoorClosed, Calendar, CheckCircle2 } from 'lucide-react';

const ResidentRoomHistory = () => {
  const { user } = useAuth();
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get(`/users/${user._id}`);
        if (res.data?.success) {
          setAllocations(res.data.data.roomAllocations || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">My Room Stay History</h2>
        <p className="text-xs sm:text-sm text-slate-500">Record of past and active apartment allocations</p>
      </div>

      <div className="space-y-4">
        {allocations.length === 0 ? (
          <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center text-slate-400 text-xs shadow-xs">
            No previous room allocations found.
          </div>
        ) : (
          allocations.map((alloc) => (
            <div key={alloc._id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-brand-600 flex items-center justify-center font-bold">
                  <DoorClosed size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">Room {alloc.room?.roomNumber}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${alloc.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      {alloc.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{alloc.block?.name} • Floor {alloc.room?.floor}</p>
                  <p className="text-xs text-slate-600 mt-1">
                    Stay: {new Date(alloc.moveInDate).toLocaleDateString()} to {alloc.actualMoveOutDate ? new Date(alloc.actualMoveOutDate).toLocaleDateString() : new Date(alloc.expectedMoveOutDate).toLocaleDateString()} ({alloc.durationMonths} months)
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 block">Monthly Rent</span>
                <span className="text-base font-extrabold text-brand-600">₹{alloc.monthlyRent.toLocaleString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ResidentRoomHistory;
