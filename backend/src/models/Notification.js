import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: [
      'account_registered',
      'email_verified',
      'account_activated',
      'room_booking_confirmed',
      'room_allocated',
      'payment_successful',
      'payment_received',
      'payment_failed',
      'payment_due',
      'payment_overdue',
      'payment_overdue_10days',
      'late_fee_applied',
      'parking_allocated',
      'parking_payment',
      'parking_complaint',
      'complaint_status_update',
      'parking_announcement',
      'visitor_arrived',
      'booking_queue_available',
      'password_reset',
      'system',
    ],
    default: 'system',
  },
  isRead: { type: Boolean, default: false },
  link: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed },
}, {
  timestamps: true,
});

export const Notification = mongoose.model('Notification', notificationSchema);
