import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { Users, Search, Mail, Phone, ShieldCheck, FileText, CheckCircle2, XCircle, Eye, X, KeyRound } from 'lucide-react';

const AllResidentsManagement = () => {
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const fetchResidents = async () => {
    try {
      const res = await api.get('/users', {
        params: { role: 'resident', search: search || undefined },
      });
      if (res.data?.success) setResidents(res.data.data);
    } catch (err) {
      console.error('Error fetching residents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResidents();
  }, [search]);

  const openProfile = async (userId) => {
    setLoadingProfile(true);
    try {
      const res = await api.get(`/users/${userId}`);
      if (res.data?.success) {
        setProfileData(res.data.data);
        setSelectedUser(userId);
      }
    } catch (err) {
      alert('Error fetching resident profile');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleVerifyDoc = async (userId, proofId, status) => {
    try {
      await api.post(`/users/${userId}/verify-document`, { proofId, status });
      openProfile(userId);
      fetchResidents();
    } catch (err) {
      alert('Failed to update document verification status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">All Residents Directory</h2>
          <p className="text-xs sm:text-sm text-slate-500">View resident profiles, emergency contacts, and identity documents</p>
        </div>
        <div className="w-full sm:w-72 relative">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, mobile, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-brand-500 shadow-xs"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-4">Resident</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">ID Proofs Status</th>
                <th className="px-6 py-4">Email Status</th>
                <th className="px-6 py-4">Joined Date</th>
                <th className="px-6 py-4 text-right">Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {residents.map((res) => (
                <tr key={res._id} className="hover:bg-slate-50/60 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center font-bold text-sm">
                        {res.fullName?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{res.fullName}</p>
                        <p className="text-slate-500 text-[11px]">{res.gender || 'Resident'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-0.5">
                      <p className="text-slate-800 flex items-center gap-1.5 font-medium">
                        <Mail size={12} className="text-slate-400" /> {res.email}
                      </p>
                      <p className="text-slate-500 flex items-center gap-1.5">
                        <Phone size={12} className="text-slate-400" /> {res.mobile}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {res.isDocumentVerified ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 size={12} /> Verified ({res.identityProofs?.length || 0})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        Pending ({res.identityProofs?.length || 0})
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {res.isEmailVerified ? (
                      <span className="text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 size={13} /> Verified
                      </span>
                    ) : (
                      <span className="text-amber-600 font-medium">Unverified</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {new Date(res.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {!res.isEmailVerified && (
                        <Link
                          to={`/verify-otp?email=${encodeURIComponent(res.email)}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-[10px] transition shadow-xs"
                        >
                          <KeyRound size={11} />
                          <span>Verify OTP</span>
                        </Link>
                      )}
                      <button
                        onClick={() => openProfile(res._id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-50 text-brand-700 hover:bg-brand-100 font-bold transition cursor-pointer"
                      >
                        <Eye size={13} /> View Full
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resident Full Profile Modal */}
      {selectedUser && profileData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-600 text-white flex items-center justify-center font-bold text-base">
                  {profileData.user.fullName?.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{profileData.user.fullName}</h3>
                  <p className="text-xs text-slate-500">{profileData.user.email} • {profileData.user.mobile}</p>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              {/* Current Room & Stay */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2">Current Allocation</h4>
                {profileData.currentRoom ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <div><span className="text-slate-400">Room:</span> <strong className="text-slate-900">{profileData.currentRoom.roomNumber}</strong></div>
                    <div><span className="text-slate-400">Block:</span> <strong className="text-slate-900">{profileData.currentRoom.block?.name}</strong></div>
                    <div><span className="text-slate-400">Rent:</span> <strong className="text-brand-600">₹{profileData.currentRoom.monthlyRent.toLocaleString()}/mo</strong></div>
                  </div>
                ) : (
                  <p className="text-slate-500">No active room currently allocated (Book Later / Vacated)</p>
                )}
              </div>

              {/* Identity Documents */}
              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2">Identity Proofs</h4>
                {profileData.user.identityProofs?.length === 0 ? (
                  <p className="text-slate-400">No proofs uploaded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {profileData.user.identityProofs.map((p) => (
                      <div key={p._id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-900">{p.proofType}: {p.proofNumber || 'Uploaded'}</p>
                          <span className={`text-[10px] font-bold uppercase ${p.verificationStatus === 'verified' ? 'text-emerald-600' : 'text-amber-600'}`}>
                            Status: {p.verificationStatus}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {p.verificationStatus !== 'verified' && (
                            <button
                              onClick={() => handleVerifyDoc(profileData.user._id, p._id, 'verified')}
                              className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-bold text-[11px]"
                            >
                              Approve
                            </button>
                          )}
                          {p.verificationStatus !== 'rejected' && (
                            <button
                              onClick={() => handleVerifyDoc(profileData.user._id, p._id, 'rejected')}
                              className="px-2.5 py-1 bg-red-600 text-white rounded-lg font-bold text-[11px]"
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Emergency Contact & Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <h5 className="font-bold text-slate-700 mb-1">Emergency Contact</h5>
                  <p className="text-slate-600">{profileData.user.emergencyContact?.name || 'N/A'} ({profileData.user.emergencyContact?.relationship || 'Contact'})</p>
                  <p className="text-slate-600 font-medium">{profileData.user.emergencyContact?.mobile || 'N/A'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <h5 className="font-bold text-slate-700 mb-1">Permanent Address</h5>
                  <p className="text-slate-600">
                    {[profileData.user.address?.houseNo, profileData.user.address?.street, profileData.user.address?.villageCity, profileData.user.address?.state].filter(Boolean).join(', ') || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllResidentsManagement;
