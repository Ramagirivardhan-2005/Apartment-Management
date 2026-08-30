import { SecurityLog } from '../models/SecurityLog.js';
import { Visitor } from '../models/Visitor.js';
import { Room } from '../models/Room.js';
import { User } from '../models/User.js';
import { Block } from '../models/Block.js';

// @desc Search resident for Security Desk (Strict Privacy: no financial or identity doc exposure)
// @route GET /api/security/lookup-resident
export const lookupResident = async (req, res, next) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ success: false, message: 'Search query required' });
    }

    const s = { $regex: query.trim(), $options: 'i' };

    // Search rooms or residents
    const matchingRooms = await Room.find({ roomNumber: s, isDeleted: false })
      .populate('block', 'name code')
      .populate('currentResident', 'fullName mobile');

    const matchingUsers = await User.find({
      role: 'resident',
      isDeleted: false,
      $or: [{ fullName: s }, { mobile: s }],
    }).select('fullName mobile avatar');

    const enrichedUsers = await Promise.all(
      matchingUsers.map(async (u) => {
        const activeRoom = await Room.findOne({ currentResident: u._id, isDeleted: false })
          .populate('block', 'name code')
          .select('roomNumber floor block');
        return {
          _id: u._id,
          fullName: u.fullName,
          mobile: u.mobile,
          room: activeRoom ? activeRoom.roomNumber : 'Unassigned',
          block: activeRoom?.block ? activeRoom.block.name : 'N/A',
          blockId: activeRoom?.block ? activeRoom.block._id : null,
          roomId: activeRoom ? activeRoom._id : null,
        };
      })
    );

    res.json({
      success: true,
      residents: enrichedUsers,
      rooms: matchingRooms.map((r) => ({
        roomId: r._id,
        roomNumber: r.roomNumber,
        blockName: r.block?.name,
        blockId: r.block?._id,
        floor: r.floor,
        residentName: r.currentResident?.fullName || 'Vacant',
        residentMobile: r.currentResident?.mobile || '',
        residentId: r.currentResident?._id || null,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// @desc Record resident movement (Entry or Exit)
// @route POST /api/security/resident-movement
export const logResidentMovement = async (req, res, next) => {
  try {
    const { residentId, roomId, blockId, logType, vehicleNumber, notes } = req.body;

    if (!['resident_entry', 'resident_exit', 'vehicle_entry', 'vehicle_exit', 'incident'].includes(logType)) {
      return res.status(400).json({ success: false, message: 'Invalid log type' });
    }

    let residentName = '';
    if (residentId) {
      const resident = await User.findById(residentId);
      if (resident) residentName = resident.fullName;
    }

    let roomNumber = '';
    if (roomId) {
      const room = await Room.findById(roomId);
      if (room) roomNumber = room.roomNumber;
    }

    const log = await SecurityLog.create({
      logType,
      resident: residentId || null,
      residentName,
      room: roomId || null,
      roomNumber,
      block: blockId || null,
      vehicleNumber: vehicleNumber ? vehicleNumber.toUpperCase().trim() : undefined,
      actionTime: new Date(),
      securityStaff: req.user._id,
      securityStaffName: req.user.fullName,
      notes,
    });

    res.status(201).json({
      success: true,
      message: 'Movement recorded successfully',
      data: log,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get Security Logs with filter
// @route GET /api/security/logs
export const getSecurityLogs = async (req, res, next) => {
  try {
    const { logType, blockId, startDate, endDate, search } = req.query;
    let query = {};

    if (logType) query.logType = logType;
    if (blockId) query.block = blockId;

    if (search) {
      const s = { $regex: search.trim(), $options: 'i' };
      query.$or = [
        { residentName: s },
        { visitorName: s },
        { roomNumber: s },
        { vehicleNumber: s },
      ];
    }

    if (startDate || endDate) {
      query.actionTime = {};
      if (startDate) query.actionTime.$gte = new Date(startDate);
      if (endDate) query.actionTime.$lte = new Date(endDate);
    }

    const logs = await SecurityLog.find(query)
      .populate('block', 'name code')
      .populate('securityStaff', 'fullName')
      .sort({ actionTime: -1 })
      .limit(100);

    res.json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get Security Desk KPIs
// @route GET /api/security/stats
export const getSecurityStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const visitorsInside = await Visitor.countDocuments({ status: 'inside' });
    const todayVisitors = await Visitor.countDocuments({ entryTime: { $gte: today } });
    const todayCheckouts = await Visitor.countDocuments({
      status: 'checked_out',
      actualExitTime: { $gte: today },
    });

    const todayResidentMovements = await SecurityLog.countDocuments({
      actionTime: { $gte: today },
      logType: { $in: ['resident_entry', 'resident_exit'] },
    });

    res.json({
      success: true,
      stats: {
        visitorsInside,
        todayVisitors,
        todayCheckouts,
        todayResidentMovements,
      },
    });
  } catch (error) {
    next(error);
  }
};
