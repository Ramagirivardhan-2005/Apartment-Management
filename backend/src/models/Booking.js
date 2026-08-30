import mongoose from 'mongoose';

const bookingOccupantSchema = new mongoose.Schema({
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

const bookingRoomSchema = new mongoose.Schema({
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  roomNumber: { type: String },
  roomType: { type: String },
  ac: { type: Boolean },
  monthlyRent: { type: Number, required: true },
  securityDeposit: { type: Number, default: 0 },
});

const bookingSchema = new mongoose.Schema({
  bookingId: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  block: { type: mongoose.Schema.Types.ObjectId, ref: 'Block', required: true },
  rooms: [bookingRoomSchema],
  roomCount: {
    type: Number,
    required: true,
    min: 1,
    max: [4, 'You can book a maximum of 4 rooms at a time.'],
  },
  moveInDate: { type: Date, required: true },
  expectedMoveOutDate: { type: Date, required: true },
  durationMonths: { type: Number, required: true, default: 6 },
  numberOfPeople: { type: Number, required: true, default: 1 },
  roomType: { type: String, default: 'Double' },
  ac: { type: Boolean, default: true },
  occupants: [bookingOccupantSchema],
  totalMonthlyRent: { type: Number, required: true },
  totalSecurityDeposit: { type: Number, default: 0 },
  totalStayAmount: { type: Number, required: true },
  advanceRequired: { type: Number, required: true },
  advancePaid: { type: Number, default: 0 },
  remainingBalance: { type: Number, default: 0 },
  dueDate: { type: Date },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'refunded'],
    default: 'pending',
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'allocated', 'cancelled'],
    default: 'pending',
  },
  requireParking: { type: Boolean, default: false },
  allocatedParkingSlots: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ParkingSlot' }],
  bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String },
}, {
  timestamps: true,
});

export const Booking = mongoose.model('Booking', bookingSchema);
