import mongoose from 'mongoose';

const complaintUpdateSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['NEW', 'ACKNOWLEDGED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'CLOSED'],
    required: true,
  },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedByName: { type: String },
  note: { type: String },
  timestamp: { type: Date, default: Date.now },
});

const complaintSchema = new mongoose.Schema({
  complaintId: { type: String, required: true, unique: true },
  resident: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  block: { type: mongoose.Schema.Types.ObjectId, ref: 'Block', required: true },
  parkingSlot: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingSlot' },
  category: {
    type: String,
    enum: [
      'parking_slot_occupied',
      'wrong_vehicle_parked',
      'unauthorized_parking',
      'parking_damaged',
      'parking_gate_problem',
      'parking_light_problem',
      'parking_cleanliness_problem',
      'vehicle_blocking_access',
      'room_maintenance',
      'electrical',
      'plumbing',
      'noise_complaint',
      'security_concern',
      'other',
    ],
    required: true,
  },
  description: { type: String, required: true },
  vehicleNumber: { type: String },
  photos: [{ type: String }],
  status: {
    type: String,
    enum: ['NEW', 'ACKNOWLEDGED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'CLOSED'],
    default: 'NEW',
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium',
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedToName: { type: String },
  adminNotes: { type: String },
  resolutionNotes: { type: String },
  resolvedAt: { type: Date },
  closedAt: { type: Date },
  updates: [complaintUpdateSchema],
}, {
  timestamps: true,
});

export const Complaint = mongoose.model('Complaint', complaintSchema);
