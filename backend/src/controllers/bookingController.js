import { v4 as uuidv4 } from 'uuid';
import { Booking } from '../models/Booking.js';
import { BookingQueue } from '../models/BookingQueue.js';
import { Room } from '../models/Room.js';
import { RoomAllocation } from '../models/RoomAllocation.js';
import { ParkingSlot } from '../models/ParkingSlot.js';
import { ParkingAllocation } from '../models/ParkingAllocation.js';
import { Payment } from '../models/Payment.js';
import { Due } from '../models/Due.js';
import { User } from '../models/User.js';
import { logAudit } from '../middleware/audit.js';
import { sendNotification, EmailTemplates } from '../services/notificationService.js';

// Helper to calculate advance payment based on stay duration rule
export const calculateAdvance = (totalMonthlyRent, durationMonths, securityDeposit = 0) => {
  const totalStayRent = totalMonthlyRent * durationMonths;
  const totalStayAmount = totalStayRent + securityDeposit;

  let advanceRequired = 0;
  if (durationMonths <= 6) {
    // 60% advance payment for stay <= 6 months
    advanceRequired = Math.round(totalStayAmount * 0.6);
  } else {
    // 4 months' advance rent for stay > 6 months
    advanceRequired = totalMonthlyRent * 4 + securityDeposit;
  }

  return {
    totalMonthlyRent,
    totalStayRent,
    securityDeposit,
    totalStayAmount,
    advanceRequired,
  };
};

// @desc Create multi-room booking (max 4 rooms)
// @route POST /api/bookings
export const createBooking = async (req, res, next) => {
  try {
    const {
      userId,
      blockId,
      roomIds, // Array of room ObjectIds (max 4)
      moveInDate,
      expectedMoveOutDate,
      durationMonths = 6,
      numberOfPeople = 1,
      occupants = [],
      requireParking = false,
      parkingSlotId,
      vehicleDetails,
      paymentDetails, // { paymentMethod, transactionId, amountPaid }
      notes,
    } = req.body;

    const targetUserId = req.user.role === 'resident' ? req.user._id : (userId || req.user._id);
    const resident = await User.findById(targetUserId);

    if (!resident) {
      return res.status(404).json({ success: false, message: 'Resident user not found' });
    }

    // 1. Validate Max 4 Rooms Rule
    if (!roomIds || !Array.isArray(roomIds) || roomIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Please select at least one room' });
    }

    if (roomIds.length > 4) {
      return res.status(400).json({
        success: false,
        message: 'You can book a maximum of 4 rooms at a time.',
      });
    }

    // 2. Validate Room Availability
    const rooms = await Room.find({
      _id: { $in: roomIds },
      isDeleted: false,
    }).populate('block');

    if (rooms.length !== roomIds.length) {
      return res.status(404).json({
        success: false,
        message: 'One or more selected rooms were not found in the system.',
      });
    }

    const unavailableRooms = rooms.filter(
      (r) => r.status && r.status.toUpperCase() !== 'AVAILABLE'
    );
    if (unavailableRooms.length > 0) {
      const roomNumbers = unavailableRooms.map((r) => r.roomNumber).join(', ');
      return res.status(400).json({
        success: false,
        message: `Room(s) ${roomNumbers} are already booked/occupied. Please refresh to view synchronized room availability or join the booking queue.`,
      });
    }

    // Calculate totals
    const totalMonthlyRent = rooms.reduce((sum, r) => sum + r.monthlyRent, 0);
    const totalSecurityDeposit = rooms.reduce((sum, r) => sum + (r.securityDeposit || 0), 0);
    const calc = calculateAdvance(totalMonthlyRent, Number(durationMonths), totalSecurityDeposit);

    const bookingId = `BK-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const bookingRooms = rooms.map((r) => ({
      room: r._id,
      roomNumber: r.roomNumber,
      roomType: r.roomType,
      ac: r.isAirConditioned ?? r.ac ?? true,
      monthlyRent: r.monthlyRent,
      securityDeposit: r.securityDeposit || 0,
    }));

    const amountPaid = paymentDetails?.amountPaid ? Number(paymentDetails.amountPaid) : calc.advanceRequired;
    const remainingBalance = Math.max(0, calc.totalStayAmount - amountPaid);

    const booking = await Booking.create({
      bookingId,
      user: resident._id,
      block: blockId || rooms[0].block._id,
      rooms: bookingRooms,
      roomCount: rooms.length,
      moveInDate: new Date(moveInDate),
      expectedMoveOutDate: new Date(expectedMoveOutDate),
      durationMonths: Number(durationMonths),
      numberOfPeople: Number(numberOfPeople),
      occupants,
      totalMonthlyRent,
      totalSecurityDeposit,
      totalStayAmount: calc.totalStayAmount,
      advanceRequired: calc.advanceRequired,
      advancePaid: amountPaid,
      remainingBalance,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Next month due
      paymentStatus: amountPaid >= calc.advanceRequired ? (remainingBalance === 0 ? 'paid' : 'partial') : 'pending',
      status: 'confirmed',
      requireParking,
      bookedBy: req.user._id,
      notes,
    });

    // Process Room Allocations & Mark Rooms Occupied
    const allocations = [];
    for (const r of rooms) {
      const allocationId = `ALC-${Date.now().toString().slice(-6)}-${r.roomNumber}`;
      const allocation = await RoomAllocation.create({
        allocationId,
        resident: resident._id,
        room: r._id,
        block: r.block._id,
        booking: booking._id,
        moveInDate: new Date(moveInDate),
        expectedMoveOutDate: new Date(expectedMoveOutDate),
        durationMonths: Number(durationMonths),
        occupants,
        monthlyRent: r.monthlyRent,
        securityDeposit: r.securityDeposit || 0,
        status: 'active',
        allocatedBy: req.user._id,
      });

      r.status = 'OCCUPIED';
      r.currentResident = resident._id;
      r.currentOccupants = numberOfPeople;
      r.activeAllocation = allocation._id;
      await r.save();
      allocations.push(allocation);

      // Create Initial Recurring Due for Next Period
      const dueMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 7);
      const initialDue = new Due({
        user: resident._id,
        room: r._id,
        block: r.block._id,
        allocation: allocation._id,
        month: dueMonth,
        rentAmount: r.monthlyRent,
        amountDue: r.monthlyRent,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        totalOutstanding: r.monthlyRent,
        status: 'unpaid',
      });
      initialDue.recalculate();
      await initialDue.save();
    }

    // Synchronize & resolve any active queue requests for this resident
    await BookingQueue.updateMany(
      { user: resident._id, status: { $in: ['waiting', 'room_available'] } },
      { status: 'allocated' }
    );

    // Process Parking Allocation if requested
    let allocatedParkingSlot = null;
    if (requireParking && parkingSlotId) {
      const slot = await ParkingSlot.findOne({ _id: parkingSlotId, status: 'available' });
      if (slot) {
        const parkingAlloc = await ParkingAllocation.create({
          slot: slot._id,
          resident: resident._id,
          room: rooms[0]._id,
          block: rooms[0].block._id,
          vehicleType: vehicleDetails?.vehicleType || '4-wheeler',
          vehicleNumber: vehicleDetails?.vehicleNumber || 'AP-09-XX-0000',
          vehicleModel: vehicleDetails?.vehicleModel || '',
          monthlyFee: slot.monthlyFee,
          allocatedBy: req.user._id,
        });

        slot.status = 'allocated';
        slot.currentResident = resident._id;
        slot.currentVehicle = {
          vehicleNumber: vehicleDetails?.vehicleNumber,
          vehicleType: vehicleDetails?.vehicleType,
          model: vehicleDetails?.vehicleModel,
        };
        slot.activeAllocation = parkingAlloc._id;
        await slot.save();

        booking.allocatedParkingSlots.push(slot._id);
        await booking.save();
        allocatedParkingSlot = slot;
      }
    }

    // Generate Payment Record & Receipt
    const txId = paymentDetails?.transactionId || `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const receiptNumber = `REC-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(10000 + Math.random() * 90000)}`;

    const payment = await Payment.create({
      paymentId: `PAY-${uuidv4().slice(0, 8).toUpperCase()}`,
      receiptNumber,
      booking: booking._id,
      user: resident._id,
      userName: resident.fullName || 'Resident',
      userEmail: resident.email,
      userRegistrationId: resident.registrationId || 'REG-PENDING',
      room: rooms[0]._id,
      roomNumber: rooms[0].roomNumber,
      block: rooms[0].block._id,
      paymentType: 'advance',
      amount: amountPaid,
      totalAmount: amountPaid,
      paymentMethod: paymentDetails?.paymentMethod || 'UPI',
      transactionId: txId,
      status: 'SUCCESS',
      advanceAmount: amountPaid,
      remainingBalance,
      recordedBy: req.user._id,
      recordedByName: req.user.fullName,
      processedBy: req.user._id,
      notes: `Advance payment for ${rooms.length} room(s): ${rooms.map((r) => r.roomNumber).join(', ')}`,
    });

    // Send Booking Confirmation Email & In-App Notification
    const roomNumbersStr = rooms.map((r) => r.roomNumber).join(', ');
    await sendNotification({
      user: resident,
      title: 'Booking Confirmed!',
      message: `Your booking for Room(s) ${roomNumbersStr} has been confirmed. Advance of ₹${amountPaid.toLocaleString()} received.`,
      type: 'room_booking_confirmed',
      link: '/resident/dashboard',
      emailSubject: `Booking Confirmation - Room ${roomNumbersStr}`,
      emailHtml: EmailTemplates.bookingConfirmation(
        resident.fullName,
        bookingId,
        roomNumbersStr,
        amountPaid,
        remainingBalance
      ),
    });

    await logAudit({
      req,
      action: 'BOOKING_CREATED',
      entityType: 'Booking',
      entityId: booking._id,
      newValue: { bookingId, roomCount: rooms.length, amountPaid, resident: resident.fullName },
    });

    res.status(201).json({
      success: true,
      message: 'Room booking successfully completed!',
      data: {
        booking,
        allocations,
        payment,
        allocatedParkingSlot,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc Join Booking Waitlist Queue
// @route POST /api/bookings/queue
export const joinQueue = async (req, res, next) => {
  try {
    const { requestedBlockId, roomType, ac, numberOfRooms = 1, numberOfPeople = 1, requestedMoveInDate, durationMonths = 6, notes } = req.body;

    const user = req.user;

    const countInQueue = await BookingQueue.countDocuments({
      requestedBlock: requestedBlockId,
      status: 'waiting',
    });

    const queueItem = await BookingQueue.create({
      user: user._id,
      requestedBlock: requestedBlockId,
      roomType: roomType || 'Double',
      ac: ac !== undefined ? ac : true,
      numberOfRooms: Math.min(4, Math.max(1, numberOfRooms)),
      numberOfPeople,
      requestedMoveInDate: new Date(requestedMoveInDate),
      durationMonths,
      queuePosition: countInQueue + 1,
      status: 'waiting',
      notes,
    });

    await sendNotification({
      user,
      title: 'Joined Room Waitlist Queue',
      message: `You are at position #${queueItem.queuePosition} in the waitlist. We will notify you immediately when a room becomes available.`,
      type: 'system',
      link: '/resident/dashboard',
    });

    await logAudit({
      req,
      action: 'BOOKING_QUEUE_JOINED',
      entityType: 'BookingQueue',
      entityId: queueItem._id,
      newValue: { position: queueItem.queuePosition, roomType },
    });

    res.status(201).json({
      success: true,
      message: `Successfully joined waitlist queue at position #${queueItem.queuePosition}`,
      data: queueItem,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get waitlist queue
// @route GET /api/bookings/queue
export const getQueue = async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role === 'resident') {
      query.user = req.user._id;
    } else if (req.user.role === 'block_admin') {
      query.requestedBlock = req.user.assignedBlock;
    }

    const queue = await BookingQueue.find(query)
      .populate('user', 'fullName email mobile')
      .populate('requestedBlock', 'name code')
      .sort({ queuePosition: 1, createdAt: 1 });

    res.json({
      success: true,
      count: queue.length,
      data: queue,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get user bookings
// @route GET /api/bookings
export const getBookings = async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role === 'resident') {
      query.user = req.user._id;
    } else if (req.user.role === 'block_admin') {
      query.block = req.user.assignedBlock;
    }

    const bookings = await Booking.find(query)
      .populate('user', 'fullName email mobile')
      .populate('block', 'name code')
      .populate('rooms.room')
      .populate('allocatedParkingSlots')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get booking by ID
// @route GET /api/bookings/:id
export const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'fullName email mobile address identityProofs')
      .populate('block', 'name code address')
      .populate('rooms.room')
      .populate('allocatedParkingSlots');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (req.user.role === 'resident' && booking.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const payments = await Payment.find({ booking: booking._id });

    res.json({
      success: true,
      data: {
        ...booking.toObject(),
        payments,
      },
    });
  } catch (error) {
    next(error);
  }
};
