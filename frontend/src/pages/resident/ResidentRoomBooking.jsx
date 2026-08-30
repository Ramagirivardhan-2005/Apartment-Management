import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  DoorClosed,
  Building2,
  CheckCircle2,
  CreditCard,
  Search,
  Filter,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Receipt,
  Printer,
  AlertCircle,
  Clock,
  User as UserIcon,
  Phone,
  Mail,
  Calendar,
  Layers,
  Wind,
  BedDouble,
  Check,
  X,
  Lock,
} from 'lucide-react';
import ReceiptModal from '../../components/common/ReceiptModal';
import RazorpayModal from '../../components/common/RazorpayModal';

const ResidentRoomBooking = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Wizard Step: 1 = Details, 2 = Available Rooms, 3 = Review & Pay, 4 = Confirmation
  const [currentStep, setCurrentStep] = useState(1);

  // Form Details (Step 1)
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    mobile: user?.mobile || '',
    proofType: 'Aadhaar',
    proofNumber: user?.registrationId || '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    preferredBlock: 'all',
    preferredRoomType: 'all',
    preferredAc: 'all',
    moveInDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    durationMonths: 6,
    numberOfPeople: 1,
    specialRequests: '',
  });

  const [blocks, setBlocks] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);

  // Razorpay & Payment States
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [bookingSuccessData, setBookingSuccessData] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [error, setError] = useState('');

  // In-app Razorpay Test Gateway Modal State
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [razorpayOrderInfo, setRazorpayOrderInfo] = useState(null);
  const [activePaymentTab, setActivePaymentTab] = useState('upi'); // 'upi', 'card', 'netbanking'
  const [upiId, setUpiId] = useState('resident@okhdfcbank');
  const [cardNumber, setCardNumber] = useState('4111 2222 3333 4444');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('123');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');

  // Load available blocks on mount
  useEffect(() => {
    const fetchBlocks = async () => {
      try {
        const res = await api.get('/blocks');
        if (res.data?.success) {
          setBlocks(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching blocks:', err);
      }
    };
    fetchBlocks();
  }, []);

  // Fetch strictly AVAILABLE rooms based on Step 1 criteria
  const fetchAvailableRooms = async () => {
    setLoadingRooms(true);
    setError('');
    try {
      const res = await api.get('/rooms/available', {
        params: {
          includeBooked: false, // Strictly ONLY available rooms!
          blockId: formData.preferredBlock !== 'all' ? formData.preferredBlock : undefined,
          roomType: formData.preferredRoomType !== 'all' ? formData.preferredRoomType : undefined,
          ac: formData.preferredAc !== 'all' ? (formData.preferredAc === 'ac') : undefined,
        },
      });

      if (res.data?.success) {
        // Double filter on frontend to ensure NO occupied/booked rooms are displayed
        const strictlyAvailable = res.data.data.filter(
          (r) => r.status === 'AVAILABLE' || r.status === 'available'
        );
        setAvailableRooms(strictlyAvailable);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch available rooms');
    } finally {
      setLoadingRooms(false);
    }
  };

  const handleStep1Submit = (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.mobile || !formData.email) {
      setError('Please fill in your primary contact details');
      return;
    }
    setError('');
    fetchAvailableRooms();
    setCurrentStep(2);
  };

  const handleSelectRoom = (room) => {
    setSelectedRoom(room);
    setCurrentStep(3);
  };

  // Initiate Razorpay Payment Order
  const handleInitiateRazorpay = async () => {
    if (!selectedRoom) return;
    setError('');
    setIsProcessingPayment(true);

    try {
      const orderRes = await api.post('/payments/razorpay/create-order', {
        roomId: selectedRoom._id,
        amount: selectedRoom.monthlyRent,
      });

      if (!orderRes.data?.success) {
        throw new Error(orderRes.data?.message || 'Failed to initialize Razorpay Order');
      }

      const orderData = orderRes.data.data;
      setRazorpayOrderInfo(orderData);
      setShowRazorpayModal(true);
      setIsProcessingPayment(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Payment initiation failed');
      setIsProcessingPayment(false);
    }
  };

  // Complete Payment Verification on Backend
  const completePaymentVerification = async ({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
    setIsProcessingPayment(true);
    try {
      const verifyRes = await api.post('/payments/razorpay/verify-payment', {
        razorpay_order_id: razorpay_order_id || razorpayOrderInfo?.orderId || `order_test_${Date.now()}`,
        razorpay_payment_id: razorpay_payment_id || `pay_rzp_${Date.now().toString().slice(-8)}`,
        razorpay_signature: razorpay_signature || 'simulated_valid_test_signature',
        roomId: selectedRoom._id,
        fullName: formData.fullName,
        mobile: formData.mobile,
        proofType: formData.proofType,
        proofNumber: formData.proofNumber,
        moveInDate: formData.moveInDate,
        durationMonths: formData.durationMonths,
        numberOfPeople: formData.numberOfPeople,
      });

      if (verifyRes.data?.success) {
        setBookingSuccessData(verifyRes.data.data);
        setSelectedReceipt(verifyRes.data.data);
        setShowRazorpayModal(false);
        setCurrentStep(4);
      } else {
        throw new Error(verifyRes.data?.message || 'Payment verification failed');
      }
    } catch (vErr) {
      setError(vErr.response?.data?.message || vErr.message || 'Payment verification failed');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Room Booking Portal</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Submit your stay details, select from verified available flats, and pay seamlessly via Razorpay
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-50 border border-brand-200 rounded-xl text-brand-700 text-xs font-bold self-start sm:self-auto">
          <Sparkles size={14} />
          <span>Razorpay Instant Settle Active</span>
        </div>
      </div>

      {/* Progress Steps Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-xs">
        <div className="grid grid-cols-4 gap-2 sm:gap-4">
          {[
            { num: 1, title: '1. Stay Details', desc: 'Personal & Duration' },
            { num: 2, title: '2. Available Rooms', desc: 'Choose Vacant Flat' },
            { num: 3, title: '3. Review & Pay', desc: 'Razorpay Checkout' },
            { num: 4, title: '4. Confirmed', desc: 'Receipt Voucher' },
          ].map((s) => (
            <div
              key={s.num}
              className={`p-3 rounded-2xl border transition text-left ${
                currentStep === s.num
                  ? 'bg-brand-50/80 border-brand-300 ring-2 ring-brand-500/20'
                  : currentStep > s.num
                  ? 'bg-emerald-50/60 border-emerald-200'
                  : 'bg-slate-50/50 border-slate-200 opacity-60'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    currentStep > s.num
                      ? 'bg-emerald-600 text-white'
                      : currentStep === s.num
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {currentStep > s.num ? <Check size={12} /> : s.num}
                </span>
                <span className="text-xs font-bold text-slate-800 hidden sm:inline">{s.title}</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 pl-8 hidden md:block">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 1: RESIDENT & STAY DETAILS                                           */}
      {/* ========================================================================= */}
      {currentStep === 1 && (
        <form onSubmit={handleStep1Submit} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Step 1: Enter Your Booking &amp; Stay Requirements</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Please specify your personal details and room preferences before viewing available flats.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
              <div className="relative">
                <UserIcon size={14} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-brand-500 outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number *</label>
              <div className="relative">
                <Phone size={14} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="tel"
                  required
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  placeholder="e.g. 9876543210"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-brand-500 outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. john@example.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-brand-500 outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Identity Proof Type</label>
              <select
                value={formData.proofType}
                onChange={(e) => setFormData({ ...formData, proofType: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-brand-500 outline-hidden"
              >
                <option value="Aadhaar">Aadhaar Card</option>
                <option value="Passport">Passport</option>
                <option value="Voter ID">Voter ID</option>
                <option value="Driving License">Driving License</option>
                <option value="Student ID">Student / College ID</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ID / Registration Number</label>
              <input
                type="text"
                value={formData.proofNumber}
                onChange={(e) => setFormData({ ...formData, proofNumber: e.target.value })}
                placeholder="e.g. AADH-1234-5678"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-brand-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Contact Phone</label>
              <input
                type="tel"
                value={formData.emergencyContactPhone}
                onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                placeholder="e.g. 9123456789"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-brand-500 outline-hidden"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Room &amp; Stay Preferences</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Block</label>
                <select
                  value={formData.preferredBlock}
                  onChange={(e) => setFormData({ ...formData, preferredBlock: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-brand-500 outline-hidden"
                >
                  <option value="all">Any Block</option>
                  {blocks.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Sharing / Room Type</label>
                <select
                  value={formData.preferredRoomType}
                  onChange={(e) => setFormData({ ...formData, preferredRoomType: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-brand-500 outline-hidden"
                >
                  <option value="all">Any Room Type</option>
                  <option value="Single">Single Room</option>
                  <option value="Double">Double Sharing</option>
                  <option value="Triple">Triple Sharing</option>
                  <option value="Four sharing">Four Sharing</option>
                  <option value="Deluxe">Deluxe Suite</option>
                  <option value="1BHK">1 BHK Apartment</option>
                  <option value="2BHK">2 BHK Apartment</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Air Conditioning</label>
                <select
                  value={formData.preferredAc}
                  onChange={(e) => setFormData({ ...formData, preferredAc: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-brand-500 outline-hidden"
                >
                  <option value="all">Any (AC or Non-AC)</option>
                  <option value="ac">Air Conditioned (AC)</option>
                  <option value="non_ac">Non-AC</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Stay Duration</label>
                <select
                  value={formData.durationMonths}
                  onChange={(e) => setFormData({ ...formData, durationMonths: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-brand-500 outline-hidden"
                >
                  <option value={1}>1 Month</option>
                  <option value={3}>3 Months</option>
                  <option value={6}>6 Months</option>
                  <option value={11}>11 Months</option>
                  <option value={12}>12 Months (1 Year)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <span>Find Available Rooms</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: AVAILABLE ROOMS SELECTION (STRICTLY ONLY AVAILABLE ROOMS)         */}
      {/* ========================================================================= */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Step 2: Select an Available Flat</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Showing strictly vacant and ready-to-move flats matching your preferences.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Modify Details</span>
              </button>
            </div>
          </div>

          {loadingRooms ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-slate-500 font-medium">Scanning live available inventory...</p>
            </div>
          ) : availableRooms.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto font-bold">
                <DoorClosed size={24} />
              </div>
              <h4 className="text-base font-bold text-slate-800">No Vacant Rooms Matching Selected Criteria</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                All flats in the selected category are currently occupied. Please choose "Any Block" or different room types to view available options.
              </p>
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    ...formData,
                    preferredBlock: 'all',
                    preferredRoomType: 'all',
                    preferredAc: 'all',
                  });
                  setCurrentStep(1);
                }}
                className="px-5 py-2.5 bg-brand-600 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-brand-500 transition"
              >
                Reset Preferences &amp; Search Again
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableRooms.map((room) => (
                <div
                  key={room._id}
                  className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:shadow-md hover:border-brand-300 transition p-6 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-extrabold rounded-full uppercase tracking-wider">
                        Available Now
                      </span>
                      <span className="text-xs font-semibold text-slate-500">Floor {room.floor}</span>
                    </div>

                    <div>
                      <h4 className="text-2xl font-extrabold text-slate-900">Room {room.roomNumber}</h4>
                      <p className="text-xs font-semibold text-brand-600 flex items-center gap-1 mt-0.5">
                        <Building2 size={13} />
                        <span>{room.block?.name} ({room.block?.code})</span>
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span className="flex items-center gap-1.5">
                          <BedDouble size={14} className="text-slate-400" />
                          <span>Type:</span>
                        </span>
                        <strong className="text-slate-800">{room.roomType}</strong>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span className="flex items-center gap-1.5">
                          <Wind size={14} className="text-slate-400" />
                          <span>Climate:</span>
                        </span>
                        <strong className="text-slate-800">
                          {room.isAirConditioned || room.ac ? 'Air Conditioned (AC)' : 'Non-AC'}
                        </strong>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span className="flex items-center gap-1.5">
                          <CreditCard size={14} className="text-slate-400" />
                          <span>Monthly Rent:</span>
                        </span>
                        <strong className="text-brand-600 font-extrabold text-sm">
                          ₹{Number(room.monthlyRent || 0).toLocaleString()}
                          <span className="text-[11px] font-normal text-slate-400">/mo</span>
                        </strong>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSelectRoom(room)}
                    className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Book Room {room.roomNumber}</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: REVIEW SUMMARY & RAZORPAY PAYMENT CHECKOUT                         */}
      {/* ========================================================================= */}
      {currentStep === 3 && selectedRoom && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Step 3: Review Booking &amp; Pay Advance</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Confirm your stay parameters and complete payment via Razorpay Test Gateway.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl flex items-center gap-1 transition cursor-pointer"
            >
              <ArrowLeft size={13} />
              <span>Change Room</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Resident & Stay Summary */}
            <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 text-xs space-y-3">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Resident &amp; Stay Summary</h4>
              <div className="space-y-2 text-slate-600">
                <div className="flex justify-between">
                  <span>Resident Name:</span>
                  <strong className="text-slate-900">{formData.fullName}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Mobile &amp; Email:</span>
                  <strong className="text-slate-900">{formData.mobile} • {formData.email}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Identity Proof:</span>
                  <strong className="text-slate-900">{formData.proofType} ({formData.proofNumber || 'N/A'})</strong>
                </div>
                <div className="flex justify-between">
                  <span>Move-in Date:</span>
                  <strong className="text-slate-900">{new Date(formData.moveInDate).toLocaleDateString()}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Stay Duration:</span>
                  <strong className="text-slate-900">{formData.durationMonths} Months</strong>
                </div>
              </div>
            </div>

            {/* Room & Price Breakdown */}
            <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 text-xs space-y-3">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Room &amp; Advance Payable</h4>
              <div className="space-y-2 text-slate-600">
                <div className="flex justify-between">
                  <span>Selected Room:</span>
                  <strong className="text-brand-600 font-bold text-sm">Room {selectedRoom.roomNumber} ({selectedRoom.block?.name})</strong>
                </div>
                <div className="flex justify-between">
                  <span>Type &amp; Climate:</span>
                  <strong className="text-slate-900">{selectedRoom.roomType} • {selectedRoom.isAirConditioned || selectedRoom.ac ? 'AC' : 'Non-AC'}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Monthly Rent:</span>
                  <strong className="text-slate-900">₹{Number(selectedRoom.monthlyRent || 0).toLocaleString()}/month</strong>
                </div>
                <div className="flex justify-between">
                  <span>Security Deposit:</span>
                  <strong className="text-slate-900">₹{Number(selectedRoom.securityDeposit || 0).toLocaleString()}</strong>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-extrabold text-slate-900">
                  <span>Required Advance Payable:</span>
                  <span className="text-emerald-600 font-bold text-base">₹{Number(selectedRoom.monthlyRent || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-brand-50 border border-brand-200 rounded-2xl text-brand-900 text-xs flex items-center gap-3">
            <ShieldCheck size={24} className="text-brand-600 shrink-0" />
            <div>
              <h5 className="font-bold">Instant Online Settle with Razorpay Test Mode</h5>
              <p className="opacity-90">
                Your payment will instantly reserve Room {selectedRoom.roomNumber} and issue a digital stamped receipt voucher.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold text-xs"
            >
              Back to Rooms
            </button>
            <button
              type="button"
              disabled={isProcessingPayment}
              onClick={handleInitiateRazorpay}
              className="px-8 py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              {isProcessingPayment ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Initiating Razorpay...</span>
                </>
              ) : (
                <>
                  <CreditCard size={15} />
                  <span>Pay ₹{Number(selectedRoom.monthlyRent || 0).toLocaleString()} via Razorpay</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 4: SUCCESS CONFIRMATION MODAL / SCREEN                               */}
      {/* ========================================================================= */}
      {currentStep === 4 && bookingSuccessData && (
        <div className="bg-white rounded-3xl border border-emerald-200 shadow-xl p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <CheckCircle2 size={26} />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                  Payment Verified &amp; Room Confirmed
                </span>
                <h3 className="text-xl font-extrabold text-slate-900">
                  Welcome to Room {selectedRoom?.roomNumber || bookingSuccessData.roomNumber}!
                </h3>
              </div>
            </div>
            <button
              onClick={() => setSelectedReceipt(bookingSuccessData)}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-2 self-start sm:self-auto cursor-pointer"
            >
              <Printer size={14} />
              <span>Print Official Voucher</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-slate-400 font-semibold block mb-1">Receipt Number</span>
              <strong className="text-slate-900 font-mono text-sm">{bookingSuccessData.receiptNumber}</strong>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-slate-400 font-semibold block mb-1">Razorpay Payment ID</span>
              <strong className="text-slate-900 font-mono text-sm">{bookingSuccessData.paymentId || bookingSuccessData.razorpayPaymentId}</strong>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-slate-400 font-semibold block mb-1">Allocated Unit</span>
              <strong className="text-brand-600 font-bold text-sm">
                Room {selectedRoom?.roomNumber || bookingSuccessData.roomNumber} ({selectedRoom?.block?.name || 'Block'})
              </strong>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-slate-400 font-semibold block mb-1">Advance Amount Paid</span>
              <strong className="text-emerald-700 font-bold text-sm">
                ₹{Number(bookingSuccessData.amount || selectedRoom?.monthlyRent || 0).toLocaleString()}
              </strong>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => navigate('/resident/dashboard')}
              className="w-full sm:w-auto px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => navigate('/resident/room')}
              className="w-full sm:w-auto px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
            >
              View My Stay &amp; Room Details &rarr;
            </button>
          </div>
        </div>
      )}

      {/* In-App Razorpay Checkout Modal */}
      {showRazorpayModal && selectedRoom && (
        <RazorpayModal
          isOpen={showRazorpayModal}
          onClose={() => {
            setShowRazorpayModal(false);
            setIsProcessingPayment(false);
          }}
          amount={Number(selectedRoom.monthlyRent || 0)}
          title={`Room ${selectedRoom.roomNumber} Booking Advance`}
          description={`${selectedRoom.block?.name || 'Block'} • Advance Payment`}
          orderId={razorpayOrderInfo?.orderId}
          residentName={formData.fullName}
          residentEmail={formData.email}
          residentMobile={formData.mobile}
          isProcessing={isProcessingPayment}
          onSuccess={completePaymentVerification}
        />
      )}

      {/* Official Printable Receipt Modal */}
      {selectedReceipt && (
        <ReceiptModal
          payment={selectedReceipt}
          isOpen={!!selectedReceipt && currentStep !== 4}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
};

export default ResidentRoomBooking;
