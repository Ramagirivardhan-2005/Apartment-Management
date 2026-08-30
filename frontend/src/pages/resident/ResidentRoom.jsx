import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  DoorClosed,
  Users,
  Calendar,
  ShieldCheck,
  CreditCard,
  Building2,
  Receipt,
  FileText,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const ResidentRoom = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const res = await api.get(`/users/${user._id}`);
        if (res.data?.success) setProfile(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (user?._id) {
      fetchRoom();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const room = profile?.currentRoom;
  const allocations = profile?.roomAllocations || [];
  const activeAllocations = allocations.filter((a) => a.status === 'active');
  const latestBooking = profile?.bookings?.[0];
  const latestPayment = profile?.payments?.[0];

  if (!room && activeAllocations.length === 0) {
    return (
      <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center max-w-lg mx-auto space-y-4 shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-brand-600 flex items-center justify-center mx-auto">
          <DoorClosed size={28} />
        </div>
        <h3 className="text-lg font-bold text-slate-900">No Active Room Stay</h3>
        <p className="text-xs text-slate-500">
          You do not have an active room allocated yet. You can browse available rooms and book directly online.
        </p>
        <Link
          to="/resident/book-room"
          className="inline-block px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl transition shadow-sm cursor-pointer"
        >
          Book a Room Now
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">My Room Stay & Bookings</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Current allocation details, room specifications, booking confirmation & payment history
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-bold self-start sm:self-auto">
          <CheckCircle2 size={14} />
          <span>Active Resident Stay</span>
        </div>
      </div>

      {/* Main Room Card */}
      {room && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-6 border-b border-slate-100 flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center font-extrabold text-xl border border-brand-100">
                <DoorClosed size={28} />
              </div>
              <div>
                <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">Active Stay</span>
                <h3 className="text-2xl font-extrabold text-slate-900">Room {room.roomNumber}</h3>
                <p className="text-xs text-slate-500">{room.block?.name || 'Assigned Block'} • Floor {room.floor}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Monthly Rent</span>
              <span className="text-2xl font-extrabold text-brand-600">₹{room.monthlyRent?.toLocaleString()}</span>
            </div>
          </div>

          {/* Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-slate-400 block mb-1">Room Type</span>
              <strong className="text-slate-900 text-sm">{room.roomType}</strong>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-slate-400 block mb-1">Air Conditioning</span>
              <strong className="text-slate-900 text-sm">{room.ac || room.isAirConditioned ? 'AC Equipped' : 'Non-AC'}</strong>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-slate-400 block mb-1">Move-in Date</span>
              <strong className="text-slate-900 text-sm">
                {activeAllocations[0] ? new Date(activeAllocations[0].moveInDate).toLocaleDateString() : 'N/A'}
              </strong>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-slate-400 block mb-1">Expected Move-out</span>
              <strong className="text-slate-900 text-sm">
                {activeAllocations[0] ? new Date(activeAllocations[0].expectedMoveOutDate).toLocaleDateString() : 'N/A'}
              </strong>
            </div>
          </div>

          {/* Occupants List */}
          {activeAllocations[0]?.occupants && activeAllocations[0].occupants.length > 0 && (
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-3">Registered Occupants</h4>
              <div className="space-y-2">
                {activeAllocations[0].occupants.map((occ, i) => (
                  <div key={i} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{occ.fullName}</p>
                      <p className="text-slate-500">{occ.relationship} • {occ.mobile || 'No mobile'}</p>
                    </div>
                    <span className="font-mono text-slate-600 bg-white px-2 py-1 rounded border border-slate-200 text-[11px]">
                      {occ.proofType}: {occ.proofNumber || 'Verified'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Booking & Advance Payment Details Card */}
      {latestBooking && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                <FileText size={20} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">Booking Record</span>
                <h4 className="font-bold text-slate-900 text-base">Booking ID: {latestBooking.bookingId}</h4>
              </div>
            </div>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold uppercase">
              {latestBooking.status || 'Confirmed'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
              <span className="text-slate-400 block">Stay Duration</span>
              <p className="font-bold text-slate-900 text-sm">{latestBooking.durationMonths} Months</p>
              <span className="text-[11px] text-slate-500">From {new Date(latestBooking.moveInDate).toLocaleDateString()}</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
              <span className="text-slate-400 block">Advance Amount Paid</span>
              <p className="font-bold text-emerald-700 text-sm">₹{latestBooking.advancePaid?.toLocaleString()}</p>
              <span className="text-[11px] text-slate-500">Valuation: ₹{latestBooking.totalStayAmount?.toLocaleString()}</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
              <span className="text-slate-400 block">Payment Status</span>
              <p className="font-bold text-slate-900 text-sm uppercase">{latestBooking.paymentStatus || 'Paid'}</p>
              {latestPayment?.receiptNumber && (
                <span className="text-[11px] font-mono text-brand-600 block">Receipt: {latestPayment.receiptNumber}</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResidentRoom;

