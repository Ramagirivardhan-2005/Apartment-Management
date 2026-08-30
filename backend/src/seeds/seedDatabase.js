import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Block } from '../models/Block.js';
import { Room } from '../models/Room.js';
import { RoomAllocation } from '../models/RoomAllocation.js';
import { ParkingSlot } from '../models/ParkingSlot.js';
import { ParkingAllocation } from '../models/ParkingAllocation.js';
import { Payment } from '../models/Payment.js';
import { Due } from '../models/Due.js';
import { Visitor } from '../models/Visitor.js';
import { SecurityLog } from '../models/SecurityLog.js';
import { Complaint } from '../models/Complaint.js';
import { Announcement } from '../models/Announcement.js';
import { Notification } from '../models/Notification.js';
import { AuditLog } from '../models/AuditLog.js';
import { Booking } from '../models/Booking.js';
import { BookingQueue } from '../models/BookingQueue.js';

dotenv.config();

const seed = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await mongoose.connect(process.env.DATABASE_URL);
    console.log('[Seed] Connected to MongoDB.');

    // Clear existing data
    console.log('[Seed] Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Block.deleteMany({}),
      Room.deleteMany({}),
      RoomAllocation.deleteMany({}),
      ParkingSlot.deleteMany({}),
      ParkingAllocation.deleteMany({}),
      Payment.deleteMany({}),
      Due.deleteMany({}),
      Visitor.deleteMany({}),
      SecurityLog.deleteMany({}),
      Complaint.deleteMany({}),
      Announcement.deleteMany({}),
      Notification.deleteMany({}),
      AuditLog.deleteMany({}),
      Booking.deleteMany({}),
      BookingQueue.deleteMany({}),
    ]);

    const defaultPassword = 'Password123!';

    // 1. Create Blocks
    console.log('[Seed] Creating Blocks...');
    const blockA = await Block.create({
      name: 'Block A - Ruby Tower',
      code: 'BLK-A',
      address: 'North Wing, Skyline Apartments, MG Road, Bangalore',
      floors: 5,
      totalRooms: 10,
      totalParkingSlots: 8,
      status: 'active',
    });

    const blockB = await Block.create({
      name: 'Block B - Sapphire Tower',
      code: 'BLK-B',
      address: 'East Wing, Skyline Apartments, MG Road, Bangalore',
      floors: 4,
      totalRooms: 8,
      totalParkingSlots: 6,
      status: 'active',
    });

    const blockC = await Block.create({
      name: 'Block C - Emerald Tower',
      code: 'BLK-C',
      address: 'West Wing, Skyline Apartments, MG Road, Bangalore',
      floors: 4,
      totalRooms: 8,
      totalParkingSlots: 6,
      status: 'active',
    });

    // 2. Create Primary Users (All 5 Roles)
    console.log('[Seed] Creating Role Accounts...');
    const superAdmin = await User.create({
      fullName: 'Alexander Vance',
      email: 'superadmin@apartment.com',
      mobile: '9876543210',
      password: defaultPassword,
      role: 'super_admin',
      employeeId: 'EMP-SA01',
      status: 'active',
      isEmailVerified: true,
      isDocumentVerified: true,
      address: { city: 'Bangalore', state: 'Karnataka', country: 'India' },
    });

    const blockAdminA = await User.create({
      fullName: 'Marcus Sterling',
      email: 'blockadmin.a@apartment.com',
      mobile: '9876543211',
      password: defaultPassword,
      role: 'block_admin',
      employeeId: 'EMP-BA01',
      assignedBlock: blockA._id,
      status: 'active',
      isEmailVerified: true,
      isDocumentVerified: true,
      address: { city: 'Bangalore', state: 'Karnataka', country: 'India' },
    });

    const blockAdminB = await User.create({
      fullName: 'Elena Rostova',
      email: 'blockadmin.b@apartment.com',
      mobile: '9876543212',
      password: defaultPassword,
      role: 'block_admin',
      employeeId: 'EMP-BA02',
      assignedBlock: blockB._id,
      status: 'active',
      isEmailVerified: true,
      isDocumentVerified: true,
      address: { city: 'Bangalore', state: 'Karnataka', country: 'India' },
    });

    const blockAdminC = await User.create({
      fullName: 'David Chen',
      email: 'blockadmin.c@apartment.com',
      mobile: '9876543213',
      password: defaultPassword,
      role: 'block_admin',
      employeeId: 'EMP-BA03',
      assignedBlock: blockC._id,
      status: 'active',
      isEmailVerified: true,
      isDocumentVerified: true,
      address: { city: 'Bangalore', state: 'Karnataka', country: 'India' },
    });

    // Assign admins to blocks
    blockA.admin = blockAdminA._id;
    await blockA.save();
    blockB.admin = blockAdminB._id;
    await blockB.save();
    blockC.admin = blockAdminC._id;
    await blockC.save();

    const receptionist = await User.create({
      fullName: 'Priya Sharma',
      email: 'receptionist@apartment.com',
      mobile: '9876543214',
      password: defaultPassword,
      role: 'receptionist',
      employeeId: 'EMP-REC01',
      status: 'active',
      isEmailVerified: true,
      isDocumentVerified: true,
      address: { city: 'Bangalore', state: 'Karnataka', country: 'India' },
    });

    const security = await User.create({
      fullName: 'Vikram Singh',
      email: 'security@apartment.com',
      mobile: '9876543215',
      password: defaultPassword,
      role: 'security',
      employeeId: 'EMP-SEC01',
      status: 'active',
      isEmailVerified: true,
      isDocumentVerified: true,
      address: { city: 'Bangalore', state: 'Karnataka', country: 'India' },
    });

    // 3. Create Resident Users with Identity Proofs
    console.log('[Seed] Creating Residents...');
    const resident1 = await User.create({
      fullName: 'Ravi Kumar',
      email: 'resident1@apartment.com',
      mobile: '9876543221',
      password: defaultPassword,
      role: 'resident',
      dob: new Date('1992-05-14'),
      gender: 'Male',
      emergencyContact: { name: 'Sunita Kumar', mobile: '9876543291', relationship: 'Spouse' },
      address: { houseNo: '12-A', street: 'Koramangala 4th Block', city: 'Bangalore', state: 'Karnataka', pincode: '560034' },
      identityProofs: [
        {
          proofType: 'Aadhaar',
          proofNumber: '5421-8974-1234',
          documentUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe',
          verificationStatus: 'verified',
          verifiedBy: receptionist._id,
          verifiedAt: new Date(),
        },
      ],
      isDocumentVerified: true,
      isEmailVerified: true,
      status: 'active',
    });

    const resident2 = await User.create({
      fullName: 'Ananya Patel',
      email: 'resident2@apartment.com',
      mobile: '9876543222',
      password: defaultPassword,
      role: 'resident',
      dob: new Date('1995-11-20'),
      gender: 'Female',
      emergencyContact: { name: 'Rajesh Patel', mobile: '9876543292', relationship: 'Father' },
      address: { houseNo: '45-C', street: 'Indiranagar 100ft Road', city: 'Bangalore', state: 'Karnataka', pincode: '560038' },
      identityProofs: [
        {
          proofType: 'Passport',
          proofNumber: 'K8923412',
          documentUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe',
          verificationStatus: 'verified',
          verifiedBy: receptionist._id,
          verifiedAt: new Date(),
        },
      ],
      isDocumentVerified: true,
      isEmailVerified: true,
      status: 'active',
    });

    const resident3 = await User.create({
      fullName: 'Rahul Sharma',
      email: 'resident3@apartment.com',
      mobile: '9876543223',
      password: defaultPassword,
      role: 'resident',
      dob: new Date('1988-03-10'),
      gender: 'Male',
      emergencyContact: { name: 'Meera Sharma', mobile: '9876543293', relationship: 'Sister' },
      address: { houseNo: '77-B', street: 'HSR Layout Sector 2', city: 'Bangalore', state: 'Karnataka', pincode: '560102' },
      identityProofs: [
        {
          proofType: 'Driving License',
          proofNumber: 'KA-01-2015-00892',
          documentUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe',
          verificationStatus: 'verified',
          verifiedBy: receptionist._id,
          verifiedAt: new Date(),
        },
      ],
      isDocumentVerified: true,
      isEmailVerified: true,
      status: 'active',
    });

    const resident4 = await User.create({
      fullName: 'Sneha Reddy',
      email: 'resident4@apartment.com',
      mobile: '9876543224',
      password: defaultPassword,
      role: 'resident',
      dob: new Date('1994-08-25'),
      gender: 'Female',
      emergencyContact: { name: 'Venkat Reddy', mobile: '9876543294', relationship: 'Brother' },
      address: { houseNo: '88-E', street: 'Whitefield Main Road', city: 'Bangalore', state: 'Karnataka', pincode: '560066' },
      identityProofs: [
        {
          proofType: 'PAN',
          proofNumber: 'ABCDE1234F',
          documentUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe',
          verificationStatus: 'verified',
          verifiedBy: receptionist._id,
          verifiedAt: new Date(),
        },
      ],
      isDocumentVerified: true,
      isEmailVerified: true,
      status: 'active',
    });

    const resident5 = await User.create({
      fullName: 'Karthik Nair',
      email: 'resident5@apartment.com',
      mobile: '9876543225',
      password: defaultPassword,
      role: 'resident',
      dob: new Date('1990-12-05'),
      gender: 'Male',
      emergencyContact: { name: 'Geetha Nair', mobile: '9876543295', relationship: 'Mother' },
      address: { houseNo: '10-F', street: 'JP Nagar 6th Phase', city: 'Bangalore', state: 'Karnataka', pincode: '560078' },
      identityProofs: [
        {
          proofType: 'Voter ID',
          proofNumber: 'XYZ9876543',
          documentUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe',
          verificationStatus: 'verified',
          verifiedBy: receptionist._id,
          verifiedAt: new Date(),
        },
      ],
      isDocumentVerified: true,
      isEmailVerified: true,
      status: 'active',
    });

    // 4. Create Rooms across Block A, B, C
    console.log('[Seed] Creating Rooms...');
    // Block A Rooms
    const roomA101 = await Room.create({
      roomNumber: 'A-101',
      block: blockA._id,
      floor: 1,
      roomType: 'Single',
      ac: true,
      maxOccupants: 1,
      currentOccupants: 1,
      monthlyRent: 12000,
      securityDeposit: 24000,
      status: 'occupied',
      currentResident: resident1._id,
    });

    const roomA102 = await Room.create({
      roomNumber: 'A-102',
      block: blockA._id,
      floor: 1,
      roomType: 'Double',
      ac: true,
      maxOccupants: 2,
      currentOccupants: 0,
      monthlyRent: 16000,
      securityDeposit: 32000,
      status: 'available',
    });

    const roomA103 = await Room.create({
      roomNumber: 'A-103',
      block: blockA._id,
      floor: 1,
      roomType: 'Triple',
      ac: false,
      maxOccupants: 3,
      currentOccupants: 0,
      monthlyRent: 18000,
      securityDeposit: 36000,
      status: 'available',
    });

    const roomA204 = await Room.create({
      roomNumber: 'A-204',
      block: blockA._id,
      floor: 2,
      roomType: 'Double',
      ac: true,
      maxOccupants: 2,
      currentOccupants: 2,
      monthlyRent: 18000,
      securityDeposit: 36000,
      status: 'occupied',
      currentResident: resident2._id,
    });

    const roomA205 = await Room.create({
      roomNumber: 'A-205',
      block: blockA._id,
      floor: 2,
      roomType: 'Deluxe',
      ac: true,
      maxOccupants: 2,
      currentOccupants: 0,
      monthlyRent: 22000,
      securityDeposit: 44000,
      status: 'maintenance',
      maintenanceReason: 'Bathroom plumbing renovation and repaint',
    });

    const roomA305 = await Room.create({
      roomNumber: 'A-305',
      block: blockA._id,
      floor: 3,
      roomType: 'Suite',
      ac: true,
      maxOccupants: 4,
      currentOccupants: 3,
      monthlyRent: 20000,
      securityDeposit: 40000,
      status: 'occupied',
      currentResident: resident3._id,
    });

    const roomA306 = await Room.create({
      roomNumber: 'A-306',
      block: blockA._id,
      floor: 3,
      roomType: 'Four sharing',
      ac: false,
      maxOccupants: 4,
      currentOccupants: 0,
      monthlyRent: 20000,
      securityDeposit: 40000,
      status: 'available',
    });

    // Block B Rooms
    const roomB101 = await Room.create({
      roomNumber: 'B-101',
      block: blockB._id,
      floor: 1,
      roomType: 'Single',
      ac: true,
      maxOccupants: 1,
      currentOccupants: 0,
      monthlyRent: 13000,
      securityDeposit: 26000,
      status: 'available',
    });

    const roomB102 = await Room.create({
      roomNumber: 'B-102',
      block: blockB._id,
      floor: 1,
      roomType: 'Double',
      ac: true,
      maxOccupants: 2,
      currentOccupants: 1,
      monthlyRent: 17000,
      securityDeposit: 34000,
      status: 'occupied',
      currentResident: resident4._id,
    });

    const roomB201 = await Room.create({
      roomNumber: 'B-201',
      block: blockB._id,
      floor: 2,
      roomType: 'Deluxe',
      ac: true,
      maxOccupants: 2,
      currentOccupants: 0,
      monthlyRent: 24000,
      securityDeposit: 48000,
      status: 'available',
    });

    // Block C Rooms
    const roomC101 = await Room.create({
      roomNumber: 'C-101',
      block: blockC._id,
      floor: 1,
      roomType: 'Double',
      ac: true,
      maxOccupants: 2,
      currentOccupants: 0,
      monthlyRent: 15000,
      securityDeposit: 30000,
      status: 'available',
    });

    const roomC201 = await Room.create({
      roomNumber: 'C-201',
      block: blockC._id,
      floor: 2,
      roomType: 'Triple',
      ac: true,
      maxOccupants: 3,
      currentOccupants: 2,
      monthlyRent: 19000,
      securityDeposit: 38000,
      status: 'occupied',
      currentResident: resident5._id,
    });

    // 5. Create Room Allocations
    console.log('[Seed] Creating Room Allocations...');
    const allocA101 = await RoomAllocation.create({
      allocationId: 'ALC-00101-RAVI',
      resident: resident1._id,
      room: roomA101._id,
      block: blockA._id,
      moveInDate: new Date('2026-06-01'),
      expectedMoveOutDate: new Date('2026-12-01'),
      durationMonths: 6,
      monthlyRent: roomA101.monthlyRent,
      securityDeposit: roomA101.securityDeposit,
      status: 'active',
      allocatedBy: receptionist._id,
    });
    roomA101.activeAllocation = allocA101._id;
    await roomA101.save();

    const allocA204 = await RoomAllocation.create({
      allocationId: 'ALC-00204-ANANYA',
      resident: resident2._id,
      room: roomA204._id,
      block: blockA._id,
      moveInDate: new Date('2026-05-01'),
      expectedMoveOutDate: new Date('2026-11-01'),
      durationMonths: 6,
      monthlyRent: roomA204.monthlyRent,
      securityDeposit: roomA204.securityDeposit,
      status: 'active',
      allocatedBy: receptionist._id,
    });
    roomA204.activeAllocation = allocA204._id;
    await roomA204.save();

    const allocA305 = await RoomAllocation.create({
      allocationId: 'ALC-00305-RAHUL',
      resident: resident3._id,
      room: roomA305._id,
      block: blockA._id,
      moveInDate: new Date('2026-04-01'),
      expectedMoveOutDate: new Date('2027-04-01'),
      durationMonths: 12,
      monthlyRent: roomA305.monthlyRent,
      securityDeposit: roomA305.securityDeposit,
      status: 'active',
      allocatedBy: receptionist._id,
    });
    roomA305.activeAllocation = allocA305._id;
    await roomA305.save();

    const allocB102 = await RoomAllocation.create({
      allocationId: 'ALC-00102-SNEHA',
      resident: resident4._id,
      room: roomB102._id,
      block: blockB._id,
      moveInDate: new Date('2026-07-01'),
      expectedMoveOutDate: new Date('2027-01-01'),
      durationMonths: 6,
      monthlyRent: roomB102.monthlyRent,
      securityDeposit: roomB102.securityDeposit,
      status: 'active',
      allocatedBy: receptionist._id,
    });
    roomB102.activeAllocation = allocB102._id;
    await roomB102.save();

    const allocC201 = await RoomAllocation.create({
      allocationId: 'ALC-00201-KARTHIK',
      resident: resident5._id,
      room: roomC201._id,
      block: blockC._id,
      moveInDate: new Date('2026-08-01'),
      expectedMoveOutDate: new Date('2027-02-01'),
      durationMonths: 6,
      monthlyRent: roomC201.monthlyRent,
      securityDeposit: roomC201.securityDeposit,
      status: 'active',
      allocatedBy: receptionist._id,
    });
    roomC201.activeAllocation = allocC201._id;
    await roomC201.save();

    // 6. Create Parking Slots & Allocations
    console.log('[Seed] Creating Parking Slots & Allocations...');
    const slotA1 = await ParkingSlot.create({
      slotNumber: 'P-A01',
      block: blockA._id,
      floorLocation: 'Basement 1',
      slotType: '4-wheeler',
      monthlyFee: 2000,
      status: 'allocated',
      currentResident: resident1._id,
      currentVehicle: { vehicleNumber: 'KA-05-MH-2020', vehicleType: '4-wheeler', model: 'Hyundai Creta' },
    });

    const parkAlloc1 = await ParkingAllocation.create({
      slot: slotA1._id,
      resident: resident1._id,
      room: roomA101._id,
      block: blockA._id,
      vehicleType: '4-wheeler',
      vehicleNumber: 'KA-05-MH-2020',
      vehicleModel: 'Hyundai Creta',
      monthlyFee: 2000,
      allocatedBy: receptionist._id,
    });
    slotA1.activeAllocation = parkAlloc1._id;
    await slotA1.save();

    const slotA2 = await ParkingSlot.create({
      slotNumber: 'P-A02',
      block: blockA._id,
      floorLocation: 'Basement 1',
      slotType: '4-wheeler',
      monthlyFee: 2000,
      status: 'allocated',
      currentResident: resident2._id,
      currentVehicle: { vehicleNumber: 'KA-01-AB-1122', vehicleType: '4-wheeler', model: 'Honda City' },
    });

    const slotA3 = await ParkingSlot.create({
      slotNumber: 'P-A03',
      block: blockA._id,
      floorLocation: 'Basement 1',
      slotType: 'EV',
      monthlyFee: 2500,
      status: 'available',
    });

    const slotA4 = await ParkingSlot.create({
      slotNumber: 'P-A04',
      block: blockA._id,
      floorLocation: 'Basement 1',
      slotType: '2-wheeler',
      monthlyFee: 800,
      status: 'available',
    });

    const slotB1 = await ParkingSlot.create({
      slotNumber: 'P-B01',
      block: blockB._id,
      floorLocation: 'Basement 1',
      slotType: '4-wheeler',
      monthlyFee: 2000,
      status: 'available',
    });

    const slotC1 = await ParkingSlot.create({
      slotNumber: 'P-C01',
      block: blockC._id,
      floorLocation: 'Basement 1',
      slotType: '4-wheeler',
      monthlyFee: 2000,
      status: 'available',
    });

    // 7. Create Dues (Overdue Color Demonstration: Orange, Red, Dark Red)
    console.log('[Seed] Creating Dues with Overdue Color Tiers...');
    const today = new Date();

    // Due 1: Room A-101 (Ravi Kumar) -> 3 Days Overdue -> ORANGE
    const date3DaysAgo = new Date(today);
    date3DaysAgo.setDate(today.getDate() - 3);
    const due1 = new Due({
      user: resident1._id,
      room: roomA101._id,
      block: blockA._id,
      allocation: allocA101._id,
      month: '2026-08',
      rentAmount: 12000,
      parkingAmount: 2000,
      amountDue: 14000,
      dueDate: date3DaysAgo,
      totalOutstanding: 14000,
      status: 'unpaid',
    });
    due1.recalculate(); // Sets tier = overdue_1_10 (Orange), calculates late fee
    await due1.save();

    // Due 2: Room A-204 (Ananya Patel) -> 13 Days Overdue -> RED
    const date13DaysAgo = new Date(today);
    date13DaysAgo.setDate(today.getDate() - 13);
    const due2 = new Due({
      user: resident2._id,
      room: roomA204._id,
      block: blockA._id,
      allocation: allocA204._id,
      month: '2026-08',
      rentAmount: 18000,
      amountDue: 18000,
      dueDate: date13DaysAgo,
      totalOutstanding: 18000,
      status: 'unpaid',
    });
    due2.recalculate(); // Sets tier = overdue_10_plus (Red), calculates late fee
    await due2.save();

    // Due 3: Room A-305 (Rahul Sharma) -> 35 Days Overdue -> DARK RED
    const date35DaysAgo = new Date(today);
    date35DaysAgo.setDate(today.getDate() - 35);
    const due3 = new Due({
      user: resident3._id,
      room: roomA305._id,
      block: blockA._id,
      allocation: allocA305._id,
      month: '2026-07',
      rentAmount: 20000,
      amountDue: 20000,
      dueDate: date35DaysAgo,
      totalOutstanding: 20000,
      status: 'unpaid',
    });
    due3.recalculate(); // Sets tier = critical (Dark Red), calculates late fee
    await due3.save();

    // Due 4: Room C-201 (Karthik Nair) -> Due Today -> Normal / Due Today
    const due4 = new Due({
      user: resident5._id,
      room: roomC201._id,
      block: blockC._id,
      allocation: allocC201._id,
      month: '2026-08',
      rentAmount: 19000,
      amountDue: 19000,
      dueDate: today,
      totalOutstanding: 19000,
      status: 'unpaid',
    });
    due4.recalculate();
    await due4.save();

    // 8. Create Payments & Receipts
    console.log('[Seed] Creating Payment Records & Receipts...');
    await Payment.create({
      paymentId: 'PAY-ADV-001',
      receiptNumber: 'REC-202606-10021',
      user: resident1._id,
      room: roomA101._id,
      block: blockA._id,
      paymentType: 'advance',
      amount: 43200, // 60% of (12000*6)
      totalAmount: 43200,
      paymentMethod: 'upi',
      transactionId: 'UPI-TXN-902184912',
      status: 'successful',
      paymentDate: new Date('2026-06-01'),
      processedBy: receptionist._id,
      notes: 'Initial 60% advance payment for Room A-101 (6 months stay)',
    });

    await Payment.create({
      paymentId: 'PAY-ADV-002',
      receiptNumber: 'REC-202607-20042',
      user: resident4._id,
      room: roomB102._id,
      block: blockB._id,
      paymentType: 'rent',
      amount: 17000,
      totalAmount: 17000,
      paymentMethod: 'online_card',
      transactionId: 'CARD-TXN-88129031',
      status: 'successful',
      paymentDate: new Date('2026-07-01'),
      processedBy: resident4._id,
      notes: 'Monthly rent for July 2026',
    });

    // 9. Create Visitors & Security Logs
    console.log('[Seed] Creating Visitors & Security Logs...');
    const visitor1 = await Visitor.create({
      visitorName: 'Suresh Raina',
      mobile: '9845012345',
      purpose: 'Family Visit',
      resident: resident1._id,
      residentName: resident1.fullName,
      room: roomA101._id,
      roomNumber: 'A-101',
      block: blockA._id,
      numberOfVisitors: 2,
      idProofType: 'Aadhaar',
      vehicleNumber: 'KA-03-JJ-9988',
      entryTime: new Date(Date.now() - 45 * 60 * 1000), // 45 mins ago
      status: 'inside',
      recordedBySecurity: security._id,
    });

    const visitor2 = await Visitor.create({
      visitorName: 'Deepak Chahar',
      mobile: '9845099887',
      purpose: 'Document Delivery / Courier',
      resident: resident2._id,
      residentName: resident2.fullName,
      room: roomA204._id,
      roomNumber: 'A-204',
      block: blockA._id,
      numberOfVisitors: 1,
      entryTime: new Date(Date.now() - 120 * 60 * 1000),
      actualExitTime: new Date(Date.now() - 100 * 60 * 1000),
      visitDurationMinutes: 20,
      status: 'checked_out',
      recordedBySecurity: security._id,
      checkedOutBySecurity: security._id,
    });

    await SecurityLog.create({
      logType: 'visitor_entry',
      visitor: visitor1._id,
      visitorName: visitor1.visitorName,
      resident: resident1._id,
      residentName: resident1.fullName,
      room: roomA101._id,
      roomNumber: 'A-101',
      block: blockA._id,
      vehicleNumber: 'KA-03-JJ-9988',
      actionTime: visitor1.entryTime,
      securityStaff: security._id,
      securityStaffName: security.fullName,
      notes: 'Visitor Entry: Family Visit',
    });

    await SecurityLog.create({
      logType: 'resident_entry',
      resident: resident1._id,
      residentName: resident1.fullName,
      room: roomA101._id,
      roomNumber: 'A-101',
      block: blockA._id,
      vehicleNumber: 'KA-05-MH-2020',
      actionTime: new Date(Date.now() - 3 * 60 * 60 * 1000),
      securityStaff: security._id,
      securityStaffName: security.fullName,
      notes: 'Resident returned from office',
    });

    // 10. Create Complaints (Parking & Room)
    console.log('[Seed] Creating Complaints...');
    await Complaint.create({
      complaintId: 'CMP-2026-001',
      resident: resident1._id,
      room: roomA101._id,
      block: blockA._id,
      parkingSlot: slotA1._id,
      category: 'parking_slot_occupied',
      description: 'An unauthorized black SUV (KA-04-QQ-1122) has parked in my assigned slot P-A01 without permission.',
      vehicleNumber: 'KA-04-QQ-1122',
      priority: 'High',
      status: 'IN_PROGRESS',
      assignedTo: blockAdminA._id,
      assignedToName: blockAdminA.fullName,
      adminNotes: 'Security contacted the vehicle owner to move to visitor parking.',
      updates: [
        {
          status: 'NEW',
          updatedBy: resident1._id,
          updatedByName: resident1.fullName,
          note: 'Complaint created by resident',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
        {
          status: 'ACKNOWLEDGED',
          updatedBy: blockAdminA._id,
          updatedByName: blockAdminA.fullName,
          note: 'Acknowledged. Forwarded to security desk.',
          timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000),
        },
        {
          status: 'IN_PROGRESS',
          updatedBy: blockAdminA._id,
          updatedByName: blockAdminA.fullName,
          note: 'Security team currently locating vehicle owner.',
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
        },
      ],
    });

    await Complaint.create({
      complaintId: 'CMP-2026-002',
      resident: resident2._id,
      room: roomA204._id,
      block: blockA._id,
      category: 'parking_cleanliness_problem',
      description: 'Water leakage near basement parking slot P-A02 creating oil and slush.',
      priority: 'Medium',
      status: 'NEW',
      updates: [
        {
          status: 'NEW',
          updatedBy: resident2._id,
          updatedByName: resident2.fullName,
          note: 'Complaint submitted',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
      ],
    });

    // 11. Create Announcements
    console.log('[Seed] Creating Announcements...');
    await Announcement.create({
      title: 'Basement Parking Floor Deep Cleaning & Maintenance',
      content: 'Please note that Basement 1 parking will undergo pressure washing this Sunday from 9:00 AM to 2:00 PM. Kindly cooperate by parking in the designated open visitor lot during this window.',
      category: 'parking_maintenance',
      targetAudience: 'all_residents',
      priority: 'High',
      createdBy: superAdmin._id,
      createdByName: superAdmin.fullName,
    });

    await Announcement.create({
      title: 'Block A Solar Water Heater Inspection',
      content: 'Routine inspection and servicing of solar water heaters for Block A will take place tomorrow between 11 AM and 1 PM.',
      category: 'maintenance_work',
      targetAudience: 'block',
      targetBlock: blockA._id,
      priority: 'Normal',
      createdBy: blockAdminA._id,
      createdByName: blockAdminA.fullName,
    });

    // 12. Create Notifications & Audit Logs
    console.log('[Seed] Creating In-App Notifications & Audit Logs...');
    await Notification.create({
      user: resident1._id,
      title: 'Payment Overdue Alert',
      message: 'Your payment for Room A-101 is overdue by 3 days. Late fee has been applied.',
      type: 'payment_overdue',
      link: '/resident/payments',
      isRead: false,
    });

    await Notification.create({
      user: resident1._id,
      title: 'Visitor Arrived at Gate',
      message: 'Suresh Raina has arrived at the security desk to meet you.',
      type: 'visitor_arrived',
      link: '/resident/dashboard',
      isRead: false,
    });

    await AuditLog.create({
      user: superAdmin._id,
      userName: superAdmin.fullName,
      role: superAdmin.role,
      action: 'SYSTEM_SEEDED',
      entityType: 'System',
      entityId: 'INIT-01',
      newValue: { description: 'Apartment complex initial seed setup completed successfully.' },
    });

    console.log('========================================================================');
    console.log('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('------------------------------------------------------------------------');
    console.log('DEMO ACCOUNTS READY (Password for all: Password123!):');
    console.log('1. Super Admin:    superadmin@apartment.com');
    console.log('2. Block A Admin:  blockadmin.a@apartment.com');
    console.log('3. Block B Admin:  blockadmin.b@apartment.com');
    console.log('4. Block C Admin:  blockadmin.c@apartment.com');
    console.log('5. Receptionist:   receptionist@apartment.com');
    console.log('6. Security Desk:  security@apartment.com');
    console.log('7. Resident (3d Overdue - ORANGE):  resident1@apartment.com');
    console.log('8. Resident (13d Overdue - RED):    resident2@apartment.com');
    console.log('9. Resident (35d Overdue - DARK RED): resident3@apartment.com');
    console.log('10. Resident (Paid):                 resident4@apartment.com');
    console.log('========================================================================');

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]', error);
    process.exit(1);
  }
};

seed();
