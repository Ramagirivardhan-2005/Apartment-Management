import mongoose from 'mongoose';

const generatePaymentId = () => `PAY-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

const paymentSchema = new mongoose.Schema({
  paymentId: {
    type: String,
    unique: true,
    sparse: true,
    default: generatePaymentId,
  },
  transactionId: { type: String, required: true, unique: true },
  receiptNumber: { type: String, required: true, unique: true }, // Format: RCP-YYYY-XXXXXX

  // Razorpay Specific Fields
  razorpayOrderId: { type: String, sparse: true },
  razorpayPaymentId: { type: String, sparse: true },
  razorpaySignature: { type: String, sparse: true },

  // Resident & Registration Information
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userRegistrationId: { type: String, trim: true },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },

  // Property Association
  block: { type: mongoose.Schema.Types.ObjectId, ref: 'Block', required: true },
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  roomNumber: { type: String },

  // Financial Attributes
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  paymentDate: { type: Date, default: Date.now },
  paymentTime: { type: String },
  status: {
    type: String,
    enum: ['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED', 'successful', 'success', 'pending', 'failed'],
    default: 'SUCCESS',
    set: (v) => (v === 'successful' || v === 'success' ? 'SUCCESS' : (v ? v.toUpperCase() : 'SUCCESS')),
  },
  paymentMethod: {
    type: String,
    default: 'UPI',
  },

  // Manual Payment Receptionist Identity Logging (Section 14)
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  recordedByName: { type: String },
  receptionistId: { type: String }, // e.g. REC-1002

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String },
  isDeleted: { type: Boolean, default: false },
}, {
  timestamps: true,
});

paymentSchema.pre('validate', function (next) {
  if (!this.paymentId) {
    this.paymentId = generatePaymentId();
  }
  next();
});

export const Payment = mongoose.model('Payment', paymentSchema);
