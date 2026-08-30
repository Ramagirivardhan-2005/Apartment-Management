import React from 'react';
import { X, Printer, Download, CheckCircle, Building2, CreditCard, ShieldCheck } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const ReceiptModal = ({ payment, isOpen, onClose }) => {
  if (!isOpen || !payment) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setTextColor(79, 70, 229);
    doc.text('VIJAYA LAXMI COMPLEX', 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Official Payment Receipt & Stamped Voucher', 14, 28);
    doc.text(`Receipt No: ${payment.receiptNumber || 'N/A'}`, 14, 34);
    doc.text(`Date: ${new Date(payment.paymentDate || payment.createdAt).toLocaleDateString()}`, 14, 40);

    const tableData = [
      ['Receipt Number', payment.receiptNumber || 'N/A'],
      ['Resident Name', payment.user?.fullName || 'Resident'],
      ['Resident Email', payment.user?.email || 'N/A'],
      ['Room Number', payment.room?.roomNumber || 'N/A'],
      ['Block', payment.block?.name || 'N/A'],
      ['Payment Type', (payment.paymentType || 'Rent').toUpperCase()],
      ['Amount Paid', `Rs ${Number(payment.amount || 0).toLocaleString()}`],
      ['Late Fee', `Rs ${Number(payment.lateFeeAmount || 0).toLocaleString()}`],
      ['Total Amount', `Rs ${Number(payment.totalAmount || payment.amount || 0).toLocaleString()}`],
      ['Payment Method', (payment.paymentMethod || 'Online').toUpperCase()],
      ['Transaction ID', payment.transactionId || 'N/A'],
      ['Status', (payment.status || 'Successful').toUpperCase()],
    ];

    doc.autoTable({
      startY: 48,
      head: [['Field', 'Details']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] },
    });

    doc.save(`Receipt-${payment.receiptNumber || 'payment'}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-800 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-950/90 text-white p-6 relative border-b border-slate-800">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X size={18} />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 shadow-md">
              <Building2 size={20} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Vijaya Laxmi Complex</h3>
              <p className="text-xs text-slate-400">Official Payment Receipt & Voucher</p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-between items-center text-xs">
            <span className="text-slate-400">Receipt No: <strong className="text-brand-400 font-mono">{payment.receiptNumber}</strong></span>
            <span className="text-emerald-400 font-bold flex items-center gap-1.5 bg-emerald-950/70 border border-emerald-800/70 px-2.5 py-0.5 rounded-full text-[11px]">
              <CheckCircle size={13} /> VERIFIED & PAID
            </span>
          </div>
        </div>

        {/* Receipt Body */}
        <div className="p-6 space-y-4">
          <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800/80 space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Resident</span>
              <span className="font-bold text-slate-200">{payment.user?.fullName || 'Resident'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Room & Block</span>
              <span className="font-bold text-slate-200">
                {payment.room?.roomNumber || 'N/A'} {payment.block ? `(${payment.block.name || payment.block.code})` : ''}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Payment Category</span>
              <span className="font-bold text-slate-200 uppercase">{payment.paymentType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Payment Method</span>
              <span className="font-bold text-slate-200 uppercase flex items-center gap-1">
                <CreditCard size={13} /> {payment.paymentMethod}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Transaction ID</span>
              <span className="font-mono text-[11px] text-brand-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">{payment.transactionId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Date & Timestamp</span>
              <span className="font-mono text-slate-300">
                {new Date(payment.paymentDate || payment.createdAt).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Amount Breakdown */}
          <div className="border-t border-dashed border-slate-800 pt-4 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Base Amount</span>
              <span className="font-mono text-slate-200">₹{Number(payment.amount || 0).toLocaleString()}</span>
            </div>
            {payment.lateFeeAmount > 0 && (
              <div className="flex justify-between text-red-400 font-bold">
                <span>Late Fee Applied</span>
                <span className="font-mono">+ ₹{Number(payment.lateFeeAmount).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-extrabold text-white pt-2.5 border-t border-slate-800">
              <span>Total Paid</span>
              <span className="text-brand-400 font-mono text-base font-black">₹{Number(payment.totalAmount || payment.amount || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-950/60 p-4 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-300 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 hover:text-white transition cursor-pointer"
          >
            <Printer size={15} /> Print Receipt
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold text-white bg-brand-600 rounded-xl hover:bg-brand-500 transition shadow-lg shadow-brand-600/30 cursor-pointer"
          >
            <Download size={15} /> Download PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;
