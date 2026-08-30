import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Building2,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Lock,
  QrCode,
  Smartphone,
  Wallet,
} from 'lucide-react';

const RazorpayModal = ({
  isOpen,
  onClose,
  amount = 0,
  title = 'Apartment Payment',
  description = 'Online Settle via Razorpay Test Gateway',
  orderId = '',
  residentName = '',
  residentEmail = '',
  residentMobile = '',
  onSuccess,
  isProcessing = false,
}) => {
  const [activeTab, setActiveTab] = useState('upi'); // 'upi', 'card', 'netbanking', 'wallet'
  const [upiId, setUpiId] = useState(residentEmail ? `${residentEmail.split('@')[0]}@okhdfcbank` : 'resident@okhdfcbank');
  const [cardNumber, setCardNumber] = useState('4111 2222 3333 4444');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('123');
  const [cardHolder, setCardHolder] = useState(residentName || 'Resident Payer');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [selectedWallet, setSelectedWallet] = useState('PhonePe / Paytm');

  if (!isOpen) return null;

  const handleConfirmPayment = () => {
    if (onSuccess) {
      onSuccess({
        razorpay_order_id: orderId || `order_test_${Date.now()}`,
        razorpay_payment_id: `pay_rzp_${Date.now().toString().slice(-8)}`,
        razorpay_signature: 'simulated_valid_test_signature',
        paymentMethod: activeTab.toUpperCase(),
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
        {/* Razorpay Brand Header */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white p-6 flex items-center justify-between relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>

          <div className="flex items-center gap-3.5 relative z-10">
            <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center font-extrabold text-white text-xl shadow-inner">
              ₹
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base font-extrabold tracking-tight">Razorpay Secure Checkout</h4>
                <span className="px-2 py-0.5 bg-blue-500/40 border border-blue-300/30 rounded-full text-[10px] font-bold tracking-wider uppercase">
                  Test Mode
                </span>
              </div>
              <p className="text-xs text-blue-100 opacity-90 mt-0.5">{title}</p>
            </div>
          </div>

          <button
            type="button"
            disabled={isProcessing}
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer relative z-10"
          >
            <X size={16} />
          </button>
        </div>

        {/* Amount Banner */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500 block text-[11px]">{description}</span>
            <span className="font-semibold text-slate-800">{residentName || 'Resident'} ({residentMobile || 'Account'})</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Amount</span>
            <span className="text-xl font-black text-brand-600">₹{Number(amount || 0).toLocaleString()}</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Payment Method Selector Tabs */}
          <div className="grid grid-cols-4 gap-2 border-b border-slate-100 pb-3">
            {[
              { id: 'upi', label: 'UPI / QR', icon: Smartphone },
              { id: 'card', label: 'Cards', icon: CreditCard },
              { id: 'netbanking', label: 'NetBanking', icon: Building2 },
              { id: 'wallet', label: 'Wallets', icon: Wallet },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                  activeTab === t.id
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <t.icon size={15} />
                <span className="text-[11px]">{t.label}</span>
              </button>
            ))}
          </div>

          {/* UPI TAB */}
          {activeTab === 'upi' && (
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Enter Virtual Payment Address (UPI ID)</label>
                <div className="relative">
                  <Sparkles size={14} className="absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. yourname@okhdfcbank"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 text-slate-900 font-mono focus:bg-white focus:border-brand-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                {['Google Pay', 'PhonePe', 'Paytm'].map((app) => (
                  <button
                    key={app}
                    type="button"
                    onClick={() => setUpiId(`resident@${app.toLowerCase().replace(/\s/g, '')}`)}
                    className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-center font-bold text-slate-700 text-[11px] transition cursor-pointer"
                  >
                    {app}
                  </button>
                ))}
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-emerald-800 text-[11px]">
                <QrCode size={18} className="shrink-0 text-emerald-600" />
                <span>Instant QR simulator active. Auto-authorizes in test environment.</span>
              </div>
            </div>
          )}

          {/* CARD TAB */}
          {activeTab === 'card' && (
            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Card Number</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-mono focus:bg-white focus:border-brand-500 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Expiry (MM/YY)</label>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-mono focus:bg-white focus:border-brand-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">CVV</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-mono focus:bg-white focus:border-brand-500 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Name on Card</label>
                <input
                  type="text"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:bg-white focus:border-brand-500 outline-hidden"
                />
              </div>
            </div>
          )}

          {/* NETBANKING TAB */}
          {activeTab === 'netbanking' && (
            <div className="space-y-3 pt-1 text-xs">
              <label className="block font-semibold text-slate-700">Select Bank Account</label>
              <div className="grid grid-cols-2 gap-2">
                {['HDFC Bank', 'State Bank of India', 'ICICI Bank', 'Axis Bank', 'Kotak Bank', 'Punjab National Bank'].map(
                  (b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setSelectedBank(b)}
                      className={`p-3 rounded-xl border text-left font-bold text-xs transition cursor-pointer ${
                        selectedBank === b
                          ? 'border-brand-600 bg-brand-50/70 text-brand-700'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {b}
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {/* WALLETS TAB */}
          {activeTab === 'wallet' && (
            <div className="space-y-3 pt-1 text-xs">
              <label className="block font-semibold text-slate-700">Choose Wallet Provider</label>
              <div className="grid grid-cols-2 gap-2">
                {['PhonePe Wallet', 'Paytm Wallet', 'Amazon Pay', 'Mobikwik'].map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setSelectedWallet(w)}
                    className={`p-3 rounded-xl border text-left font-bold text-xs transition cursor-pointer ${
                      selectedWallet === w
                        ? 'border-brand-600 bg-brand-50/70 text-brand-700'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Footer & Submit */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <Lock size={13} className="text-slate-500" />
              <span>Razorpay Verified Settle</span>
            </div>

            <button
              type="button"
              disabled={isProcessing}
              onClick={handleConfirmPayment}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Authorizing...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={15} />
                  <span>Pay ₹{Number(amount || 0).toLocaleString()} Now</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RazorpayModal;
