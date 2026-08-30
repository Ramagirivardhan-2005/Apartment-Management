import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/common/StatusBadge';
import {
  DoorClosed,
  Car,
  CreditCard,
  AlertCircle,
  Megaphone,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Clock,
  Printer,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const ResidentDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?._id) {
        setLoading(false);
        return;
      }
      try {
        const [profRes, annRes] = await Promise.allSettled([
          api.get(`/users/${user._id}`),
          api.get('/announcements'),
        ]);

        if (profRes.status === 'fulfilled' && profRes.value?.data?.success) {
          setProfile(profRes.value.data.data);
        }
        if (annRes.status === 'fulfilled' && annRes.value?.data?.success) {
          setAnnouncements(annRes.value.data.data.slice(0, 3));
        }
      } catch (err) {
        console.error('Error fetching resident dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const currentRoom = profile?.currentRoom;
  const currentParking = profile?.parkingAllocations?.[0];
  const activeDue = profile?.dues?.find((d) => d.status === 'unpaid' || d.status === 'partially_paid');

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-brand-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Sparkles size={15} /> Resident Portal
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Welcome back, {user?.fullName}!</h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
            {currentRoom
              ? `You are currently staying in Room ${currentRoom.roomNumber} (${currentRoom.block?.name})`
              : 'You do not have an active room allocation yet. You can book a room anytime.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/resident/payments"
            className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl transition shadow-sm"
          >
            Pay Dues Online
          </Link>
          <Link
            to="/resident/complaints"
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition border border-slate-700"
          >
            Raise Complaint
          </Link>
        </div>
      </div>

      {/* Outstanding Due Banner with Automatic Color Tiering */}
      {activeDue && (
        <div
          className={`p-6 rounded-3xl border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            activeDue.tier === 'critical'
              ? 'bg-rose-950 text-rose-100 border-rose-900'
              : activeDue.tier === 'overdue_10_plus'
              ? 'bg-red-50 text-red-950 border-red-200'
              : activeDue.tier === 'overdue_1_10'
              ? 'bg-orange-50 text-orange-950 border-orange-200'
              : 'bg-amber-50 text-amber-950 border-amber-200'
          }`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl shrink-0 ${
                activeDue.tier === 'critical'
                  ? 'bg-rose-900 text-rose-200 animate-pulse'
                  : activeDue.tier === 'overdue_10_plus'
                  ? 'bg-red-200 text-red-800'
                  : 'bg-orange-200 text-orange-800'
              }`}
            >
              <AlertCircle size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <StatusBadge tier={activeDue.tier} />
                {activeDue.overdueDays > 0 && (
                  <span className="font-extrabold text-xs">
                    {activeDue.overdueDays} Days Overdue
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold mt-1">
                Outstanding Balance: ₹{Number(activeDue.totalOutstanding || 0).toLocaleString()}
              </h3>
              <p className="text-xs opacity-90 mt-0.5">
                Monthly Rent: ₹{Number(activeDue.rentAmount || 0).toLocaleString()}
                {activeDue.lateFee > 0 && ` + Late Fee: ₹${Number(activeDue.lateFee || 0).toLocaleString()}`}
                {' • '}
                Due Date: {new Date(activeDue.dueDate).toLocaleDateString()}
              </p>
            </div>
          </div>

          <Link
            to="/resident/payments"
            className="px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl transition shadow-md self-start md:self-auto cursor-pointer"
          >
            Pay ₹{Number(activeDue.totalOutstanding || 0).toLocaleString()} Now
          </Link>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Room Info */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">My Room</span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <DoorClosed size={18} />
              </div>
            </div>

            {currentRoom ? (
              <div className="space-y-2">
                <h3 className="text-2xl font-extrabold text-slate-900">Room {currentRoom.roomNumber}</h3>
                <p className="text-xs text-slate-600">{currentRoom.block?.name || 'Block'} • Floor {currentRoom.floor}</p>
                <div className="pt-2 text-xs text-slate-500 space-y-1">
                  <div className="flex justify-between">
                    <span>Room Type:</span>
                    <strong className="text-slate-800">{currentRoom.roomType} ({currentRoom.ac || currentRoom.isAirConditioned ? 'AC' : 'Non-AC'})</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Monthly Rent:</span>
                    <strong className="text-brand-600">₹{Number(currentRoom.monthlyRent || 0).toLocaleString()}/mo</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-4">
                <p className="text-xs text-slate-500">No room currently allocated.</p>
                <Link
                  to="/resident/book-room"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:underline"
                >
                  Book a room now &rarr;
                </Link>
              </div>
            )}
          </div>

          {currentRoom && (
            <Link
              to="/resident/room"
              className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-brand-600 hover:underline flex items-center justify-between"
            >
              <span>View Stay Details</span>
              <ArrowRight size={14} />
            </Link>
          )}
        </div>

        {/* Parking Info */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">My Parking</span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Car size={18} />
              </div>
            </div>

            {currentParking ? (
              <div className="space-y-2">
                <h3 className="text-2xl font-extrabold text-slate-900">Slot {currentParking.slot?.slotNumber}</h3>
                <p className="text-xs text-slate-600">{currentParking.block?.name || 'Block'} • {currentParking.slot?.floorLocation}</p>
                <div className="pt-2 text-xs text-slate-500 space-y-1">
                  <div className="flex justify-between">
                    <span>Vehicle:</span>
                    <strong className="text-brand-600 font-mono">{currentParking.vehicleNumber}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Vehicle Type:</span>
                    <strong className="text-slate-800">{currentParking.vehicleType}</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-4">
                <p className="text-xs text-slate-500">No active parking slot assigned.</p>
                <Link
                  to="/resident/parking"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:underline"
                >
                  View parking details &rarr;
                </Link>
              </div>
            )}
          </div>

          <Link
            to="/resident/parking"
            className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-brand-600 hover:underline flex items-center justify-between"
          >
            <span>Parking & Complaints</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Payments Summary */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Payments</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <CreditCard size={18} />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-extrabold text-slate-900">
                {profile?.payments?.length || 0} Receipts
              </h3>
              <p className="text-xs text-slate-600">Download official vouchers and invoices</p>
              <div className="pt-2 text-xs text-slate-500 space-y-1">
                <div className="flex justify-between">
                  <span>Last Payment:</span>
                  <strong className="text-slate-800">
                    {profile?.payments?.[0]
                      ? `₹${Number(profile.payments[0].amount || profile.payments[0].totalAmount || 0).toLocaleString()} (${new Date(profile.payments[0].paymentDate || profile.payments[0].createdAt).toLocaleDateString()})`
                      : 'None'}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          <Link
            to="/resident/payments"
            className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-brand-600 hover:underline flex items-center justify-between"
          >
            <span>Payment History</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Announcements Feed */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Megaphone size={18} className="text-brand-600" />
            <h3 className="text-base font-bold text-slate-900">Latest Notices & Announcements</h3>
          </div>
          <Link to="/resident/announcements" className="text-xs font-bold text-brand-600 hover:underline">
            View All
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {announcements.length === 0 ? (
            <p className="text-xs text-slate-400 py-4">No active notices.</p>
          ) : (
            announcements.map((ann) => (
              <div key={ann._id} className="py-3.5 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-xs text-slate-900">{ann.title}</span>
                  <span className="text-[11px] text-slate-400">{new Date(ann.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2">{ann.content}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ResidentDashboard;
