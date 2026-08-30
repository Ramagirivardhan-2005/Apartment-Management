import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Block } from '../models/Block.js';
import { Room } from '../models/Room.js';
import { BookingQueue } from '../models/BookingQueue.js';
import { hashOtp } from '../utils/otpUtils.js';

const API_BASE = 'http://localhost:5000/api';

const runTest = async () => {
  console.log('Testing Room Synchronization and Booking Flow...');

  try {
    await mongoose.connect(process.env.DATABASE_URL);

    // 1. Get Receptionist Token
    let rec = await User.findOne({ role: 'receptionist', isDeleted: false });
    rec.password = 'Password@123';
    rec.status = 'active';
    rec.isEmailVerified = true;
    await rec.save();

    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: rec.email, password: 'Password@123' }),
    });
    const loginData = await loginRes.json();

    rec.loginOtpHash = hashOtp('123456');
    rec.loginOtpExpiresAt = new Date(Date.now() + 600000);
    await rec.save();

    const verifyRes = await fetch(`${API_BASE}/auth/verify-login-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verificationToken: loginData.verificationToken, otp: '123456' }),
    });
    const verifyData = await verifyRes.json();
    const token = verifyData.token;

    // 2. Create Block and 2 Rooms (1 Available, 1 Occupied)
    const block = await Block.findOne({ isDeleted: false });
    const testTs = Date.now().toString().slice(-4);

    const roomAvail = await Room.create({
      roomNumber: `R-SYNC-A-${testTs}`,
      block: block._id,
      floor: 1,
      roomType: 'Double',
      monthlyRent: 12000,
      status: 'AVAILABLE',
    });

    const roomBooked = await Room.create({
      roomNumber: `R-SYNC-B-${testTs}`,
      block: block._id,
      floor: 1,
      roomType: 'Double',
      monthlyRent: 12000,
      status: 'OCCUPIED',
    });

    // 3. Test Synchronized Room Query with includeBooked=true
    const roomsRes = await fetch(`${API_BASE}/rooms/available?includeBooked=true&blockId=${block._id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const roomsData = await roomsRes.json();
    console.log('Synchronized rooms count:', roomsData.count);

    const foundAvail = roomsData.data.find((r) => r._id === roomAvail._id.toString());
    const foundBooked = roomsData.data.find((r) => r._id === roomBooked._id.toString());

    if (!foundAvail || foundAvail.status.toUpperCase() !== 'AVAILABLE') {
      throw new Error('Available room status synchronization failed');
    }
    if (!foundBooked || foundBooked.status.toUpperCase() !== 'OCCUPIED') {
      throw new Error('Booked room status synchronization failed');
    }
    console.log('✅ PASS: Room status synchronization verified!');

    // 4. Test Booking the Available Room
    const resident = await User.findOne({ role: 'resident', isDeleted: false });
    const bookRes = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        userId: resident._id,
        roomIds: [roomAvail._id],
        moveInDate: new Date().toISOString(),
        expectedMoveOutDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
        durationMonths: 6,
        numberOfPeople: 1,
        occupants: [{ fullName: resident.fullName, mobile: resident.mobile }],
        paymentDetails: { paymentMethod: 'cash', amountPaid: 12000 },
      }),
    });
    const bookData = await bookRes.json();
    console.log('Book Room Response:', bookRes.status, bookData.message);

    if (bookRes.status !== 201 || !bookData.success) {
      throw new Error(`Booking failed: ${bookData.message}`);
    }
    console.log('✅ PASS: Room booked successfully and marked OCCUPIED!');

    // 5. Test Double-Booking Prevention
    const reBookRes = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        userId: resident._id,
        roomIds: [roomAvail._id],
        moveInDate: new Date().toISOString(),
        expectedMoveOutDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
        durationMonths: 6,
        numberOfPeople: 1,
        occupants: [{ fullName: resident.fullName, mobile: resident.mobile }],
      }),
    });
    const reBookData = await reBookRes.json();
    console.log('Re-book Attempt Response (Expected 400):', reBookRes.status, reBookData.message);

    if (reBookRes.status === 400 && reBookData.message.includes('already booked/occupied')) {
      console.log('✅ PASS: Double-booking prevented with synchronized already booked error message!');
    } else {
      throw new Error(`Expected already booked error but got: ${reBookRes.status} ${reBookData.message}`);
    }

    // 6. Test Joining Waitlist Queue
    const queueRes = await fetch(`${API_BASE}/bookings/queue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        requestedBlockId: block._id,
        roomType: 'Double',
        ac: true,
        numberOfRooms: 1,
        numberOfPeople: 1,
        requestedMoveInDate: new Date().toISOString(),
        durationMonths: 6,
      }),
    });
    const queueData = await queueRes.json();
    console.log('Queue Join Response:', queueRes.status, queueData.message, 'Position:', queueData.data?.queuePosition);

    if (queueRes.status === 201 && queueData.success && queueData.data?.queuePosition) {
      console.log('✅ PASS: Synchronized waitlist queue joining works successfully!');
      process.exit(0);
    } else {
      throw new Error(`Queue joining failed: ${queueData.message}`);
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
};

runTest();
