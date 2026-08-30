import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true },
  category: {
    type: String,
    enum: [
      'parking_maintenance',
      'parking_cleaning',
      'parking_closure',
      'parking_slot_changes',
      'parking_rules',
      'vehicle_verification',
      'parking_restrictions',
      'maintenance_work',
      'water_supply',
      'electricity',
      'security_alert',
      'general',
      'emergency',
    ],
    default: 'general',
  },
  targetAudience: {
    type: String,
    enum: ['all_residents', 'block', 'room', 'resident'],
    default: 'all_residents',
  },
  targetBlock: { type: mongoose.Schema.Types.ObjectId, ref: 'Block' },
  targetRoom: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  targetResident: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  priority: {
    type: String,
    enum: ['Low', 'Normal', 'High', 'Urgent'],
    default: 'Normal',
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdByName: { type: String },
  attachments: [{ type: String }],
  isActive: { type: Boolean, default: true },
  expiresAt: { type: Date },
}, {
  timestamps: true,
});

export const Announcement = mongoose.model('Announcement', announcementSchema);
