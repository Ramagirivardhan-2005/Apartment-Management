import mongoose from 'mongoose';

const parkingSlotSchema = new mongoose.Schema({
  slotNumber: { type: String, required: true, trim: true },
  block: { type: mongoose.Schema.Types.ObjectId, ref: 'Block', required: true },
  floorArea: { type: String, default: 'Ground Floor' },
  parkingType: {
    type: String,
    enum: ['Covered', 'Open', 'Basement', 'Stilt'],
    default: 'Covered',
  },
  vehicleType: {
    type: String,
    enum: ['4-Wheeler', '2-Wheeler', 'EV', 'Bicycle'],
    default: '4-Wheeler',
  },
  monthlyFee: { type: Number, default: 1500 },
  status: {
    type: String,
    enum: ['AVAILABLE', 'RESERVED', 'ALLOCATED', 'OCCUPIED', 'MAINTENANCE'],
    default: 'AVAILABLE',
  },
  assignedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  vehicleNumber: { type: String, trim: true },
  isDeleted: { type: Boolean, default: false },
}, {
  timestamps: true,
});

parkingSlotSchema.index({ block: 1, slotNumber: 1 }, { unique: true });

export const ParkingSlot = mongoose.model('ParkingSlot', parkingSlotSchema);
