import { Block } from '../models/Block.js';
import { Room } from '../models/Room.js';
import { User } from '../models/User.js';
import { ParkingSlot } from '../models/ParkingSlot.js';
import { Payment } from '../models/Payment.js';
import { Due } from '../models/Due.js';
import { Visitor } from '../models/Visitor.js';
import { Complaint } from '../models/Complaint.js';
import { AuditLog } from '../models/AuditLog.js';

// @desc Get System Overview Statistics (Super Admin Dashboard)
// @route GET /api/reports/system-overview
export const getSystemOverview = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayOfYear = new Date(today.getFullYear(), 0, 1);

    // 1. Blocks
    const totalBlocks = await Block.countDocuments({ isDeleted: false });
    const activeBlocks = await Block.countDocuments({ status: 'active', isDeleted: false });
    const inactiveBlocks = await Block.countDocuments({ status: 'inactive', isDeleted: false });

    // 2. Block Admins & Receptionists
    const totalBlockAdmins = await User.countDocuments({ role: 'block_admin', isDeleted: false });
    const totalReceptionists = await User.countDocuments({ role: 'receptionist', isDeleted: false });

    // 3. Rooms
    const totalRooms = await Room.countDocuments({ isDeleted: false });
    const availableRooms = await Room.countDocuments({ status: { $in: ['AVAILABLE', 'available'] }, isDeleted: false });
    const occupiedRooms = await Room.countDocuments({ status: { $in: ['OCCUPIED', 'occupied', 'ALLOCATED'] }, isDeleted: false });
    const maintenanceRooms = await Room.countDocuments({ status: { $in: ['MAINTENANCE', 'maintenance'] }, isDeleted: false });
    const reservedRooms = await Room.countDocuments({ status: { $in: ['RESERVED', 'reserved'] }, isDeleted: false });

    // 4. Residents
    const totalResidents = await User.countDocuments({ role: 'resident', isDeleted: false });
    const activeResidents = await User.countDocuments({ role: 'resident', status: 'active', isDeleted: false });
    const newResidentsThisMonth = await User.countDocuments({
      role: 'resident',
      createdAt: { $gte: firstDayOfMonth },
    });

    // 5. Parking
    const totalParking = await ParkingSlot.countDocuments({ isDeleted: false });
    const availableParking = await ParkingSlot.countDocuments({ status: { $in: ['AVAILABLE', 'available'] }, isDeleted: false });
    const allocatedParking = await ParkingSlot.countDocuments({ status: { $in: ['OCCUPIED', 'occupied', 'ALLOCATED', 'allocated'] }, isDeleted: false });

    // 6. Financials
    const payments = await Payment.find({ status: { $in: ['SUCCESS', 'successful'] }, isDeleted: false });
    let totalRevenue = 0;
    let todayRevenue = 0;
    let monthRevenue = 0;
    let yearRevenue = 0;

    payments.forEach((p) => {
      const amt = Number(p.amount || 0);
      totalRevenue += amt;
      const pDate = new Date(p.paymentDate || p.createdAt);

      if (pDate >= today) todayRevenue += amt;
      if (pDate >= firstDayOfMonth) monthRevenue += amt;
      if (pDate >= firstDayOfYear) yearRevenue += amt;
    });

    // 7. Recent Transactions (last 10)
    const recentPayments = await Payment.find({ isDeleted: false })
      .populate('block', 'name code')
      .populate('user', 'fullName registrationId')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        blocks: { totalBlocks, activeBlocks, inactiveBlocks },
        staff: { totalBlockAdmins, totalReceptionists },
        rooms: { totalRooms, availableRooms, occupiedRooms, maintenanceRooms, reservedRooms },
        residents: { totalResidents, activeResidents, newResidentsThisMonth },
        parking: { totalParking, availableParking, allocatedParking },
        financial: {
          todayRevenue,
          monthRevenue,
          yearRevenue,
          totalRevenue,
          successfulPaymentsCount: payments.length,
        },
        recentPayments,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get Audit Logs (Super Admin only)
// @route GET /api/reports/audit-logs
export const getAuditLogs = async (req, res, next) => {
  try {
    const { action, entityType, startDate, endDate, search } = req.query;
    let query = {};

    if (action) query.action = action;
    if (entityType) query.entityType = entityType;

    if (search) {
      const s = { $regex: search.trim(), $options: 'i' };
      query.$or = [{ userName: s }, { action: s }, { entityType: s }, { ipAddress: s }];
    }

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(query)
      .populate('user', 'fullName email role')
      .sort({ timestamp: -1 })
      .limit(200);

    res.json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};
