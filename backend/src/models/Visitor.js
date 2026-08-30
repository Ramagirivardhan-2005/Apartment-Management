import mongoose from 'mongoose';

const visitorSchema = new mongoose.Schema({
  visitorName: { type: String, required: true, trim: true },
  mobile: { type: String, required: true, trim: true },
  purpose: { type: String, required: true },
  resident: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  residentName: { type: String },
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  roomNumber: { type: String },
  block: { type: mongoose.Schema.Types.ObjectId, ref: 'Block', required: true },
  numberOfVisitors: { type: Number, default: 1, min: 1 },
  idProofType: {
    type: String,
    enum: ['Aadhaar', 'Driving License', 'Passport', 'Voter ID', 'Company ID', 'Other', 'None'],
    default: 'None',
  },
  idProofNumber: { type: String },
  vehicleNumber: { type: String, uppercase: true, trim: true },
  entryTime: { type: Date, default: Date.now },
  expectedExitTime: { type: Date },
  actualExitTime: { type: Date },
  visitDurationMinutes: { type: Number },
  status: {
    type: String,
    enum: ['expected', 'inside', 'checked_out', 'cancelled'],
    default: 'inside',
  },
  recordedBySecurity: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  checkedOutBySecurity: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String },
}, {
  timestamps: true,
});

export const Visitor = mongoose.model('Visitor', visitorSchema);
