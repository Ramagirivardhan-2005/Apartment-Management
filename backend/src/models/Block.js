import mongoose from 'mongoose';

const blockSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  address: { type: String, trim: true },
  floors: { type: Number, default: 4 },
  totalRooms: { type: Number, default: 0 },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  receptionists: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  status: {
    type: String,
    enum: ['active', 'maintenance', 'inactive'],
    default: 'active',
  },
  isDeleted: { type: Boolean, default: false },
}, {
  timestamps: true,
});

export const Block = mongoose.model('Block', blockSchema);
