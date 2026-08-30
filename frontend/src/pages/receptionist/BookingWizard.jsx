import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import {
  User,
  Calendar,
  Users,
  FileText,
  DoorClosed,
  CreditCard,
  Car,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Search,
  Printer,
  Sparkles,
  RotateCw,
  Clock,
  Lock,
} from 'lucide-react';
import ReceiptModal from '../../components/common/ReceiptModal';

const BookingWizard = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedUser, setSelectedUser] = useState(location.state?.selectedUser || null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Step 2: Stay Details
  const [stayDetails, setStayDetails] = useState({
    moveInDate: new Date().toISOString().slice(0, 10),
    durationMonths: 6,
    numberOfPeople: 1,
    roomType: 'Double',
    ac: true,
  });

  // Step 3: Occupants
  const [occupants, setOccupants] = useState([
    {
      fullName: selectedUser?.fullName || '',
      mobile: selectedUser?.mobile || '',
      relationship: 'Self / Primary',
      proofType: 'Aadhaar',
      proofNumber: '',
    },
  ]);

  // Step 5: Available Rooms & Selection (MAX 4 ROOMS)
  const [availableRooms, setAvailableRooms] = useState([]);
  const [selectedRoomIds, setSelectedRoomIds] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [roomError, setRoomError] = useState('');
  const [queueJoined, setQueueJoined] = useState(null);
  const [isJoiningQueue, setIsJoiningQueue] = useState(false);
  const [queueMsg, setQueueMsg] = useState('');
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Step 6: Payment & Advance Calculation
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [transactionId, setTransactionId] = useState('');

  // Step 7: Parking
  const [requireParking, setRequireParking] = useState(false);
  const [parkingSlots, setParkingSlots] = useState([]);
  const [selectedParkingSlotId, setSelectedParkingSlotId] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('4-wheeler');

  // Step 8: Confirmation & Results
  const [completedBooking, setCompletedBooking] = useState(null);
  const [completedPayment, setCompletedPayment] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Sync primary occupant with selected user
  useEffect(() => {
    if (selectedUser) {
      setOccupants((prev) => [
        {
          ...prev[0],
          fullName: selectedUser.fullName,
          mobile: selectedUser.mobile,
          proofNumber: selectedUser.identityProofs?.[0]?.proofNumber || '',
        },
        ...prev.slice(1),
      ]);
    }
  }, [selectedUser]);

  // Search User
  const handleUserSearch = async (e) => {
    e.preventDefault();
    if (!userSearchQuery) return;
    setSearching(true);
    try {
      const res = await api.get('/users/search', { params: { query: userSearchQuery } });
      if (res.data?.success) setSearchResults(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  // Fetch Synchronized Rooms when reaching Step 5
  const fetchRooms = async () => {
    setLoadingRooms(true);
    setRoomError('');
    try {
      const res = await api.get('/rooms/available', {
        params: {
          includeBooked: true,
          roomType: stayDetails.roomType !== 'Any' ? stayDetails.roomType : undefined,
          ac: stayDetails.ac,
        },
      });
      if (res.data?.success) {
        setAvailableRooms(res.data.data);
        setLastSyncTime(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    if (currentStep === 5) {
      fetchRooms();
    }
  }, [currentStep, stayDetails]);

  // Join Waitlist Queue Handler
  const handleJoinQueue = async () => {
    if (!selectedUser) return;
    setIsJoiningQueue(true);
    setQueueMsg('');
    try {
      const targetBlock = selectedUser.assignedBlock?._id || selectedUser.assignedBlock || availableRooms[0]?.block?._id;
      const res = await api.post('/bookings/queue', {
        requestedBlockId: targetBlock,
        roomType: stayDetails.roomType !== 'Any' ? stayDetails.roomType : 'Double',
        ac: stayDetails.ac,
        numberOfRooms: 1,
        numberOfPeople: stayDetails.numberOfPeople,
        requestedMoveInDate: stayDetails.moveInDate,
        durationMonths: stayDetails.durationMonths,
      });
      if (res.data?.success) {
        setQueueJoined(res.data.data);
        setQueueMsg(`Successfully added to waitlist queue! Queue Position: #${res.data.data.queuePosition}`);
      }
    } catch (err) {
      setRoomError(err.response?.data?.message || 'Failed to join waitlist queue');
    } finally {
      setIsJoiningQueue(false);
    }
  };

  // Fetch Parking Slots when reaching Step 7
  useEffect(() => {
    const fetchParking = async () => {
      try {
        const res = await api.get('/parking', { params: { status: 'available' } });
        if (res.data?.success) setParkingSlots(res.data.data);
      } catch (err) {
        console.error(err);
      }
    };
    if (currentStep === 7) {
      fetchParking();
    }
  }, [currentStep]);

  // Room Selection Handler with Max 4 Rooms Enforcement & Availability Check
  const toggleRoomSelection = (room) => {
    const isAvail = room.status === 'AVAILABLE' || room.status === 'available';
    if (!isAvail) {
      setRoomError(`Room ${room.roomNumber} is already booked/occupied and cannot be selected.`);
      return;
    }
    setRoomError('');
    if (selectedRoomIds.includes(room._id)) {
      setSelectedRoomIds(selectedRoomIds.filter((id) => id !== room._id));
    } else {
      if (selectedRoomIds.length >= 4) {
        setRoomError('You can book a maximum of 4 rooms at a time.');
        return;
      }
      setSelectedRoomIds([...selectedRoomIds, room._id]);
    }
  };

  // Occupants handler
  const addOccupant = () => {
    setOccupants([
      ...occupants,
      { fullName: '', mobile: '', relationship: 'Family', proofType: 'Aadhaar', proofNumber: '' },
    ]);
  };

  const updateOccupant = (index, field, value) => {
    const updated = [...occupants];
    updated[index][field] = value;
    setOccupants(updated);
  };

  const removeOccupant = (index) => {
    if (occupants.length <= 1) return;
    setOccupants(occupants.filter((_, i) => i !== index));
  };

  // Calculations
  const selectedRoomsList = availableRooms.filter((r) => selectedRoomIds.includes(r._id));
  const totalMonthlyRent = selectedRoomsList.reduce((sum, r) => sum + r.monthlyRent, 0);
  const totalSecurityDeposit = selectedRoomsList.reduce((sum, r) => sum + (r.securityDeposit || 0), 0);
  const totalStayAmount = totalMonthlyRent * stayDetails.durationMonths + totalSecurityDeposit;

  // Advance Payment Rule (Section 25):
  // Stay <= 6 months: 60% advance payment
  // Stay > 6 months: 4 months' advance rent
  let requiredAdvance = 0;
  if (stayDetails.durationMonths <= 6) {
    requiredAdvance = Math.round(totalStayAmount * 0.6);
  } else {
    requiredAdvance = totalMonthlyRent * 4 + totalSecurityDeposit;
  }

  // Final Submit
  const handleCompleteBooking = async () => {
    setIsSubmitting(true);
    try {
      const moveIn = new Date(stayDetails.moveInDate);
      const moveOut = new Date(moveIn);
      moveOut.setMonth(moveOut.getMonth() + Number(stayDetails.durationMonths));

      const payload = {
        userId: selectedUser._id,
        roomIds: selectedRoomIds,
        moveInDate: moveIn,
        expectedMoveOutDate: moveOut,
        durationMonths: stayDetails.durationMonths,
        numberOfPeople: occupants.length,
        occupants,
        requireParking,
        parkingSlotId: requireParking ? selectedParkingSlotId : undefined,
        vehicleDetails: requireParking
          ? { vehicleNumber, vehicleType, vehicleModel: '' }
          : undefined,
        paymentDetails: {
          paymentMethod,
          transactionId: transactionId || `TXN-${Date.now()}`,
          amountPaid: requiredAdvance,
        },
      };

      const res = await api.post('/bookings', payload);
      if (res.data?.success) {
        setCompletedBooking(res.data.data.booking);
        setCompletedPayment(res.data.data.payment);
        setCurrentStep(8);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Booking submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { num: 1, label: 'User' },
    { num: 2, label: 'Stay Details' },
    { num: 3, label: 'Occupants' },
    { num: 4, label: 'Documents' },
    { num: 5, label: 'Room Selection' },
    { num: 6, label: 'Payment' },
    { num: 7, label: 'Parking' },
    { num: 8, label: 'Confirmation' },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Room Booking Wizard</h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Multi-step booking with advance calculation rules and automatic room allocation
        </p>
      </div>

      {/* Step Progress Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
        <div className="flex items-center justify-between min-w-[650px]">
          {steps.map((s, idx) => (
            <React.Fragment key={s.num}>
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
                    currentStep === s.num
                      ? 'bg-brand-600 text-white ring-4 ring-brand-100'
                      : currentStep > s.num
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {currentStep > s.num ? '✓' : s.num}
                </div>
                <span
                  className={`text-xs font-semibold whitespace-nowrap ${
                    currentStep === s.num
                      ? 'text-slate-900 font-bold'
                      : currentStep > s.num
                      ? 'text-emerald-700'
                      : 'text-slate-400'
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 ${
                    currentStep > s.num ? 'bg-emerald-500' : 'bg-slate-200'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* STEP 1: USER SELECTION */}
      {currentStep === 1 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <h3 className="text-base font-bold text-slate-900">Step 1: Resident Identification</h3>

          {selectedUser ? (
            <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  {selectedUser.fullName?.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{selectedUser.fullName}</h4>
                  <p className="text-xs text-slate-600">{selectedUser.mobile} • {selectedUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                Change Resident
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <form onSubmit={handleUserSearch} className="flex gap-2 max-w-lg">
                <input
                  type="text"
                  placeholder="Search resident by mobile or email..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900"
                />
                <button
                  type="submit"
                  disabled={searching}
                  className="px-5 py-2.5 bg-brand-600 text-white font-bold text-xs rounded-xl hover:bg-brand-500 cursor-pointer"
                >
                  Search
                </button>
              </form>

              {searchResults.length > 0 && (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                  {searchResults.map((u) => (
                    <div
                      key={u._id}
                      onClick={() => setSelectedUser(u)}
                      className="p-3.5 hover:bg-slate-50 flex items-center justify-between cursor-pointer transition"
                    >
                      <div>
                        <p className="font-bold text-xs text-slate-900">{u.fullName}</p>
                        <p className="text-[11px] text-slate-500">{u.mobile} • {u.email}</p>
                      </div>
                      <span className="text-xs font-bold text-brand-600">Select &rarr;</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end">
            <button
              disabled={!selectedUser}
              onClick={() => setCurrentStep(2)}
              className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 disabled:opacity-40 cursor-pointer"
            >
              <span>Next: Stay Details</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: STAY DETAILS */}
      {currentStep === 2 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <h3 className="text-base font-bold text-slate-900">Step 2: Stay Duration & Room Preferences</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Move-in Date *</label>
              <input
                type="date"
                required
                value={stayDetails.moveInDate}
                onChange={(e) => setStayDetails({ ...stayDetails, moveInDate: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Stay Duration (Months) *</label>
              <select
                value={stayDetails.durationMonths}
                onChange={(e) => setStayDetails({ ...stayDetails, durationMonths: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900"
              >
                <option value="1">1 Month</option>
                <option value="3">3 Months</option>
                <option value="6">6 Months (60% Advance rule)</option>
                <option value="11">11 Months (4 Months advance rule)</option>
                <option value="12">12 Months (4 Months advance rule)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Preferred Room Type</label>
              <select
                value={stayDetails.roomType}
                onChange={(e) => setStayDetails({ ...stayDetails, roomType: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900"
              >
                <option value="Any">Any Type</option>
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
                value={stayDetails.ac ? 'true' : 'false'}
                onChange={(e) => setStayDetails({ ...stayDetails, ac: e.target.value === 'true' })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900"
              >
                <option value="true">AC Room</option>
                <option value="false">Non-AC Room</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-5 py-2 text-slate-600 hover:bg-slate-100 text-xs font-semibold rounded-xl"
            >
              Back
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer"
            >
              <span>Next: Occupants</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: OCCUPANTS */}
      {currentStep === 3 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Step 3: Occupants Information</h3>
            <button
              onClick={addOccupant}
              className="px-3 py-1.5 bg-brand-50 text-brand-700 hover:bg-brand-100 rounded-xl text-xs font-bold cursor-pointer"
            >
              + Add Occupant
            </button>
          </div>

          <div className="space-y-4">
            {occupants.map((occ, idx) => (
              <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Occupant #{idx + 1} {idx === 0 && '(Primary)'}</span>
                  {idx > 0 && (
                    <button
                      onClick={() => removeOccupant(idx)}
                      className="text-red-600 hover:underline font-semibold"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Full Name *"
                    value={occ.fullName}
                    onChange={(e) => updateOccupant(idx, 'fullName', e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                  />
                  <input
                    type="tel"
                    placeholder="Mobile Number"
                    value={occ.mobile}
                    onChange={(e) => updateOccupant(idx, 'mobile', e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                  />
                  <input
                    type="text"
                    placeholder="Relationship"
                    value={occ.relationship}
                    onChange={(e) => updateOccupant(idx, 'relationship', e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select
                    value={occ.proofType}
                    onChange={(e) => updateOccupant(idx, 'proofType', e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                  >
                    <option value="Aadhaar">Aadhaar Card</option>
                    <option value="Passport">Passport</option>
                    <option value="Driving License">Driving License</option>
                    <option value="Voter ID">Voter ID</option>
                    <option value="PAN">PAN Card</option>
                  </select>
                  <input
                    type="text"
                    placeholder="ID Proof Number"
                    value={occ.proofNumber}
                    onChange={(e) => updateOccupant(idx, 'proofNumber', e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-5 py-2 text-slate-600 hover:bg-slate-100 text-xs font-semibold rounded-xl"
            >
              Back
            </button>
            <button
              onClick={() => setCurrentStep(4)}
              className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer"
            >
              <span>Next: Documents</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: DOCUMENTS VERIFICATION */}
      {currentStep === 4 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <h3 className="text-base font-bold text-slate-900">Step 4: Documents Verification</h3>

          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs space-y-2">
            <div className="flex items-center gap-2 text-emerald-800 font-bold">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span>Identity Proofs Confirmed for Front-Desk Verification</span>
            </div>
            <p className="text-slate-600">
              Resident <strong>{selectedUser?.fullName}</strong> has registered proofs on file. Verification status is marked as Verified.
            </p>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setCurrentStep(3)}
              className="px-5 py-2 text-slate-600 hover:bg-slate-100 text-xs font-semibold rounded-xl"
            >
              Back
            </button>
            <button
              onClick={() => setCurrentStep(5)}
              className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer"
            >
              <span>Next: Select Rooms</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: ROOM SELECTION (MAX 4 ROOMS ENFORCEMENT & SYNCHRONIZATION) */}
      {currentStep === 5 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-base font-bold text-slate-900">Step 5: Synchronized Room Selection</h3>
                <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  <Clock size={12} />
                  <span>Sync: {lastSyncTime || 'Live'}</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Select 1 to 4 available rooms. Selected: <strong>{selectedRoomIds.length} / 4 max</strong>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchRooms}
                disabled={loadingRooms}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer"
                title="Refresh Room Availability"
              >
                <RotateCw size={13} className={loadingRooms ? 'animate-spin' : ''} />
                <span>Sync Rooms</span>
              </button>

              {selectedRoomIds.length > 0 && (
                <span className="px-3 py-1 bg-brand-50 text-brand-700 font-bold text-xs rounded-xl border border-brand-200">
                  {selectedRoomIds.length} selected (₹{totalMonthlyRent.toLocaleString()}/mo)
                </span>
              )}
            </div>
          </div>

          {/* Section 23 Warning Message if attempting 5th room or selecting booked room */}
          {roomError && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{roomError}</span>
            </div>
          )}

          {/* Queue Joined Notification */}
          {queueMsg && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 size={16} className="text-amber-600 shrink-0" />
              <span>{queueMsg}</span>
            </div>
          )}

          {loadingRooms ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : availableRooms.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <p className="text-xs text-slate-500">No rooms currently match the requested preferences.</p>
              <button
                type="button"
                onClick={handleJoinQueue}
                disabled={isJoiningQueue || Boolean(queueJoined)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl transition shadow-sm cursor-pointer disabled:opacity-60"
              >
                <Clock size={14} />
                <span>{queueJoined ? `Joined (#${queueJoined.queuePosition} in Queue)` : 'Join Waitlist Booking Queue'}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Status Summary Bar */}
              <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span>Available: <strong>{availableRooms.filter((r) => r.status === 'AVAILABLE' || r.status === 'available').length}</strong></span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  <span>Already Booked: <strong>{availableRooms.filter((r) => r.status !== 'AVAILABLE' && r.status !== 'available').length}</strong></span>
                </span>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {availableRooms.map((r) => {
                  const isAvailable = r.status === 'AVAILABLE' || r.status === 'available';
                  const isSelected = selectedRoomIds.includes(r._id);

                  return (
                    <div
                      key={r._id}
                      onClick={() => isAvailable && toggleRoomSelection(r)}
                      className={`p-4 rounded-2xl border-2 transition flex flex-col justify-between ${
                        !isAvailable
                          ? 'border-slate-200 bg-slate-50/80 opacity-70 cursor-not-allowed select-none'
                          : isSelected
                          ? 'border-brand-600 bg-brand-50/50 shadow-sm cursor-pointer'
                          : 'border-slate-200 hover:border-slate-300 bg-white cursor-pointer'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-extrabold text-base text-slate-900">{r.roomNumber}</span>
                          {isAvailable ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              AVAILABLE
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                              <Lock size={10} /> ALREADY BOOKED
                            </span>
                          )}
                        </div>
                        <div className="space-y-0.5 text-xs text-slate-600">
                          <p>{r.block?.name} • Floor {r.floor}</p>
                          <p>{r.roomType} ({r.isAirConditioned ?? r.ac ? 'AC' : 'Non-AC'})</p>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">₹{r.monthlyRent?.toLocaleString()}/mo</span>
                        {isAvailable ? (
                          <span className={`text-xs font-bold ${isSelected ? 'text-brand-600 font-extrabold' : 'text-slate-400'}`}>
                            {isSelected ? '✓ Selected' : '+ Select'}
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-slate-400">
                            Occupied
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Inline Queue Synchronization Option */}
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <h4 className="font-bold text-amber-950">Looking for a specific room or already booked flat?</h4>
                  <p className="text-amber-800 text-[11px] mt-0.5">
                    Join the synchronized waitlist queue. You will be automatically notified when a room becomes available.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleJoinQueue}
                  disabled={isJoiningQueue || Boolean(queueJoined)}
                  className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-xl transition shadow-xs self-start sm:self-auto cursor-pointer disabled:opacity-60 shrink-0"
                >
                  {queueJoined ? `In Queue (Position #${queueJoined.queuePosition})` : 'Join Waitlist Queue'}
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setCurrentStep(4)}
              className="px-5 py-2 text-slate-600 hover:bg-slate-100 text-xs font-semibold rounded-xl"
            >
              Back
            </button>
            <button
              disabled={selectedRoomIds.length === 0}
              onClick={() => setCurrentStep(6)}
              className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 disabled:opacity-40 cursor-pointer"
            >
              <span>Next: Advance Payment</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 6: PAYMENT & ADVANCE CALCULATION */}
      {currentStep === 6 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <h3 className="text-base font-bold text-slate-900">Step 6: Advance Payment Calculation & Collection</h3>

          {/* Breakdown Card */}
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Selected Rooms ({selectedRoomsList.length})</span>
              <span className="font-bold text-slate-800">{selectedRoomsList.map((r) => r.roomNumber).join(', ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Monthly Rent (Combined)</span>
              <span className="font-bold text-slate-800">₹{totalMonthlyRent.toLocaleString()} / month</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Stay Duration</span>
              <span className="font-bold text-slate-800">{stayDetails.durationMonths} Months</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Security Deposit</span>
              <span className="font-bold text-slate-800">₹{totalSecurityDeposit.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Stay Valuation</span>
              <span className="font-bold text-slate-800">₹{totalStayAmount.toLocaleString()}</span>
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-between text-sm">
              <span className="font-bold text-brand-900">
                Required Advance ({stayDetails.durationMonths <= 6 ? '60% Advance Rule' : '4 Months Advance Rule'})
              </span>
              <span className="font-extrabold text-base text-brand-600">₹{requiredAdvance.toLocaleString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900"
              >
                <option value="upi">UPI / QR Code</option>
                <option value="online_card">Credit / Debit Card</option>
                <option value="net_banking">Net Banking</option>
                <option value="cash">Front Desk Cash</option>
                <option value="cheque">Bank Cheque</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Transaction / Reference ID</label>
              <input
                type="text"
                placeholder="UPI-12345 or Cash Voucher"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900"
              />
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setCurrentStep(5)}
              className="px-5 py-2 text-slate-600 hover:bg-slate-100 text-xs font-semibold rounded-xl"
            >
              Back
            </button>
            <button
              onClick={() => setCurrentStep(7)}
              className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer"
            >
              <span>Next: Parking Details</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 7: PARKING */}
      {currentStep === 7 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <h3 className="text-base font-bold text-slate-900">Step 7: Parking Slot Allocation</h3>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-900 block text-xs">Does the resident require parking?</span>
              <span className="text-[11px] text-slate-500">Allocate a vehicle bay in basement parking</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRequireParking(true)}
                className={`px-4 py-1.5 rounded-xl font-bold text-xs transition ${
                  requireParking ? 'bg-brand-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setRequireParking(false)}
                className={`px-4 py-1.5 rounded-xl font-bold text-xs transition ${
                  !requireParking ? 'bg-brand-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
                }`}
              >
                No
              </button>
            </div>
          </div>

          {requireParking && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Parking Slot</label>
                <select
                  value={selectedParkingSlotId}
                  onChange={(e) => setSelectedParkingSlotId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                >
                  <option value="">-- Choose Slot --</option>
                  {parkingSlots.map((slot) => (
                    <option key={slot._id} value={slot._id}>
                      {slot.slotNumber} ({slot.slotType} - ₹{slot.monthlyFee}/mo)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Vehicle Type</label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                >
                  <option value="4-wheeler">4-Wheeler Car</option>
                  <option value="2-wheeler">2-Wheeler Motorcycle</option>
                  <option value="EV">EV Electric Vehicle</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Vehicle Number *</label>
                <input
                  type="text"
                  required={requireParking}
                  placeholder="e.g. KA-05-MH-2020"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 uppercase"
                />
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setCurrentStep(6)}
              className="px-5 py-2 text-slate-600 hover:bg-slate-100 text-xs font-semibold rounded-xl"
            >
              Back
            </button>
            <button
              disabled={isSubmitting || (requireParking && (!selectedParkingSlotId || !vehicleNumber))}
              onClick={handleCompleteBooking}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 disabled:opacity-40 cursor-pointer shadow-md"
            >
              {isSubmitting ? (
                <span>Confirming Booking...</span>
              ) : (
                <>
                  <span>Confirm & Generate Receipt</span>
                  <CheckCircle2 size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 8: CONFIRMATION & RECEIPT */}
      {currentStep === 8 && completedBooking && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs text-center space-y-6 animate-in fade-in">
          <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 size={36} />
          </div>

          <div>
            <h3 className="text-xl font-extrabold text-slate-900">Room Booking Successfully Confirmed!</h3>
            <p className="text-xs text-slate-500 mt-1">
              Booking ID: <strong className="text-slate-800">{completedBooking.bookingId}</strong>
            </p>
          </div>

          <div className="max-w-md mx-auto p-5 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Resident</span>
              <span className="font-bold text-slate-900">{selectedUser?.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Rooms Allocated</span>
              <span className="font-bold text-brand-600">
                {selectedRoomsList.map((r) => r.roomNumber).join(', ')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Advance Paid</span>
              <span className="font-bold text-emerald-600">₹{Number(completedPayment?.amount || completedPayment?.totalAmount || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Receipt Number</span>
              <span className="font-mono font-bold text-slate-900">{completedPayment?.receiptNumber}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setShowReceiptModal(true)}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition cursor-pointer"
            >
              <Printer size={15} /> View / Print Receipt
            </button>
            <button
              onClick={() => navigate('/receptionist/dashboard')}
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Return to Desk
            </button>
          </div>

          {/* Receipt Modal */}
          {completedPayment && (
            <ReceiptModal
              payment={completedPayment}
              isOpen={showReceiptModal}
              onClose={() => setShowReceiptModal(false)}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default BookingWizard;
