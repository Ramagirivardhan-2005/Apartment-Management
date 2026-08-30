import mongoose from 'mongoose';

const bookingQueueSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  requestedBlock: { type: mongoose.Schema.Types.ObjectId, ref: 'Block', required: true },
  roomType: {
    type: String,
    enum: ['Single', 'Double', 'Triple', 'Four sharing', 'Deluxe', 'Suite', 'Any'],
    default: 'Double',
  },
  ac: { type: Boolean, default: true },
  numberOfRooms: { type: Number, default: 1, min: 1, max: 4 },
  numberOfPeople: { type: Number, default: 1 },
  requestedMoveInDate: { type: Date, required: true },
  durationMonths: { type: Number, default: 6 },
  queuePosition: { type: Number, default: 1 },
  status: {
    type: String,
    enum: ['waiting', 'room_available', 'contacted', 'allocated', 'cancelled'],
    default: 'waiting',
  },
  notifiedAt: { type: Date },
  notes: { type: String },
}, {
  timestamps: true,
});

export const BookingQueue = mongoose.model('BookingQueue', bookingQueueSchema);
