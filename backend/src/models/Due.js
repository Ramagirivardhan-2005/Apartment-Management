import mongoose from 'mongoose';

const dueSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  block: { type: mongoose.Schema.Types.ObjectId, ref: 'Block', required: true },
  allocation: { type: mongoose.Schema.Types.ObjectId, ref: 'RoomAllocation' },
  month: { type: String, required: true }, // e.g. "2026-08"
  rentAmount: { type: Number, required: true },
  parkingAmount: { type: Number, default: 0 },
  otherCharges: { type: Number, default: 0 },
  amountDue: { type: Number, required: true },
  amountPaid: { type: Number, default: 0 },
  dueDate: { type: Date, required: true },
  overdueDays: { type: Number, default: 0 },
  lateFee: { type: Number, default: 0 },
  totalOutstanding: { type: Number, required: true },
  tier: {
    type: String,
    enum: ['normal', 'due_soon', 'due_today', 'overdue_1_10', 'overdue_10_plus', 'critical'],
    default: 'normal',
  },
  status: {
    type: String,
    enum: ['unpaid', 'partially_paid', 'paid', 'waived'],
    default: 'unpaid',
  },
  lastReminderSentAt: { type: Date },
  lastWarningSentAt: { type: Date },
  reminderCount: { type: Number, default: 0 },
}, {
  timestamps: true,
});

// Helper function to calculate overdue days, late fees and color tier
dueSchema.methods.recalculate = function () {
  if (this.status === 'paid' || this.status === 'waived') {
    this.overdueDays = 0;
    this.lateFee = 0;
    this.totalOutstanding = 0;
    this.tier = 'normal';
    return;
  }

  const now = new Date();
  const due = new Date(this.dueDate);
  const diffTime = now.getTime() - due.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  const remaining = Math.max(0, this.amountDue - this.amountPaid);

  if (diffDays <= 0) {
    const daysUntilDue = Math.abs(diffDays);
    this.overdueDays = 0;
    this.lateFee = 0;
    this.totalOutstanding = remaining;
    if (daysUntilDue === 0) {
      this.tier = 'due_today';
    } else if (daysUntilDue <= 3) {
      this.tier = 'due_soon';
    } else {
      this.tier = 'normal';
    }
  } else {
    this.overdueDays = diffDays;
    // Configurable late fee rule: e.g. Rs 50/day or flat 5% per tier
    if (diffDays <= 10) {
      this.lateFee = Math.min(500, diffDays * 50);
      this.tier = 'overdue_1_10'; // Orange
    } else if (diffDays <= 30) {
      this.lateFee = 500 + (diffDays - 10) * 75;
      this.tier = 'overdue_10_plus'; // Red
    } else {
      this.lateFee = 2000 + (diffDays - 30) * 100;
      this.tier = 'critical'; // Dark Red
    }
    this.totalOutstanding = remaining + this.lateFee;
  }
};

export const Due = mongoose.model('Due', dueSchema);
