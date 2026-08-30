import mongoose from 'mongoose';

const securityLogSchema = new mongoose.Schema({
  logType: {
    type: String,
    enum: [
      'visitor_entry',
      'visitor_exit',
      'resident_entry',
      'resident_exit',
      'vehicle_entry',
      'vehicle_exit',
      'delivery',
      'incident',
    ],
    required: true,
  },
  resident: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  residentName: { type: String },
  visitor: { type: mongoose.Schema.Types.ObjectId, ref: 'Visitor' },
  visitorName: { type: String },
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  roomNumber: { type: String },
  block: { type: mongoose.Schema.Types.ObjectId, ref: 'Block' },
  vehicleNumber: { type: String, uppercase: true, trim: true },
  actionTime: { type: Date, default: Date.now },
  securityStaff: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  securityStaffName: { type: String },
  notes: { type: String },
}, {
  timestamps: true,
});

export const SecurityLog = mongoose.model('SecurityLog', securityLogSchema);
