import mongoose from 'mongoose';

const occupantSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  mobile: { type: String },
  dob: { type: Date },
  age: { type: Number },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  relationship: { type: String },
  proofType: { type: String, enum: ['Aadhaar', 'Passport', 'Driving License', 'Voter ID', 'PAN', 'Other'] },
  proofNumber: { type: String },
  proofUrl: { type: String },
  verificationStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'verified' },
});

const roomAllocationSchema = new mongoose.Schema({
  allocationId: {
    type: String,
    required: true,
    unique: true,
    default: () => `ALC-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`,
  },
  resident: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  block: { type: mongoose.Schema.Types.ObjectId, ref: 'Block', required: true },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  moveInDate: { type: Date, required: true, default: Date.now },
  expectedMoveOutDate: { type: Date },
  actualMoveOutDate: { type: Date },
  durationMonths: { type: Number, required: true, default: 6 },
  occupants: [occupantSchema],
  monthlyRent: { type: Number, required: true },
  securityDeposit: { type: Number, required: true, default: 0 },
  status: {
    type: String,
    enum: ['active', 'vacated', 'terminated'],
    default: 'active',
  },
  allocatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  vacatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  vacateReason: { type: String },
}, {
  timestamps: true,
});

roomAllocationSchema.pre('validate', function (next) {
  if (!this.allocationId) {
    this.allocationId = `ALC-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
  }
  if (!this.moveInDate) {
    this.moveInDate = new Date();
  }
  if (this.securityDeposit === undefined || this.securityDeposit === null) {
    this.securityDeposit = 0;
  }
  if (!this.resident && this.user) {
    this.resident = this.user;
  }
  next();
});

export const RoomAllocation = mongoose.model('RoomAllocation', roomAllocationSchema);
