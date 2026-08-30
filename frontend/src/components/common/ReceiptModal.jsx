import React from 'react';
import { X, Printer, Download, CheckCircle, Building2, Calendar, CreditCard, ShieldCheck } from 'lucide-react';
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
    doc.setTextColor(30, 58, 138);
    doc.text('SKYLINE APARTMENTS COMPLEX', 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Official Payment Receipt', 14, 28);
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
      headStyles: { fillColor: [30, 58, 138] },
    });

    doc.save(`Receipt-${payment.receiptNumber || 'payment'}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400">
              <Building2 size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold">Skyline Apartments Complex</h3>
              <p className="text-xs text-slate-400">Official Payment Receipt & Voucher</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-400">Receipt No: <strong className="text-white">{payment.receiptNumber}</strong></span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle size={14} /> VERIFIED & PAID
            </span>
          </div>
        </div>

        {/* Receipt Body */}
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Resident</span>
              <span className="font-semibold text-slate-800">{payment.user?.fullName || 'Resident'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Room & Block</span>
              <span className="font-semibold text-slate-800">
                {payment.room?.roomNumber || 'N/A'} {payment.block ? `(${payment.block.name || payment.block.code})` : ''}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Payment Category</span>
              <span className="font-semibold text-slate-800 uppercase">{payment.paymentType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Payment Method</span>
              <span className="font-semibold text-slate-800 uppercase flex items-center gap-1">
                <CreditCard size={14} /> {payment.paymentMethod}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Transaction ID</span>
              <span className="font-mono text-xs text-slate-700 bg-slate-200 px-2 py-0.5 rounded">{payment.transactionId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date</span>
              <span className="font-medium text-slate-700">
                {new Date(payment.paymentDate || payment.createdAt).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Amount Breakdown */}
          <div className="border-t border-dashed border-slate-200 pt-4 space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Base Amount</span>
              <span>₹{Number(payment.amount || 0).toLocaleString()}</span>
            </div>
            {payment.lateFeeAmount > 0 && (
              <div className="flex justify-between text-red-600 font-medium">
                <span>Late Fee Applied</span>
                <span>+ ₹{Number(payment.lateFeeAmount).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
              <span>Total Paid</span>
              <span className="text-brand-600 text-lg">₹{Number(payment.totalAmount || payment.amount || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition shadow-sm"
          >
            <Printer size={15} /> Print
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-brand-600 rounded-xl hover:bg-brand-700 transition shadow-sm"
          >
            <Download size={15} /> Download PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;
