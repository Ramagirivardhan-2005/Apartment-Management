import mongoose from 'mongoose';

const parkingAllocationSchema = new mongoose.Schema({
  slot: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingSlot', required: true },
  resident: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  block: { type: mongoose.Schema.Types.ObjectId, ref: 'Block', required: true },
  vehicleType: { type: String, required: true },
  vehicleNumber: { type: String, required: true, uppercase: true, trim: true },
  vehicleModel: { type: String },
  monthlyFee: { type: Number, required: true },
  allocationDate: { type: Date, default: Date.now },
  releaseDate: { type: Date },
  status: {
    type: String,
    enum: ['active', 'released', 'cancelled'],
    default: 'active',
  },
  allocatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  releasedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
});

export const ParkingAllocation = mongoose.model('ParkingAllocation', parkingAllocationSchema);
