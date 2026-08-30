import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  CreditCard,
  Plus,
  Receipt,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  User,
  Building2,
  Printer,
  Calendar,
  ShieldCheck,
} from 'lucide-react';

const ReceptionPayments = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [residents, setResidents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State for Manual Payment Entry (Section 14)
  const [formData, setFormData] = useState({
    residentId: '',
    roomId: '',
    amount: '',
    paymentMethod: 'Cash',
    transactionId: '',
    notes: '',
  });

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const fetchPaymentsAndData = async () => {
    try {
      const [paymentsRes, residentsRes, roomsRes] = await Promise.all([
        api.get('/payments'),
        api.get('/users', { params: { role: 'resident' } }),
        api.get('/rooms'),
      ]);

      if (paymentsRes.data?.success) setPayments(paymentsRes.data.data);
      if (residentsRes.data?.success) setResidents(residentsRes.data.data);
      if (roomsRes.data?.success) setRooms(roomsRes.data.data);
    } catch (err) {
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentsAndData();
  }, []);

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!formData.residentId || !formData.amount) {
      setError('Resident and Amount are required.');
      return;
    }

    try {
      const res = await api.post('/payments/manual', formData);
      if (res.data?.success) {
        setSuccessMsg(`Payment of ₹${Number(formData.amount).toLocaleString()} recorded successfully! Receipt: ${res.data.data.receiptNumber}`);
        setShowModal(false);
        setSelectedReceipt(res.data.data);
        setFormData({
          residentId: '',
          roomId: '',
          amount: '',
          paymentMethod: 'Cash',
          transactionId: '',
          notes: '',
        });
        fetchPaymentsAndData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record payment');
    }
  };

  const filteredPayments = payments.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.receiptNumber?.toLowerCase().includes(q) ||
      p.userName?.toLowerCase().includes(q) ||
      p.userRegistrationId?.toLowerCase().includes(q) ||
      p.transactionId?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Desk Payments &amp; Receipts</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Record manual offline resident payments (Cash, UPI, Cheque, Bank Transfer) with automatic receptionist identity capture
          </p>
        </div>

        <button
          onClick={() => {
            setError('');
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl transition shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <Plus size={16} />
          <span>Record Offline Payment</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-700 hover:text-emerald-900">
            <X size={14} />
          </button>
        </div>
      )}

      {/* RECEIPT VIEW MODAL */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <Receipt className="text-brand-600" size={24} />
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Official Payment Receipt</h3>
                  <p className="text-xs font-mono text-slate-500">{selectedReceipt.receiptNumber}</p>
                </div>
              </div>
              <button onClick={() => setSelectedReceipt(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="py-5 space-y-4 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block">Resident Name:</span>
                  <strong className="text-slate-900">{selectedReceipt.userName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Registration ID:</span>
                  <strong className="font-mono text-slate-900">{selectedReceipt.userRegistrationId || 'N/A'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Amount:</span>
                  <strong className="text-emerald-700 text-sm">₹{selectedReceipt.amount?.toLocaleString()}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Payment Mode:</span>
                  <strong className="text-slate-900">{selectedReceipt.paymentMethod}</strong>
                </div>
              </div>

              {/* Receptionist Identity Logging (Section 14) */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-blue-900 text-[11px] space-y-1">
                <span className="font-bold block text-blue-950">Logged Front-Desk Attendant:</span>
                <p>
                  Recorded by: <strong>{selectedReceipt.recordedByName || user?.fullName}</strong> ({selectedReceipt.receptionistId || user?.employeeId || 'REC-STAFF'})
                </p>
                <p className="text-blue-700">Txn ID: {selectedReceipt.transactionId}</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs"
              >
                <Printer size={14} /> Print Receipt
              </button>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3 text-xs">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by receipt no, resident name, registration ID, transaction ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2 text-slate-900 focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Receipt No</th>
                <th className="px-5 py-3.5">Resident</th>
                <th className="px-5 py-3.5">Amount</th>
                <th className="px-5 py-3.5">Mode</th>
                <th className="px-5 py-3.5">Recorded By (Receptionist)</th>
                <th className="px-5 py-3.5">Date &amp; Time</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8">
                    <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    No payment records found
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-900">
                      {p.receiptNumber}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900">{p.userName}</div>
                      <div className="text-[10px] font-mono text-slate-400">{p.userRegistrationId || 'N/A'}</div>
                    </td>
                    <td className="px-5 py-3.5 font-extrabold text-emerald-700">
                      ₹{p.amount?.toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded-md font-semibold text-[11px] bg-slate-100 text-slate-700 border border-slate-200">
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {p.recordedByName ? (
                        <div>
                          <span className="font-semibold text-slate-900">{p.recordedByName}</span>
                          <span className="text-[10px] font-mono text-blue-600 block">
                            {p.receptionistId || 'REC-STAFF'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Online (Razorpay)</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      <div>{new Date(p.paymentDate || p.createdAt).toLocaleDateString()}</div>
                      <div className="text-[10px]">{p.paymentTime || ''}</div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedReceipt(p)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] transition cursor-pointer"
                      >
                        Receipt
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Payment Entry Modal (Section 14) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Record Offline Payment</h3>
                <p className="text-xs text-slate-500">
                  Recorded under Receptionist: <strong>{user?.fullName}</strong> ({user?.employeeId || 'REC'})
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Select Resident *</label>
                <select
                  required
                  value={formData.residentId}
                  onChange={(e) => setFormData({ ...formData, residentId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-brand-500"
                >
                  <option value="">-- Choose Resident --</option>
                  {residents.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.fullName} ({r.registrationId || r.mobile})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Associate Room (Optional)</label>
                <select
                  value={formData.roomId}
                  onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-brand-500"
                >
                  <option value="">-- No Room / General Payment --</option>
                  {rooms.map((rm) => (
                    <option key={rm._id} value={rm._id}>
                      Room {rm.roomNumber} ({rm.block?.name || 'Block'}) - ₹{rm.monthlyRent?.toLocaleString()}/mo
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    placeholder="e.g. 15000"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Payment Method</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-brand-500"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Transaction ID / Ref No</label>
                <input
                  type="text"
                  placeholder="e.g. UPI-987654 or CHEQ-1049"
                  value={formData.transactionId}
                  onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl transition"
                >
                  Record Payment &amp; Issue Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceptionPayments;
