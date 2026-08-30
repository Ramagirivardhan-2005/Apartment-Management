import { ParkingSlot } from '../models/ParkingSlot.js';
import { User } from '../models/User.js';
import { logAudit } from '../middleware/audit.js';

// @desc Get parking slots with scoped filtering
// @route GET /api/parking
export const getParkingSlots = async (req, res, next) => {
  try {
    const { blockId, status, vehicleType, parkingType } = req.query;
    let query = { isDeleted: false };

    if (req.user && (req.user.role === 'block_admin' || req.user.role === 'receptionist')) {
      if (!req.user.assignedBlock) {
        return res.json({ success: true, count: 0, data: [] });
      }
      query.block = req.user.assignedBlock;
    } else if (blockId) {
      query.block = blockId;
    }

    if (status) query.status = status.toUpperCase();
    if (vehicleType) query.vehicleType = vehicleType;
    if (parkingType) query.parkingType = parkingType;

    const slots = await ParkingSlot.find(query)
      .populate('block', 'name code')
      .populate('assignedUser', 'fullName email mobile registrationId')
      .sort({ slotNumber: 1 });

    res.json({
      success: true,
      count: slots.length,
      data: slots,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Create Parking Slot (Section 5)
// @route POST /api/parking
export const createParkingSlot = async (req, res, next) => {
  try {
    const {
      slotNumber,
      blockId,
      floorArea,
      parkingType,
      vehicleType,
      monthlyFee,
      status,
    } = req.body;

    const targetBlockId = req.user.role === 'block_admin' ? req.user.assignedBlock : (blockId || req.body.block);

    if (!targetBlockId) {
      return res.status(400).json({ success: false, message: 'Block assignment is required' });
    }

    if (!slotNumber) {
      return res.status(400).json({ success: false, message: 'Slot number is required' });
    }

    const cleanSlotNo = String(slotNumber).trim();

    const existing = await ParkingSlot.findOne({
      block: targetBlockId,
      slotNumber: cleanSlotNo,
      isDeleted: false,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Parking slot '${cleanSlotNo}' already exists in this block.`,
      });
    }

    const slot = await ParkingSlot.create({
      slotNumber: cleanSlotNo,
      block: targetBlockId,
      floorArea: floorArea || 'Ground Floor',
      parkingType: parkingType || 'Covered',
      vehicleType: vehicleType || '4-Wheeler',
      monthlyFee: monthlyFee ? Number(monthlyFee) : 1500,
      status: status ? status.toUpperCase() : 'AVAILABLE',
    });

    await logAudit({
      user: req.user,
      action: 'PARKING_SLOT_CREATED',
      blockId: targetBlockId,
      entityType: 'Parking',
      entityId: slot._id,
      newValue: { slotNumber: cleanSlotNo, parkingType, vehicleType },
      req,
    });

    res.status(201).json({
      success: true,
      message: `Parking Slot ${cleanSlotNo} created successfully`,
      data: slot,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Allocate Parking Slot
// @route POST /api/parking/:id/allocate
export const allocateParkingSlot = async (req, res, next) => {
  try {
    const { residentId, vehicleNumber } = req.body;
    const slot = await ParkingSlot.findById(req.params.id);

    if (!slot || slot.isDeleted) {
      return res.status(404).json({ success: false, message: 'Parking slot not found' });
    }

    if ((req.user.role === 'block_admin' || req.user.role === 'receptionist') &&
        slot.block.toString() !== req.user.assignedBlock?.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized: Cannot allocate parking in another block' });
    }

    const resident = await User.findById(residentId);
    if (!resident || resident.role !== 'resident') {
      return res.status(404).json({ success: false, message: 'Resident not found' });
    }

    slot.assignedUser = resident._id;
    slot.vehicleNumber = vehicleNumber ? String(vehicleNumber).trim().toUpperCase() : undefined;
    slot.status = 'OCCUPIED';
    await slot.save();

    await logAudit({
      user: req.user,
      action: 'PARKING_SLOT_ALLOCATED',
      blockId: slot.block,
      entityType: 'Parking',
      entityId: slot._id,
      newValue: { slotNumber: slot.slotNumber, assignedTo: resident.fullName, vehicleNumber },
      req,
    });

    res.json({
      success: true,
      message: `Parking slot ${slot.slotNumber} allocated to ${resident.fullName}`,
      data: slot,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Update Parking Slot
// @route PUT /api/parking/:id
export const updateParkingSlot = async (req, res, next) => {
  try {
    const slot = await ParkingSlot.findById(req.params.id);
    if (!slot || slot.isDeleted) {
      return res.status(404).json({ success: false, message: 'Parking slot not found' });
    }

    if (req.user.role === 'block_admin' && slot.block.toString() !== req.user.assignedBlock?.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized: Cannot edit parking slot in another block' });
    }

    const { slotNumber, floorArea, parkingType, vehicleType, monthlyFee, status, vehicleNumber } = req.body;

    if (slotNumber) slot.slotNumber = String(slotNumber).trim();
    if (floorArea) slot.floorArea = floorArea;
    if (parkingType) slot.parkingType = parkingType;
    if (vehicleType) slot.vehicleType = vehicleType;
    if (monthlyFee !== undefined) slot.monthlyFee = Number(monthlyFee);
    if (status) slot.status = status.toUpperCase();
    if (vehicleNumber !== undefined) slot.vehicleNumber = vehicleNumber ? String(vehicleNumber).trim().toUpperCase() : undefined;

    if (slot.status === 'AVAILABLE') {
      slot.assignedUser = undefined;
      slot.vehicleNumber = undefined;
    }

    await slot.save();

    res.json({
      success: true,
      message: 'Parking slot updated successfully',
      data: slot,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Delete Parking Slot
// @route DELETE /api/parking/:id
export const deleteParkingSlot = async (req, res, next) => {
  try {
    const slot = await ParkingSlot.findById(req.params.id);
    if (!slot || slot.isDeleted) {
      return res.status(404).json({ success: false, message: 'Parking slot not found' });
    }

    if (req.user.role === 'block_admin' && slot.block.toString() !== req.user.assignedBlock?.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized: Cannot delete parking slot in another block' });
    }

    slot.isDeleted = true;
    slot.status = 'MAINTENANCE';
    await slot.save();

    res.json({
      success: true,
      message: 'Parking slot removed successfully',
    });
  } catch (error) {
    next(error);
  }
};
