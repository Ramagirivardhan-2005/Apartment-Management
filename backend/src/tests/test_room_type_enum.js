import 'dotenv/config';
import mongoose from 'mongoose';
import { Room } from '../models/Room.js';
import { Block } from '../models/Block.js';

const runTest = async () => {
  console.log('Testing Room creation with Four sharing...');

  try {
    const dbUrl = process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/apartment_management';
    await mongoose.connect(dbUrl, { serverSelectionTimeoutMS: 5000 }).catch(() => {
      return mongoose.connect('mongodb://127.0.0.1:27017/apartment_management');
    });

    let block = await Block.findOne({ isDeleted: false });
    if (!block) {
      block = await Block.create({ name: 'Test Block', code: 'TB', floors: 4, totalRooms: 10 });
    }

    const testRoomNumber = 'TEST-4S-' + Date.now().toString().slice(-4);
    const room = new Room({
      roomNumber: testRoomNumber,
      block: block._id,
      floor: 2,
      roomType: 'Four sharing',
      monthlyRent: 4500,
      status: 'AVAILABLE',
    });

    await room.validate();
    console.log('✅ PASS: room.validate() succeeded with roomType "Four sharing"!');
    process.exit(0);
  } catch (error) {
    console.error('❌ FAIL:', error.message);
    process.exit(1);
  }
};

runTest();
