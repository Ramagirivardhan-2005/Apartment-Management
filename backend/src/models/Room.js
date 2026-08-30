import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  roomNumber: { type: String, required: true, trim: true },
  block: { type: mongoose.Schema.Types.ObjectId, ref: 'Block', required: true },
  floor: { type: Number, required: true },
  roomType: {
    type: String,
    enum: [
      'Single',
      'Double',
      'Triple',
      'Four sharing',
      'Deluxe',
      'Suite',
      'Single Room',
      '1BHK',
      '2BHK',
      '3BHK',
      '4BHK',
      'Studio',
      'Penthouse',
      '1 Sharing',
      '2 Sharing',
      '3 Sharing',
      '4 Sharing',
    ],
    default: 'Double',
  },
  areaSqFt: { type: Number, default: 850 },
  bedrooms: { type: Number, default: 2 },
  monthlyRent: { type: Number, required: true },
  securityDeposit: { type: Number, default: 0 },
  status: {
    type: String,
    enum: [
      'AVAILABLE',
      'RESERVED',
      'ALLOCATED',
      'OCCUPIED',
      'MAINTENANCE',
      'UNAVAILABLE',
      'available',
      'reserved',
      'allocated',
      'occupied',
      'maintenance',
      'unavailable',
    ],
    default: 'AVAILABLE',
    set: (v) => (v ? v.toUpperCase() : 'AVAILABLE'),
  },
  currentResident: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isAirConditioned: { type: Boolean, default: true },
  furnishingStatus: {
    type: String,
    enum: ['Fully Furnished', 'Semi Furnished', 'Unfurnished'],
    default: 'Semi Furnished',
  },
  amenities: [{ type: String }],
  isDeleted: { type: Boolean, default: false },
}, {
  timestamps: true,
});

// Ensure room numbers are unique within the same block
roomSchema.index({ block: 1, roomNumber: 1 }, { unique: true });

export const Room = mongoose.model('Room', roomSchema);
