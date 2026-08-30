import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: { type: String },
  role: { type: String },
  action: { type: String, required: true }, // e.g. "USER_CREATED", "ROOM_ALLOCATED", "PAYMENT_PROCESSED"
  blockId: { type: mongoose.Schema.Types.ObjectId, ref: 'Block' },
  entityType: { type: String, required: true }, // "User", "Room", "Booking", "Payment", "Parking", etc.
  entityId: { type: String },
  previousValue: { type: mongoose.Schema.Types.Mixed },
  newValue: { type: mongoose.Schema.Types.Mixed },
  ipAddress: { type: String },
  userAgent: { type: String },
  timestamp: { type: Date, default: Date.now },
}, {
  timestamps: true,
});

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
