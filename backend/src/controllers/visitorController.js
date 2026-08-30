import { Visitor } from '../models/Visitor.js';
import { Room } from '../models/Room.js';
import { User } from '../models/User.js';
import { SecurityLog } from '../models/SecurityLog.js';
import { logAudit } from '../middleware/audit.js';
import { sendNotification } from '../services/notificationService.js';

// @desc Get visitors with filters
// @route GET /api/visitors
export const getVisitors = async (req, res, next) => {
  try {
    const { blockId, status, search, startDate, endDate } = req.query;
    let query = {};

    if (req.user.role === 'block_admin') {
      query.block = req.user.assignedBlock;
    } else if (blockId) {
      query.block = blockId;
    }

    if (status) query.status = status;

    if (search) {
      const s = { $regex: search.trim(), $options: 'i' };
      query.$or = [{ visitorName: s }, { mobile: s }, { vehicleNumber: s }, { residentName: s }];
    }

    if (startDate || endDate) {
      query.entryTime = {};
      if (startDate) query.entryTime.$gte = new Date(startDate);
      if (endDate) query.entryTime.$lte = new Date(endDate);
    }

    const visitors = await Visitor.find(query)
      .populate('resident', 'fullName mobile email')
      .populate('room', 'roomNumber floor')
      .populate('block', 'name code')
      .populate('recordedBySecurity', 'fullName')
      .populate('checkedOutBySecurity', 'fullName')
      .sort({ entryTime: -1 });

    res.json({
      success: true,
      count: visitors.length,
      data: visitors,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Register new visitor (Receptionist or Resident preregistration)
// @route POST /api/visitors
export const registerVisitor = async (req, res, next) => {
  try {
    const {
      visitorName,
      mobile,
      purpose,
      residentId,
      roomId,
      blockId,
      numberOfVisitors = 1,
      idProofType,
      idProofNumber,
      vehicleNumber,
      expectedExitTime,
      notes,
    } = req.body;

    let residentName = '';
    let targetResident = null;
    let targetRoomNumber = '';

    if (residentId) {
      targetResident = await User.findById(residentId);
      if (targetResident) residentName = targetResident.fullName;
    }

    if (roomId) {
      const room = await Room.findById(roomId);
      if (room) targetRoomNumber = room.roomNumber;
    }

    const visitor = await Visitor.create({
      visitorName: visitorName.trim(),
      mobile: mobile.trim(),
      purpose,
      resident: residentId || null,
      residentName,
      room: roomId || null,
      roomNumber: targetRoomNumber,
      block: blockId,
      numberOfVisitors,
      idProofType: idProofType || 'None',
      idProofNumber,
      vehicleNumber: vehicleNumber ? vehicleNumber.toUpperCase().trim() : undefined,
      entryTime: new Date(),
      expectedExitTime: expectedExitTime ? new Date(expectedExitTime) : undefined,
      status: 'inside', // Immediate check-in if logged at desk
      recordedBySecurity: req.user._id,
      notes,
    });

    // Create security log
    await SecurityLog.create({
      logType: 'visitor_entry',
      visitor: visitor._id,
      visitorName: visitor.visitorName,
      resident: targetResident ? targetResident._id : null,
      residentName,
      room: roomId,
      roomNumber: targetRoomNumber,
      block: blockId,
      vehicleNumber: visitor.vehicleNumber,
      actionTime: new Date(),
      securityStaff: req.user._id,
      securityStaffName: req.user.fullName,
      notes: `Visitor entry: ${purpose}`,
    });

    // Notify resident of visitor arrival
    if (targetResident) {
      await sendNotification({
        user: targetResident,
        title: 'Visitor Arrived at Security Gate',
        message: `${visitor.visitorName} (${mobile}) has arrived at the gate to meet you for: ${purpose}.`,
        type: 'visitor_arrived',
        link: '/resident/dashboard',
      });
    }

    await logAudit({
      req,
      action: 'VISITOR_CHECKED_IN',
      entityType: 'Visitor',
      entityId: visitor._id,
      newValue: { visitorName, mobile, residentName },
    });

    res.status(201).json({
      success: true,
      message: `Visitor pass created. ${visitor.visitorName} marked as Inside.`,
      data: visitor,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Check-out visitor
// @route POST /api/visitors/:id/check-out
export const checkOutVisitor = async (req, res, next) => {
  try {
    const visitor = await Visitor.findById(req.params.id);

    if (!visitor) {
      return res.status(404).json({ success: false, message: 'Visitor record not found' });
    }

    if (visitor.status === 'checked_out') {
      return res.status(400).json({ success: false, message: 'Visitor is already checked out' });
    }

    const exitTime = new Date();
    const entryTime = new Date(visitor.entryTime);
    const durationMinutes = Math.round((exitTime.getTime() - entryTime.getTime()) / (1000 * 60));

    visitor.status = 'checked_out';
    visitor.actualExitTime = exitTime;
    visitor.visitDurationMinutes = Math.max(1, durationMinutes);
    visitor.checkedOutBySecurity = req.user._id;
    await visitor.save();

    await SecurityLog.create({
      logType: 'visitor_exit',
      visitor: visitor._id,
      visitorName: visitor.visitorName,
      resident: visitor.resident,
      residentName: visitor.residentName,
      room: visitor.room,
      roomNumber: visitor.roomNumber,
      block: visitor.block,
      vehicleNumber: visitor.vehicleNumber,
      actionTime: exitTime,
      securityStaff: req.user._id,
      securityStaffName: req.user.fullName,
      notes: `Visitor departed. Duration: ${durationMinutes} minutes.`,
    });

    await logAudit({
      req,
      action: 'VISITOR_CHECKED_OUT',
      entityType: 'Visitor',
      entityId: visitor._id,
      newValue: { exitTime, durationMinutes },
    });

    res.json({
      success: true,
      message: `Visitor ${visitor.visitorName} checked out successfully. Duration: ${durationMinutes} minutes.`,
      data: visitor,
    });
  } catch (error) {
    next(error);
  }
};
