import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User.js';
import { Block } from '../models/Block.js';
import { Room } from '../models/Room.js';
import { ParkingSlot } from '../models/ParkingSlot.js';
import { RoomAllocation } from '../models/RoomAllocation.js';
import { ParkingAllocation } from '../models/ParkingAllocation.js';
import { Payment } from '../models/Payment.js';
import { Due } from '../models/Due.js';
import { Complaint } from '../models/Complaint.js';
import { Visitor } from '../models/Visitor.js';
import { Announcement } from '../models/Announcement.js';
import { Notification } from '../models/Notification.js';
import { AuditLog } from '../models/AuditLog.js';

dotenv.config();

export const cleanDatabase = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.DATABASE_URL);
    }
    console.log('[Clean Reset] Connected to MongoDB. Clearing all collections...');

    await Promise.all([
      User.deleteMany({}),
      Block.deleteMany({}),
      Room.deleteMany({}),
      ParkingSlot.deleteMany({}),
      RoomAllocation.deleteMany({}),
      ParkingAllocation.deleteMany({}),
      Payment.deleteMany({}),
      Due.deleteMany({}),
      Complaint.deleteMany({}),
      Visitor.deleteMany({}),
      Announcement.deleteMany({}),
      Notification.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);

    console.log('✅ [Clean Reset] All collections emptied successfully. Database is at 0 records.');
  } catch (error) {
    console.error('[Clean Reset Error]:', error.message);
  }
};

// If run directly via node
if (process.argv[1] && process.argv[1].includes('cleanReset.js')) {
  cleanDatabase().then(() => {
    console.log('Process exiting cleanly.');
    process.exit(0);
  });
}
