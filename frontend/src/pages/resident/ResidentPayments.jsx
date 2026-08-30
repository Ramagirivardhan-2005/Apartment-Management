import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/common/StatusBadge';
import ReceiptModal from '../../components/common/ReceiptModal';
import RazorpayModal from '../../components/common/RazorpayModal';
import {
  CreditCard,
  AlertCircle,
  Download,
  Printer,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

const ResidentPayments = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [dues, setDues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [payingDue, setPayingDue] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState('');

  const fetchFinancials = async () => {
    try {
      const [payRes, userRes] = await Promise.all([
        api.get('/payments'),
        api.get(`/users/${user._id}`),
      ]);

      if (payRes.data?.success) setPayments(payRes.data.data);
      if (userRes.data?.success) setDues(userRes.data.data.dues || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancials();
  }, [user]);

  const handleOpenPayModal = async (due) => {
    setPayingDue(due);
    setShowRazorpayModal(true);
    const payableAmount = Number(due.totalOutstanding || (due.amountDue - due.amountPaid + (due.lateFee || 0)));

    try {
      const orderRes = await api.post('/payments/razorpay/create-order', {
        dueId: due._id,
        amount: payableAmount,
      });
      if (orderRes.data?.success) {
        setActiveOrderId(orderRes.data.data.orderId);
      }
    } catch (e) {
      console.warn('Order initialization notice:', e.message);
    }
  };

  const handleCompleteRazorpay = async (paymentData) => {
    if (!payingDue) return;
    const payableAmount = Number(payingDue.totalOutstanding || (payingDue.amountDue - payingDue.amountPaid + (payingDue.lateFee || 0)));
    setIsProcessing(true);

    try {
      const verifyRes = await api.post('/payments/razorpay/verify-payment', {
        razorpay_order_id: paymentData.razorpay_order_id || activeOrderId || `order_test_${Date.now()}`,
        razorpay_payment_id: paymentData.razorpay_payment_id || `pay_rzp_${Date.now().toString().slice(-8)}`,
        razorpay_signature: paymentData.razorpay_signature || 'simulated_valid_test_signature',
        dueId: payingDue._id,
        amount: payableAmount,
      });

      if (verifyRes.data?.success) {
        setSuccessMsg(`Payment successful! Receipt ${verifyRes.data.data.receiptNumber} generated.`);
        setShowRazorpayModal(false);
        setPayingDue(null);
        setSelectedReceipt(verifyRes.data.data);
        fetchFinancials();
      } else {
        alert(verifyRes.data?.message || 'Payment verification failed');
      }
    } catch (vErr) {
      alert(vErr.response?.data?.message || vErr.message || 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const activeDues = dues.filter((d) => d.status === 'unpaid' || d.status === 'partially_paid');

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Payments & Official Receipts</h2>
        <p className="text-xs sm:text-sm text-slate-500">Pay monthly dues online and view/download stamped receipts</p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        </div>
      )}

      {/* Outstanding Dues Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900">Outstanding Dues & Overdue Notices</h3>
        {activeDues.length === 0 ? (
          <div className="p-6 bg-emerald-50/60 rounded-3xl border border-emerald-200 flex items-center gap-3">
            <CheckCircle2 size={24} className="text-emerald-600 shrink-0" />
            <div>
              <h4 className="font-bold text-emerald-950 text-sm">All Payments Up to Date</h4>
              <p className="text-xs text-emerald-800">You have zero outstanding dues for your apartment.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {activeDues.map((due) => (
              <div
                key={due._id}
                className={`p-6 rounded-3xl border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  due.tier === 'critical'
                    ? 'bg-rose-950 text-rose-100 border-rose-900'
                    : due.tier === 'overdue_10_plus'
                    ? 'bg-red-50 text-red-950 border-red-200'
                    : due.tier === 'overdue_1_10'
                    ? 'bg-orange-50 text-orange-950 border-orange-200'
                    : 'bg-white text-slate-900 border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <StatusBadge tier={due.tier} />
                    <span className="text-xs font-semibold">Month: {due.month}</span>
                  </div>
                  <h4 className="text-lg font-extrabold">
                    Amount Payable: ₹{due.totalOutstanding?.toLocaleString()}
                  </h4>
                  <p className="text-xs opacity-90 mt-0.5">
                    Rent: ₹{due.rentAmount?.toLocaleString()}
                    {due.lateFee > 0 && ` + Late Fee: ₹${due.lateFee?.toLocaleString()}`}
                    {' • '}
                    Due Date: {new Date(due.dueDate).toLocaleDateString()}
                  </p>
                </div>

                <button
                  onClick={() => handleOpenPayModal(due)}
                  className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl transition shadow-sm self-start md:self-auto cursor-pointer"
                >
                  Pay Now
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment History & Receipts */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">Payment History & Receipts</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-4">Receipt Number</th>
                <th className="px-6 py-4">Payment Type</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Receipt Voucher</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((p) => (
                <tr key={p._id} className="hover:bg-slate-50/60 transition">
                  <td className="px-6 py-4 font-mono font-bold text-slate-900">{p.receiptNumber}</td>
                  <td className="px-6 py-4 uppercase font-semibold text-slate-700">{p.paymentType}</td>
                  <td className="px-6 py-4 font-bold text-brand-600">₹{Number(p.amount || p.totalAmount || 0).toLocaleString()}</td>
                  <td className="px-6 py-4 uppercase text-slate-600">{p.paymentMethod}</td>
                  <td className="px-6 py-4 text-slate-500">{new Date(p.paymentDate || p.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 uppercase">
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelectedReceipt(p)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition cursor-pointer"
                    >
                      <Printer size={13} /> View Voucher
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Razorpay Interactive Checkout Modal */}
      {showRazorpayModal && payingDue && (
        <RazorpayModal
          isOpen={showRazorpayModal}
          onClose={() => {
            setShowRazorpayModal(false);
            setPayingDue(null);
          }}
          amount={Number(payingDue.totalOutstanding || (payingDue.amountDue - payingDue.amountPaid + (payingDue.lateFee || 0)))}
          title={`Rent & Dues: ${payingDue.month}`}
          description={`Room ${payingDue.room?.roomNumber || 'Stay'} • Due Payment`}
          orderId={activeOrderId}
          residentName={user?.fullName}
          residentEmail={user?.email}
          residentMobile={user?.mobile}
          isProcessing={isProcessing}
          onSuccess={handleCompleteRazorpay}
        />
      )}

      {/* Receipt Modal */}
      {selectedReceipt && (
        <ReceiptModal
          payment={selectedReceipt}
          isOpen={!!selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
};

export default ResidentPayments;
