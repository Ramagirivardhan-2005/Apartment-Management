import { Payment } from '../models/Payment.js';
import { Room } from '../models/Room.js';
import { Block } from '../models/Block.js';
import { User } from '../models/User.js';
import { Due } from '../models/Due.js';
import { Booking } from '../models/Booking.js';
import { RoomAllocation } from '../models/RoomAllocation.js';
import { logAudit } from '../middleware/audit.js';
import { sendNotification, EmailTemplates } from '../services/notificationService.js';
import { createRazorpayOrder, verifyRazorpaySignature } from '../services/paymentService.js';
import { generateReceiptNumber, generateTransactionId } from '../utils/idGenerator.js';

// @desc Create Razorpay Test Order for Room Booking or Due Payment (Section 11 & 12)
// @route POST /api/payments/razorpay/create-order
export const createRoomBookingOrder = async (req, res, next) => {
  try {
    const { roomId, dueId, amount } = req.body;

    if (dueId) {
      const due = await Due.findById(dueId).populate('room block');
      if (!due) {
        return res.status(404).json({ success: false, message: 'Due record not found' });
      }
      const payAmount = Number(amount || due.totalOutstanding || due.rentAmount);
      const receipt = `rcpt_${Date.now().toString().slice(-8)}`;

      const razorpayOrder = await createRazorpayOrder({
        amount: payAmount,
        receipt,
        notes: {
          dueId: due._id.toString(),
          roomNumber: due.room?.roomNumber || 'N/A',
          blockName: due.block?.name || 'Block',
          userId: req.user._id.toString(),
          registrationId: req.user.registrationId || 'N/A',
        },
      });

      return res.json({
        success: true,
        data: {
          orderId: razorpayOrder.id,
          amount: razorpayOrder.amount, // in paise
          amountInRupees: payAmount,
          currency: razorpayOrder.currency,
          key_id: razorpayOrder.key_id,
          due: {
            _id: due._id,
            month: due.month,
            totalOutstanding: due.totalOutstanding,
          },
          user: {
            name: req.user.fullName,
            email: req.user.email,
            mobile: req.user.mobile,
            registrationId: req.user.registrationId,
          },
        },
      });
    }

    if (!roomId) {
      return res.status(400).json({ success: false, message: 'Room ID or Due ID is required to create a payment order' });
    }

    const room = await Room.findById(roomId).populate('block', 'name code');
    if (!room || room.isDeleted) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    if (room.status !== 'AVAILABLE') {
      return res.status(400).json({
        success: false,
        message: `Room ${room.roomNumber} is currently ${room.status} and cannot be booked.`,
      });
    }

    const totalPayable = Number(amount || room.monthlyRent);
    const receipt = `rcpt_${Date.now().toString().slice(-8)}`;

    const razorpayOrder = await createRazorpayOrder({
      amount: totalPayable,
      receipt,
      notes: {
        roomId: room._id.toString(),
        roomNumber: room.roomNumber,
        blockName: room.block?.name,
        userId: req.user._id.toString(),
        registrationId: req.user.registrationId || 'N/A',
      },
    });

    res.json({
      success: true,
      data: {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount, // in paise
        amountInRupees: totalPayable,
        currency: razorpayOrder.currency,
        key_id: razorpayOrder.key_id,
        room: {
          _id: room._id,
          roomNumber: room.roomNumber,
          roomType: room.roomType,
          block: room.block,
          monthlyRent: room.monthlyRent,
        },
        user: {
          name: req.user.fullName,
          email: req.user.email,
          mobile: req.user.mobile,
          registrationId: req.user.registrationId,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc Verify Razorpay Payment and Confirm Booking or Due Payment (Section 12 & 21)
// @route POST /api/payments/razorpay/verify-payment
export const verifyAndConfirmBooking = async (req, res, next) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      roomId,
      dueId,
      amount,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({ success: false, message: 'Missing Razorpay order or payment details' });
    }

    // 1. Verify Razorpay HMAC-SHA256 Signature (Section 12)
    const isSignatureValid = verifyRazorpaySignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!isSignatureValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Razorpay payment signature. Payment verification failed.',
      });
    }

    const receiptNumber = generateReceiptNumber();
    const transactionId = generateTransactionId();

    // Handling Due / Monthly Rent Payment via Razorpay
    if (dueId) {
      const due = await Due.findById(dueId).populate('room block');
      if (!due) {
        return res.status(404).json({ success: false, message: 'Due record not found' });
      }

      const payAmount = Number(amount || due.totalOutstanding || due.rentAmount);

      const payment = await Payment.create({
        paymentId: razorpay_payment_id || `PAY-${Date.now().toString().slice(-6)}`,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        transactionId,
        receiptNumber,
        user: req.user._id,
        userRegistrationId: req.user.registrationId || 'N/A',
        userName: req.user.fullName,
        userEmail: req.user.email,
        block: due.block?._id || req.user.assignedBlock,
        room: due.room?._id,
        roomNumber: due.room?.roomNumber || 'N/A',
        amount: payAmount,
        currency: 'INR',
        paymentDate: new Date(),
        paymentTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'SUCCESS',
        paymentMethod: 'Razorpay Online',
        createdBy: req.user._id,
        notes: `Online Due Payment via Razorpay for Room ${due.room?.roomNumber || 'N/A'} (${due.month})`,
      });

      due.amountPaid = (due.amountPaid || 0) + payAmount;
      const totalRequired = (due.amountDue || 0) + (due.lateFee || 0);
      if (due.amountPaid >= totalRequired) {
        due.status = 'paid';
        due.totalOutstanding = 0;
        due.paidDate = new Date();
      } else {
        due.status = 'partially_paid';
        due.totalOutstanding = Math.max(0, totalRequired - due.amountPaid);
      }
      await due.save();

      return res.json({
        success: true,
        message: `Due payment of ₹${payAmount.toLocaleString()} verified and completed!`,
        data: payment,
      });
    }

    // Handling Direct Room Booking via Razorpay
    if (!roomId) {
      return res.status(400).json({ success: false, message: 'Room ID is required for room booking verification' });
    }

    const room = await Room.findById(roomId).populate('block', 'name code');
    if (!room || room.isDeleted) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    const allocatedRoom = await Room.findOneAndUpdate(
      { _id: room._id, status: 'AVAILABLE' },
      {
        status: 'OCCUPIED',
        currentResident: req.user._id,
      },
      { new: true }
    );

    if (!allocatedRoom) {
      return res.status(409).json({
        success: false,
        message: 'Room was already booked by another user. Your payment will be queued for reconciliation/refund.',
      });
    }

    const durationMonths = Number(req.body.durationMonths || 6);
    const moveInDate = req.body.moveInDate ? new Date(req.body.moveInDate) : new Date();
    const expectedMoveOutDate = new Date(moveInDate.getTime() + durationMonths * 30 * 24 * 60 * 60 * 1000);

    const booking = await Booking.create({
      bookingId: `BKG-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
      user: req.user._id,
      block: room.block._id,
      rooms: [{
        room: room._id,
        roomNumber: room.roomNumber,
        roomType: room.roomType,
        ac: room.isAirConditioned,
        monthlyRent: room.monthlyRent,
        securityDeposit: room.securityDeposit || 0,
      }],
      roomCount: 1,
      moveInDate,
      expectedMoveOutDate,
      durationMonths,
      numberOfPeople: req.body.numberOfPeople || 1,
      roomType: room.roomType,
      ac: room.isAirConditioned,
      occupants: [{
        fullName: req.body.fullName || req.user.fullName,
        mobile: req.body.mobile || req.user.mobile,
        relationship: 'Self',
        proofType: req.body.proofType || 'Aadhaar',
        proofNumber: req.body.proofNumber || req.user.registrationId || 'N/A',
      }],
      totalMonthlyRent: room.monthlyRent,
      totalSecurityDeposit: room.securityDeposit || 0,
      totalStayAmount: room.monthlyRent * durationMonths,
      advanceRequired: room.monthlyRent,
      advancePaid: room.monthlyRent,
      remainingBalance: Math.max(0, (room.monthlyRent * durationMonths) - room.monthlyRent),
      paymentStatus: 'paid',
      status: 'confirmed',
    });

    const allocationId = `ALC-${Date.now().toString().slice(-6)}-${room.roomNumber}`;
    const allocation = await RoomAllocation.create({
      allocationId,
      resident: req.user._id,
      room: room._id,
      block: room.block._id,
      booking: booking._id,
      moveInDate,
      expectedMoveOutDate,
      durationMonths,
      occupants: booking.occupants,
      monthlyRent: room.monthlyRent,
      securityDeposit: room.securityDeposit || 0,
      status: 'active',
      allocatedBy: req.user._id,
    });

    room.activeAllocation = allocation._id;
    await room.save();

    const payment = await Payment.create({
      paymentId: razorpay_payment_id || `PAY-${Date.now().toString().slice(-6)}`,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      transactionId,
      receiptNumber,
      user: req.user._id,
      userRegistrationId: req.user.registrationId || 'REG-USER',
      userName: req.user.fullName,
      userEmail: req.user.email,
      block: room.block._id,
      room: room._id,
      roomNumber: room.roomNumber,
      amount: room.monthlyRent,
      currency: 'INR',
      paymentDate: new Date(),
      paymentTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'SUCCESS',
      paymentMethod: 'Razorpay Online',
      createdBy: req.user._id,
      notes: `Online room booking via Razorpay for Room ${room.roomNumber} (${room.block.name})`,
    });

    // Associate Resident with Block and currentRoom
    await User.findByIdAndUpdate(req.user._id, {
      assignedBlock: room.block._id,
      currentRoom: room._id,
    });

    // Send Confirmation & Receipt Email
    await sendNotification({
      user: req.user,
      title: `Booking Confirmed: Room ${room.roomNumber}`,
      message: `Your payment of ₹${room.monthlyRent.toLocaleString()} was successful. Receipt No: ${receiptNumber}.`,
      type: 'payment_received',
      emailSubject: `Booking Confirmed - Room ${room.roomNumber} (${room.block.name})`,
      emailHtml: EmailTemplates.roomBookingSuccessEmail(
        req.user.fullName,
        req.user.registrationId || 'N/A',
        room.roomNumber,
        room.block.name,
        room.monthlyRent,
        receiptNumber,
        razorpay_payment_id
      ),
    });

    await logAudit({
      user: req.user,
      action: 'PAYMENT_VERIFIED_ROOM_BOOKED',
      blockId: room.block._id,
      entityType: 'Payment',
      entityId: payment._id,
      newValue: {
        receiptNumber,
        transactionId,
        amount: payment.amount,
        room: room.roomNumber,
        razorpayPaymentId: razorpay_payment_id,
      },
      req,
    });

    res.status(201).json({
      success: true,
      message: `Payment verified successfully! Room ${room.roomNumber} confirmed.`,
      data: {
        payment,
        room: allocatedRoom,
        receiptNumber,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc Record Manual / Offline Payment by Receptionist (Section 14: Captures Receptionist Identity)
// @route POST /api/payments/manual
export const recordManualPayment = async (req, res, next) => {
  try {
    const {
      residentId,
      roomId,
      blockId,
      amount,
      paymentMethod,
      transactionId,
      notes,
    } = req.body;

    if (!residentId || !amount) {
      return res.status(400).json({ success: false, message: 'Resident ID and Amount are required' });
    }

    const resident = await User.findById(residentId);
    if (!resident || resident.role !== 'resident') {
      return res.status(404).json({ success: false, message: 'Resident not found' });
    }

    // Determine block
    const targetBlockId = req.user.role === 'receptionist' || req.user.role === 'block_admin'
      ? req.user.assignedBlock
      : (blockId || resident.assignedBlock);

    if (!targetBlockId) {
      return res.status(400).json({ success: false, message: 'Block association is required' });
    }

    const block = await Block.findById(targetBlockId);
    let roomObj = null;
    if (roomId) {
      roomObj = await Room.findById(roomId);
    }

    const receiptNumber = generateReceiptNumber();
    const finalTxId = transactionId?.trim() || generateTransactionId();

    // Create payment with Receptionist Identity automatically attached (Section 14)
    const payment = await Payment.create({
      transactionId: finalTxId,
      receiptNumber,
      user: resident._id,
      userRegistrationId: resident.registrationId || 'N/A',
      userName: resident.fullName,
      userEmail: resident.email,
      block: targetBlockId,
      room: roomObj?._id || null,
      roomNumber: roomObj?.roomNumber || '',
      amount: Number(amount),
      currency: 'INR',
      paymentDate: new Date(),
      paymentTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'SUCCESS',
      paymentMethod: paymentMethod || 'Cash',

      // Section 14: The system must automatically record the currently logged-in Receptionist
      recordedBy: req.user._id,
      recordedByName: req.user.fullName,
      receptionistId: req.user.employeeId || 'REC-OFFLINE',

      createdBy: req.user._id,
      notes: notes || `Offline payment recorded by ${req.user.fullName} (${req.user.employeeId || 'Reception'})`,
    });

    // Send receipt email
    await sendNotification({
      user: resident,
      title: `Payment Receipt: ${receiptNumber}`,
      message: `Offline payment of ₹${Number(amount).toLocaleString()} recorded by ${req.user.fullName}.`,
      type: 'payment_received',
      emailSubject: `Payment Receipt - ${receiptNumber}`,
      emailHtml: EmailTemplates.paymentReceipt(
        receiptNumber,
        resident.fullName,
        resident.registrationId,
        block?.name || 'Assigned Block',
        roomObj?.roomNumber,
        Number(amount),
        payment.paymentMethod,
        finalTxId,
        `${req.user.fullName} (${req.user.employeeId || 'REC'})`
      ),
    });

    await logAudit({
      user: req.user,
      action: 'MANUAL_PAYMENT_RECORDED',
      blockId: targetBlockId,
      entityType: 'Payment',
      entityId: payment._id,
      newValue: {
        receiptNumber,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        resident: resident.fullName,
        recordedBy: req.user.fullName,
        receptionistId: req.user.employeeId,
      },
      req,
    });

    res.status(201).json({
      success: true,
      message: `Payment of ₹${payment.amount.toLocaleString()} recorded successfully for ${resident.fullName}`,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get Payments (Scoped by Role & Block - Section 13, 16, 18)
// @route GET /api/payments
export const getPayments = async (req, res, next) => {
  try {
    const { blockId, status, paymentMethod, search } = req.query;
    let query = { isDeleted: false };

    // Role-based scoping (Section 16 & 18)
    if (req.user.role === 'resident') {
      query.user = req.user._id;
    } else if (req.user.role === 'block_admin' || req.user.role === 'receptionist') {
      if (!req.user.assignedBlock) {
        return res.json({ success: true, count: 0, data: [] });
      }
      query.block = req.user.assignedBlock;
    } else if (blockId) {
      query.block = blockId;
    }

    if (status) query.status = status.toUpperCase();
    if (paymentMethod) query.paymentMethod = paymentMethod;

    if (search) {
      const s = { $regex: search.trim(), $options: 'i' };
      query.$or = [
        { receiptNumber: s },
        { transactionId: s },
        { userName: s },
        { userEmail: s },
        { userRegistrationId: s },
        { roomNumber: s },
      ];
    }

    const payments = await Payment.find(query)
      .populate('block', 'name code')
      .populate('user', 'fullName email mobile registrationId')
      .populate('recordedBy', 'fullName employeeId')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get Single Payment Details / Receipt
// @route GET /api/payments/:id
export const getPaymentById = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('block', 'name code address')
      .populate('user', 'fullName email mobile registrationId address')
      .populate('recordedBy', 'fullName employeeId');

    if (!payment || payment.isDeleted) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    // Scoped restriction
    if (req.user.role === 'resident' && payment.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized: Cannot view another user payment' });
    }

    if ((req.user.role === 'block_admin' || req.user.role === 'receptionist') &&
        payment.block._id.toString() !== req.user.assignedBlock?.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized: Cannot view payments from another block' });
    }

    res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get Revenue Stats and Monthly Breakdown
// @route GET /api/payments/revenue
export const getRevenueStats = async (req, res, next) => {
  try {
    const { blockId } = req.query;
    let query = { status: { $in: ['SUCCESS', 'successful'] }, isDeleted: false };

    if (blockId) {
      query.block = blockId;
    } else if (req.user.role === 'block_admin' && req.user.assignedBlock) {
      query.block = req.user.assignedBlock;
    }

    const payments = await Payment.find(query).sort({ paymentDate: -1, createdAt: -1 });

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let totalRevenue = 0;
    let todayRevenue = 0;
    let monthRevenue = 0;
    let yearRevenue = 0;

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyMap = {};

    months.forEach((m) => {
      monthlyMap[m] = { month: m, roomRevenue: 0, parkingRevenue: 0, lateFees: 0, total: 0 };
    });

    payments.forEach((p) => {
      const amt = Number(p.amount || 0);
      totalRevenue += amt;

      const pDate = new Date(p.paymentDate || p.createdAt);
      if (pDate >= today) todayRevenue += amt;
      if (pDate.getFullYear() === currentYear && pDate.getMonth() === currentMonth) monthRevenue += amt;
      if (pDate.getFullYear() === currentYear) {
        yearRevenue += amt;
        const mName = months[pDate.getMonth()];
        if (monthlyMap[mName]) {
          const type = (p.paymentType || '').toLowerCase();
          if (type === 'parking') monthlyMap[mName].parkingRevenue += amt;
          else if (type === 'late_fee') monthlyMap[mName].lateFees += amt;
          else monthlyMap[mName].roomRevenue += amt;
          monthlyMap[mName].total += amt;
        }
      }
    });

    const monthlyBreakdown = months.map((m) => monthlyMap[m]);

    res.json({
      success: true,
      summary: {
        totalRevenue,
        todayRevenue,
        monthRevenue,
        yearRevenue,
      },
      monthlyBreakdown,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Process Resident Online Due/Rent Payment
// @route POST /api/payments
export const processResidentPayment = async (req, res, next) => {
  try {
    const { dueId, amount, lateFeeAmount, paymentType = 'rent', paymentMethod = 'UPI', transactionId, notes } = req.body;

    let targetDue = null;
    let roomDoc = null;
    let blockId = req.user.assignedBlock?._id || req.user.assignedBlock;

    if (dueId) {
      targetDue = await Due.findById(dueId).populate('room block');
      if (targetDue) {
        roomDoc = targetDue.room;
        blockId = targetDue.block?._id || targetDue.block || blockId;
      }
    }

    if (!roomDoc) {
      roomDoc = await Room.findOne({ currentResident: req.user._id, isDeleted: false });
      if (roomDoc) {
        blockId = roomDoc.block?._id || roomDoc.block || blockId;
      }
    }

    const payAmount = Number(amount || targetDue?.totalOutstanding || targetDue?.rentAmount || 0);
    if (payAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Payment amount must be greater than zero' });
    }

    const receiptNumber = generateReceiptNumber();
    const finalTxnId = transactionId || generateTransactionId();

    const payment = await Payment.create({
      user: req.user._id,
      userName: req.user.fullName,
      userEmail: req.user.email,
      userRegistrationId: req.user.registrationId || 'N/A',
      block: blockId,
      room: roomDoc?._id,
      roomNumber: roomDoc?.roomNumber || targetDue?.roomNumber || 'N/A',
      amount: payAmount,
      currency: 'INR',
      paymentDate: new Date(),
      paymentMethod: paymentMethod.toUpperCase(),
      transactionId: finalTxnId,
      receiptNumber,
      status: 'SUCCESS',
      notes: notes || 'Resident Online Due Payment',
    });

    if (targetDue) {
      targetDue.amountPaid = (targetDue.amountPaid || 0) + payAmount;
      const totalRequired = (targetDue.amountDue || 0) + (targetDue.lateFee || 0);
      if (targetDue.amountPaid >= totalRequired) {
        targetDue.status = 'paid';
        targetDue.totalOutstanding = 0;
        targetDue.paidDate = new Date();
      } else {
        targetDue.status = 'partially_paid';
        targetDue.totalOutstanding = Math.max(0, totalRequired - targetDue.amountPaid);
      }
      await targetDue.save();
    }

    // Send Payment Confirmation Email
    sendNotification({
      userId: req.user._id,
      title: 'Payment Successful',
      message: `Your payment of ₹${payAmount.toLocaleString()} has been processed successfully. Receipt No: ${receiptNumber}`,
      type: 'PAYMENT_SUCCESS',
      email: req.user.email,
      subject: 'Payment Receipt: ' + receiptNumber,
      html: EmailTemplates.paymentReceipt(req.user.fullName, receiptNumber, payAmount, finalTxnId, paymentMethod, new Date()),
    }).catch((err) => console.error('[Notification Error]', err.message));

    await logAudit({
      user: req.user,
      action: 'RESIDENT_PAYMENT_PROCESSED',
      entityType: 'Payment',
      entityId: payment._id,
      req,
    });

    res.status(201).json({
      success: true,
      message: `Payment of ₹${payAmount.toLocaleString()} processed successfully!`,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get Overdue Payments Dashboard with Color-coded Tiers
// @route GET /api/payments/overdue-dashboard
export const getOverdueDashboard = async (req, res, next) => {
  try {
    const { blockId } = req.query;
    let query = { status: { $in: ['unpaid', 'partially_paid'] } };

    if (blockId) {
      query.block = blockId;
    } else if (req.user.role === 'block_admin' && req.user.assignedBlock) {
      query.block = req.user.assignedBlock;
    }

    const dues = await Due.find(query)
      .populate('user', 'fullName email mobile registrationId')
      .populate('room', 'roomNumber floor roomType')
      .populate('block', 'name code')
      .sort({ overdueDays: -1, dueDate: 1 });

    // Recalculate each due in real time
    let totalOutstanding = 0;
    let totalLateFees = 0;
    let overdue1to10Count = 0;
    let overdue1to10Amount = 0;
    let overdue10PlusCount = 0;
    let overdue10PlusAmount = 0;
    let criticalCount = 0;
    let criticalAmount = 0;

    for (const due of dues) {
      due.recalculate();
      const out = due.totalOutstanding || 0;
      totalOutstanding += out;
      totalLateFees += due.lateFee || 0;

      if (due.tier === 'overdue_1_10') {
        overdue1to10Count++;
        overdue1to10Amount += out;
      } else if (due.tier === 'overdue_10_plus') {
        overdue10PlusCount++;
        overdue10PlusAmount += out;
      } else if (due.tier === 'critical') {
        criticalCount++;
        criticalAmount += out;
      }
    }

    res.json({
      success: true,
      stats: {
        totalOutstanding,
        totalLateFees,
        totalOverdueUnits: dues.length,
        overdue1to10: { count: overdue1to10Count, amount: overdue1to10Amount },
        overdue10Plus: { count: overdue10PlusCount, amount: overdue10PlusAmount },
        critical: { count: criticalCount, amount: criticalAmount },
      },
      dues,
    });
  } catch (error) {
    next(error);
  }
};
