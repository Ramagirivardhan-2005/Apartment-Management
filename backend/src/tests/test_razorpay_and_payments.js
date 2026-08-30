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
import { Due } from '../models/Due.js';
import { hashOtp } from '../utils/otpUtils.js';

const API_BASE = 'http://localhost:5000/api';

const runTest = async () => {
  console.log('Testing Razorpay Flow & Multiple Consecutive Payments for Index Fix...');

  try {
    await mongoose.connect(process.env.DATABASE_URL);

    const ts = Date.now().toString().slice(-4);
    const block = await Block.findOne({ isDeleted: false });

    // 1. Create a resident
    let resident = await User.create({
      fullName: `Razorpay User ${ts}`,
      email: `razorpay.${ts}@test.com`,
      mobile: `97${ts}${Math.floor(1000 + Math.random() * 9000)}`,
      password: 'Password@123',
      role: 'resident',
      assignedBlock: block._id,
      status: 'active',
      isEmailVerified: true,
    });

    const room = await Room.create({
      roomNumber: `RZP-${ts}`,
      block: block._id,
      floor: 2,
      roomType: 'Double',
      monthlyRent: 15000,
      status: 'AVAILABLE',
    });

    const due = await Due.create({
      user: resident._id,
      room: room._id,
      block: block._id,
      month: '2026-08',
      rentAmount: 15000,
      amountDue: 15000,
      amountPaid: 0,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      totalOutstanding: 15000,
      status: 'unpaid',
    });

    // Resident Login
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: resident.email, password: 'Password@123' }),
    });
    const loginData = await loginRes.json();

    resident = await User.findById(resident._id);
    resident.loginOtpHash = hashOtp('123456');
    resident.loginOtpExpiresAt = new Date(Date.now() + 600000);
    await resident.save();

    const verifyRes = await fetch(`${API_BASE}/auth/verify-login-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verificationToken: loginData.verificationToken, otp: '123456' }),
    });
    const verifyData = await verifyRes.json();
    const token = verifyData.token;

    // Test 1: Razorpay Create Order for Room Booking
    console.log('\n--- 1. Testing Razorpay Order for Room Booking ---');
    const orderRes = await fetch(`${API_BASE}/payments/razorpay/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ roomId: room._id }),
    });
    const orderData = await orderRes.json();
    console.log('Room Order Response:', orderData.success, 'OrderId:', orderData.data?.orderId);
    if (!orderData.success) throw new Error('Razorpay room order creation failed');

    // Test 2: Razorpay Verify Payment for Room Booking
    console.log('\n--- 2. Testing Razorpay Verify for Room Booking ---');
    const verifyPayRes = await fetch(`${API_BASE}/payments/razorpay/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        razorpay_order_id: orderData.data.orderId,
        razorpay_payment_id: `pay_test_${ts}_01`,
        razorpay_signature: 'simulated_valid_test_signature',
        roomId: room._id,
      }),
    });
    const verifyPayData = await verifyPayRes.json();
    console.log('Room Verify Response:', verifyPayData.success, 'Receipt:', verifyPayData.data?.receiptNumber);
    if (!verifyPayData.success) throw new Error('Razorpay room payment verification failed');

    // Test 3: Razorpay Create Order for Due Payment
    console.log('\n--- 3. Testing Razorpay Order for Due Payment ---');
    const dueOrderRes = await fetch(`${API_BASE}/payments/razorpay/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ dueId: due._id, amount: 7500 }),
    });
    const dueOrderData = await dueOrderRes.json();
    console.log('Due Order Response:', dueOrderData.success, 'OrderId:', dueOrderData.data?.orderId);
    if (!dueOrderData.success) throw new Error('Razorpay due order creation failed');

    // Test 4: Razorpay Verify Payment for Due Payment
    console.log('\n--- 4. Testing Razorpay Verify for Due Payment ---');
    const verifyDuePayRes = await fetch(`${API_BASE}/payments/razorpay/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        razorpay_order_id: dueOrderData.data.orderId,
        razorpay_payment_id: `pay_test_${ts}_02`,
        razorpay_signature: 'simulated_valid_test_signature',
        dueId: due._id,
        amount: 7500,
      }),
    });
    const verifyDuePayData = await verifyDuePayRes.json();
    console.log('Due Verify Response:', verifyDuePayData.success, 'Receipt:', verifyDuePayData.data?.receiptNumber);
    if (!verifyDuePayData.success) throw new Error('Razorpay due payment verification failed');

    // Test 5: Multiple Consecutive Standard Payments (To test unique paymentId index)
    console.log('\n--- 5. Testing Multiple Consecutive Payments ---');
    for (let i = 1; i <= 3; i++) {
      const pRes = await fetch(`${API_BASE}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          dueId: due._id,
          amount: 2500,
          paymentMethod: 'UPI',
        }),
      });
      const pData = await pRes.json();
      console.log(`Payment #${i} Status:`, pRes.status, 'Receipt:', pData.data?.receiptNumber, 'paymentId:', pData.data?.paymentId);
      if (pRes.status !== 201) throw new Error(`Consecutive payment #${i} failed: ${pData.message}`);
    }

    console.log('\n🎉 ALL RAZORPAY & PAYMENT INDEX FIX TESTS PASSED (100%)!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
};

runTest();
