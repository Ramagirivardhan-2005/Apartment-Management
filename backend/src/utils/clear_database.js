import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User.js';
import { Block } from '../models/Block.js';
import { Room } from '../models/Room.js';
import { RoomAllocation } from '../models/RoomAllocation.js';
import { Booking } from '../models/Booking.js';
import { BookingQueue } from '../models/BookingQueue.js';
import { ParkingSlot } from '../models/ParkingSlot.js';
import { ParkingAllocation } from '../models/ParkingAllocation.js';
import { Payment } from '../models/Payment.js';
import { Due } from '../models/Due.js';
import { Complaint } from '../models/Complaint.js';
import { Announcement } from '../models/Announcement.js';
import { Notification } from '../models/Notification.js';
import { AuditLog } from '../models/AuditLog.js';
import { Visitor } from '../models/Visitor.js';
import { SecurityLog } from '../models/SecurityLog.js';

dotenv.config();

const clearDatabase = async () => {
  console.log('\n====================================================');
  console.log('🧹 CLEARING ALL MONGODB ATLAS COLLECTIONS (FRESH RESET)');
  console.log('====================================================\n');

  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log('[Database] Connected to MongoDB Atlas.');

    const collections = [
      { name: 'Users', model: User },
      { name: 'Blocks', model: Block },
      { name: 'Rooms', model: Room },
      { name: 'RoomAllocations', model: RoomAllocation },
      { name: 'Bookings', model: Booking },
      { name: 'BookingQueue', model: BookingQueue },
      { name: 'ParkingSlots', model: ParkingSlot },
      { name: 'ParkingAllocations', model: ParkingAllocation },
      { name: 'Payments', model: Payment },
      { name: 'Dues', model: Due },
      { name: 'Complaints', model: Complaint },
      { name: 'Announcements', model: Announcement },
      { name: 'Notifications', model: Notification },
      { name: 'AuditLogs', model: AuditLog },
      { name: 'Visitors', model: Visitor },
      { name: 'SecurityLogs', model: SecurityLog },
    ];

    for (const col of collections) {
      const res = await col.model.deleteMany({});
      console.log(`🗑️ Cleared collection: ${col.name} (${res.deletedCount} documents removed)`);
    }

    const remainingSuperAdmins = await User.countDocuments({ role: 'super_admin', isDeleted: false });
    const totalRemainingUsers = await User.countDocuments({});

    console.log('\n====================================================');
    console.log(`✨ RESET COMPLETE: Total users remaining: ${totalRemainingUsers}`);
    console.log(`🔐 Zero-Data State Confirmed: setupRequired = ${remainingSuperAdmins === 0}`);
    console.log('====================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to clear database:', error);
    process.exit(1);
  }
};

clearDatabase();
