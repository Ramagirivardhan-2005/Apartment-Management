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
import { hashOtp } from '../utils/otpUtils.js';

const API_BASE = 'http://localhost:5000/api';

const runTest = async () => {
  console.log('Testing Resident View of Booked Room and Details...');

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

    // 2. Create a test resident
    const ts = Date.now().toString().slice(-4);
    const block = await Block.findOne({ isDeleted: false });

    let resident = await User.create({
      fullName: `Test Resident ${ts}`,
      email: `resident.${ts}@test.com`,
      mobile: `9899${ts}${Math.floor(100 + Math.random() * 900)}`,
      password: 'Password@123',
      role: 'resident',
      assignedBlock: block._id,
      status: 'active',
      isEmailVerified: true,
    });

    // 3. Create a room
    const room = await Room.create({
      roomNumber: `RES-VIEW-${ts}`,
      block: block._id,
      floor: 2,
      roomType: 'Deluxe',
      monthlyRent: 15000,
      isAirConditioned: true,
      status: 'AVAILABLE',
    });

    // 4. Receptionist Books Room for this Resident
    const bookRes = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        userId: resident._id,
        roomIds: [room._id],
        moveInDate: new Date().toISOString(),
        expectedMoveOutDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
        durationMonths: 6,
        numberOfPeople: 2,
        occupants: [
          { fullName: resident.fullName, mobile: resident.mobile, relationship: 'Self' },
          { fullName: `Spouse of ${resident.fullName}`, mobile: '9888888888', relationship: 'Spouse' },
        ],
        paymentDetails: { paymentMethod: 'upi', amountPaid: 15000 },
      }),
    });
    const bookData = await bookRes.json();
    console.log('Book Room Response:', bookRes.status, bookData.message);

    if (bookRes.status !== 201) {
      throw new Error(`Booking failed: ${bookData.message}`);
    }

    // 5. Resident Logs in and fetches Profile (`GET /api/users/:id`)
    const resLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: resident.email, password: 'Password@123' }),
    });
    const resLoginData = await resLoginRes.json();

    resident = await User.findById(resident._id);
    resident.loginOtpHash = hashOtp('123456');
    resident.loginOtpExpiresAt = new Date(Date.now() + 600000);
    await resident.save();

    const resVerifyRes = await fetch(`${API_BASE}/auth/verify-login-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verificationToken: resLoginData.verificationToken, otp: '123456' }),
    });
    const resVerifyData = await resVerifyRes.json();
    const residentToken = resVerifyData.token;

    // Fetch Resident Profile
    const profileRes = await fetch(`${API_BASE}/users/${resident._id}`, {
      headers: { Authorization: `Bearer ${residentToken}` },
    });
    const profileData = await profileRes.json();

    console.log('\n--- Resident Profile Data Verification ---');
    console.log('profileRes:', profileRes.status, profileData);
    const u = profileData.data;

    console.log('User fullName:', u.fullName);
    console.log('Current Room:', u.currentRoom?.roomNumber, u.currentRoom?.roomType, 'Rent:', u.currentRoom?.monthlyRent);
    console.log('Room Allocations count:', u.roomAllocations?.length);
    console.log('Bookings count:', u.bookings?.length);
    console.log('Dues count:', u.dues?.length);
    console.log('Payments count:', u.payments?.length);

    if (!u.currentRoom || u.currentRoom.roomNumber !== room.roomNumber) {
      throw new Error('Resident currentRoom not populated properly');
    }
    if (!u.roomAllocations || u.roomAllocations.length === 0) {
      throw new Error('Resident roomAllocations not populated');
    }
    if (!u.bookings || u.bookings.length === 0) {
      throw new Error('Resident bookings not populated');
    }
    if (!u.payments || u.payments.length === 0) {
      throw new Error('Resident payments not populated');
    }

    console.log('\n✅ ALL VERIFICATIONS PASSED: Room booking details are fully showing to the user!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
};

runTest();
