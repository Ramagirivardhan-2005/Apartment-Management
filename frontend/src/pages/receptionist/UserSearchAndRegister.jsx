import React, { useState } from 'react';
import api from '../../api/client';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  UserPlus,
  UserCheck,
  Phone,
  Mail,
  FileCheck2,
  CalendarDays,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Building2,
} from 'lucide-react';

const UserSearchAndRegister = () => {
  const [searchMobile, setSearchMobile] = useState('');
  const [searching, setSearching] = useState(false);
  const [foundUser, setFoundUser] = useState(null);
  const [searchCompleted, setSearchCompleted] = useState(false);

  // New User Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobile: '',
    dob: '',
    gender: 'Male',
    houseNo: '',
    street: '',
    landmark: '',
    villageCity: '',
    mandal: '',
    district: '',
    state: 'Karnataka',
    country: 'India',
    pincode: '',
    emergencyName: '',
    emergencyMobile: '',
    emergencyRelation: '',
    proofType1: 'Aadhaar',
    proofNumber1: '',
    proofType2: 'Passport',
    proofNumber2: '',
    bookLater: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchMobile.trim()) return;

    setSearching(true);
    setSearchCompleted(false);
    setFoundUser(null);
    setError('');

    try {
      const res = await api.get('/users/search', {
        params: { query: searchMobile.trim() },
      });

      setSearchCompleted(true);
      if (res.data?.success && res.data.data.length > 0) {
        setFoundUser(res.data.data[0]);
      } else {
        // Pre-fill mobile in new user form
        setFormData((prev) => ({ ...prev, mobile: searchMobile.trim() }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      const identityProofs = [];
      if (formData.proofNumber1) {
        identityProofs.push({
          proofType: formData.proofType1,
          proofNumber: formData.proofNumber1,
          verificationStatus: 'verified',
        });
      }
      if (formData.proofNumber2) {
        identityProofs.push({
          proofType: formData.proofType2,
          proofNumber: formData.proofNumber2,
          verificationStatus: 'verified',
        });
      }

      const payload = {
        fullName: formData.fullName,
        email: formData.email,
        mobile: formData.mobile,
        dob: formData.dob || undefined,
        gender: formData.gender,
        address: {
          houseNo: formData.houseNo,
          street: formData.street,
          landmark: formData.landmark,
          villageCity: formData.villageCity,
          mandal: formData.mandal,
          district: formData.district,
          state: formData.state,
          country: formData.country,
          pincode: formData.pincode,
        },
        emergencyContact: {
          name: formData.emergencyName,
          mobile: formData.emergencyMobile,
          relationship: formData.emergencyRelation,
        },
        identityProofs,
        bookLater: formData.bookLater,
      };

      const res = await api.post('/users', payload);
      if (res.data?.success) {
        setSuccessMsg(
          formData.bookLater
            ? `User ${formData.fullName} registered successfully! Account activation link sent. User can book room later.`
            : `User ${formData.fullName} registered! Proceeding to room booking wizard.`
        );

        if (!formData.bookLater) {
          setTimeout(() => {
            navigate('/receptionist/book-room', { state: { selectedUser: res.data.data } });
          }, 1500);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">User Registration & Lookup</h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Search existing records by mobile number before registering a new resident
        </p>
      </div>

      {/* Step 1: Mobile Search Box */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
          <Search size={16} className="text-brand-600" />
          <span>1. Search Existing User by Mobile Number</span>
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Check if resident already has an account or previous bookings before creating a duplicate entry.
        </p>

        <form onSubmit={handleSearch} className="flex gap-2 max-w-lg">
          <div className="relative flex-1">
            <Phone size={15} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              type="tel"
              required
              placeholder="Enter 10-digit mobile number..."
              value={searchMobile}
              onChange={(e) => setSearchMobile(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-brand-500"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {searching ? 'Searching...' : 'Search User'}
          </button>
        </form>

        {/* Existing User Found Result */}
        {foundUser && (
          <div className="mt-5 p-5 bg-emerald-50 border border-emerald-200 rounded-2xl animate-in fade-in">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-emerald-600" />
                  <h4 className="text-sm font-extrabold text-emerald-950">Existing User Found!</h4>
                </div>
                <p className="text-xs text-slate-700 mt-1">
                  <strong>{foundUser.fullName}</strong> • {foundUser.mobile} • {foundUser.email}
                </p>
                <div className="mt-2 text-xs text-slate-600 flex items-center gap-3">
                  <span>
                    ID Proofs: <strong>{foundUser.identityProofs?.length || 0} on file</strong> ({foundUser.isDocumentVerified ? 'Verified' : 'Pending'})
                  </span>
                  {foundUser.activeRoom && (
                    <span className="text-brand-700 font-bold bg-brand-50 px-2 py-0.5 rounded">
                      Current Room: {foundUser.activeRoom.roomNumber} ({foundUser.activeRoom.block?.name})
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => navigate('/receptionist/book-room', { state: { selectedUser: foundUser } })}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <span>Proceed to Book Room</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {searchCompleted && !foundUser && (
          <div className="mt-4 p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="text-blue-600 shrink-0" />
            <span>No user found with mobile <strong>{searchMobile}</strong>. Please complete the registration form below.</span>
          </div>
        )}
      </div>

      {/* Step 2: New User Details Form */}
      {(!foundUser || !searchCompleted) && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
            <UserPlus size={16} className="text-brand-600" />
            <span>2. New Resident Details & Identity Proofs</span>
          </h3>
          <p className="text-xs text-slate-500 mb-6">
            Collect personal information, address, and 1 or 2 government identity proofs
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-6 text-xs">
            {/* Personal Details */}
            <div>
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-3 pb-1 border-b border-slate-100">
                Personal Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="e.g. Ramesh Reddy"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    placeholder="9876543210"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="ramesh@gmail.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-3 pb-1 border-b border-slate-100">
                Permanent Address
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="House / Flat No."
                  value={formData.houseNo}
                  onChange={(e) => setFormData({ ...formData, houseNo: e.target.value })}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                />
                <input
                  type="text"
                  placeholder="Street / Area"
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                />
                <input
                  type="text"
                  placeholder="Landmark"
                  value={formData.landmark}
                  onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                <input
                  type="text"
                  placeholder="City / Village"
                  value={formData.villageCity}
                  onChange={(e) => setFormData({ ...formData, villageCity: e.target.value })}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                />
                <input
                  type="text"
                  placeholder="State"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                />
                <input
                  type="text"
                  placeholder="Pincode"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>
            </div>

            {/* Emergency Contact */}
            <div>
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-3 pb-1 border-b border-slate-100">
                Emergency Contact
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Contact Name"
                  value={formData.emergencyName}
                  onChange={(e) => setFormData({ ...formData, emergencyName: e.target.value })}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                />
                <input
                  type="tel"
                  placeholder="Emergency Mobile"
                  value={formData.emergencyMobile}
                  onChange={(e) => setFormData({ ...formData, emergencyMobile: e.target.value })}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                />
                <input
                  type="text"
                  placeholder="Relationship (e.g. Spouse, Father)"
                  value={formData.emergencyRelation}
                  onChange={(e) => setFormData({ ...formData, emergencyRelation: e.target.value })}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>
            </div>

            {/* Identity Proofs */}
            <div>
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-3 pb-1 border-b border-slate-100">
                Identity Proof Verification (1 or 2 Proofs)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <label className="block font-bold text-slate-800">Primary ID Proof *</label>
                  <select
                    value={formData.proofType1}
                    onChange={(e) => setFormData({ ...formData, proofType1: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900"
                  >
                    <option value="Aadhaar">Aadhaar Card</option>
                    <option value="Passport">Passport</option>
                    <option value="Driving License">Driving License</option>
                    <option value="Voter ID">Voter ID</option>
                    <option value="PAN">PAN Card</option>
                  </select>
                  <input
                    type="text"
                    required
                    placeholder="Proof Number (e.g. 5421-8974-1234)"
                    value={formData.proofNumber1}
                    onChange={(e) => setFormData({ ...formData, proofNumber1: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <label className="block font-bold text-slate-800">Secondary ID Proof (Optional)</label>
                  <select
                    value={formData.proofType2}
                    onChange={(e) => setFormData({ ...formData, proofType2: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900"
                  >
                    <option value="Passport">Passport</option>
                    <option value="Driving License">Driving License</option>
                    <option value="Voter ID">Voter ID</option>
                    <option value="PAN">PAN Card</option>
                    <option value="Aadhaar">Aadhaar Card</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Optional Second Proof Number"
                    value={formData.proofNumber2}
                    onChange={(e) => setFormData({ ...formData, proofNumber2: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Register Now vs Book Later choice (Section 18) */}
            <div className="p-4 bg-brand-50/50 rounded-2xl border border-brand-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">Registration Option</span>
                <span className="text-slate-500">
                  {formData.bookLater
                    ? 'Register account now and let resident book later from their portal.'
                    : 'Register and proceed immediately to select rooms & process advance payment.'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, bookLater: false })}
                  className={`px-3 py-1.5 rounded-xl font-bold transition ${
                    !formData.bookLater ? 'bg-brand-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
                  }`}
                >
                  Book Room Now
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, bookLater: true })}
                  className={`px-3 py-1.5 rounded-xl font-bold transition ${
                    formData.bookLater ? 'bg-brand-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
                  }`}
                >
                  Book Later
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>{formData.bookLater ? 'Complete Registration (Book Later)' : 'Register & Continue to Room Selection'}</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default UserSearchAndRegister;
