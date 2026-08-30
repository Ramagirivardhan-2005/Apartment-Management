import { Room } from '../models/Room.js';
import { Block } from '../models/Block.js';
import { User } from '../models/User.js';
import { logAudit } from '../middleware/audit.js';

// @desc Get rooms with filters & scoped block access (Section 4 & 11)
// @route GET /api/rooms
export const getRooms = async (req, res, next) => {
  try {
    const { blockId, status, roomType, minRent, maxRent, floor } = req.query;
    let query = { isDeleted: false };

    // Scoped restriction for Block Admin and Receptionist
    if (req.user && (req.user.role === 'block_admin' || req.user.role === 'receptionist')) {
      if (!req.user.assignedBlock) {
        return res.json({ success: true, count: 0, data: [] });
      }
      query.block = req.user.assignedBlock;
    } else if (blockId) {
      query.block = blockId;
    }

    if (status) query.status = status.toUpperCase();
    if (roomType) query.roomType = roomType;
    if (floor) query.floor = Number(floor);

    if (minRent || maxRent) {
      query.monthlyRent = {};
      if (minRent) query.monthlyRent.$gte = Number(minRent);
      if (maxRent) query.monthlyRent.$lte = Number(maxRent);
    }

    const rooms = await Room.find(query)
      .populate('block', 'name code address floors')
      .populate('currentResident', 'fullName email mobile registrationId')
      .sort({ roomNumber: 1 });

    res.json({
      success: true,
      count: rooms.length,
      data: rooms,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get Available Rooms for public / resident booking (Section 11)
// @route GET /api/rooms/available
export const getAvailableRooms = async (req, res, next) => {
  try {
    const { blockId, roomType, maxRent, ac, includeBooked } = req.query;
    let query = { isDeleted: false };

    if (!includeBooked || includeBooked === 'false') {
      query.status = { $in: ['AVAILABLE', 'available'] };
    }

    if (blockId) query.block = blockId;
    if (roomType && roomType !== 'Any') query.roomType = roomType;
    if (maxRent) query.monthlyRent = { $lte: Number(maxRent) };
    if (ac !== undefined && ac !== '') {
      query.isAirConditioned = ac === 'true' || ac === true;
    }

    const rooms = await Room.find(query)
      .populate('block', 'name code address')
      .sort({ roomNumber: 1 });

    res.json({
      success: true,
      count: rooms.length,
      data: rooms,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get single room
// @route GET /api/rooms/:id
export const getRoomById = async (req, res, next) => {
  try {
    const room = await Room.findOne({ _id: req.params.id, isDeleted: false })
      .populate('block', 'name code address')
      .populate('currentResident', 'fullName email mobile registrationId');

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    if ((req.user.role === 'block_admin' || req.user.role === 'receptionist') &&
        req.user.assignedBlock?.toString() !== room.block._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized: Cannot view rooms of another block' });
    }

    res.json({
      success: true,
      data: room,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Create room (Block Admin for assigned block, Super Admin globally) (Section 4)
// @desc Create room (Block Admin for assigned block, Super Admin globally) (Section 4)
// @route POST /api/rooms
export const createRoom = async (req, res, next) => {
  try {
    const {
      roomNumber,
      blockId,
      block,
      floor,
      roomType,
      areaSqFt,
      bedrooms,
      monthlyRent,
      securityDeposit,
      status,
      isAirConditioned,
      ac,
      furnishingStatus,
      amenities,
    } = req.body;

    const rawBlock = blockId || block || req.body.assignedBlock || req.user?.assignedBlock;
    const targetBlockId = rawBlock && typeof rawBlock === 'object' && rawBlock._id ? rawBlock._id : rawBlock;

    if (!targetBlockId) {
      return res.status(400).json({ success: false, message: 'Block assignment is required' });
    }

    if (!roomNumber || monthlyRent === undefined || monthlyRent === null || monthlyRent === '') {
      return res.status(400).json({ success: false, message: 'Room number and monthly rent are required' });
    }

    const cleanRoomNo = String(roomNumber).trim();

    // Check duplicate room in block
    const existing = await Room.findOne({
      block: targetBlockId,
      roomNumber: cleanRoomNo,
      isDeleted: false,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Room '${cleanRoomNo}' already exists in this block.`,
      });
    }

    const isAcValue = isAirConditioned !== undefined ? Boolean(isAirConditioned) : (ac !== undefined ? Boolean(ac) : true);

    const room = await Room.create({
      roomNumber: cleanRoomNo,
      block: targetBlockId,
      floor: Number(floor) || 1,
      roomType: roomType || 'Double',
      areaSqFt: Number(areaSqFt) || 850,
      bedrooms: Number(bedrooms) || 2,
      monthlyRent: Number(monthlyRent),
      securityDeposit: Number(securityDeposit !== undefined && securityDeposit !== '' ? securityDeposit : monthlyRent),
      status: status ? status.toUpperCase() : 'AVAILABLE',
      isAirConditioned: isAcValue,
      furnishingStatus: furnishingStatus || 'Semi Furnished',
      amenities: amenities || [],
    });

    // Update block totalRooms count
    const totalCount = await Room.countDocuments({ block: targetBlockId, isDeleted: false });
    await Block.findByIdAndUpdate(targetBlockId, { totalRooms: totalCount });

    await logAudit({
      user: req.user,
      action: 'ROOM_CREATED',
      blockId: targetBlockId,
      entityType: 'Room',
      entityId: room._id,
      newValue: { roomNumber: cleanRoomNo, monthlyRent, status: room.status },
      req,
    });

    res.status(201).json({
      success: true,
      message: `Room ${cleanRoomNo} created successfully`,
      data: room,
    });
  } catch (error) {
    console.error('[Create Room Error]', error);
    next(error);
  }
};

// @desc Update Room (Section 4)
// @route PUT /api/rooms/:id
export const updateRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room || room.isDeleted) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    const adminBlockId = req.user.assignedBlock?._id || req.user.assignedBlock;
    if (req.user.role === 'block_admin' && room.block.toString() !== adminBlockId?.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized: Cannot edit room in another block' });
    }

    const previousValue = room.toObject();
    const {
      roomNumber,
      floor,
      roomType,
      areaSqFt,
      bedrooms,
      monthlyRent,
      securityDeposit,
      status,
      isAirConditioned,
      ac,
      furnishingStatus,
      amenities,
    } = req.body;

    if (roomNumber) room.roomNumber = String(roomNumber).trim();
    if (floor !== undefined && floor !== '') room.floor = Number(floor);
    if (roomType) room.roomType = roomType;
    if (areaSqFt !== undefined && areaSqFt !== '') room.areaSqFt = Number(areaSqFt);
    if (bedrooms !== undefined && bedrooms !== '') room.bedrooms = Number(bedrooms);
    if (monthlyRent !== undefined && monthlyRent !== '') room.monthlyRent = Number(monthlyRent);
    if (securityDeposit !== undefined && securityDeposit !== '') room.securityDeposit = Number(securityDeposit);
    if (status) room.status = status.toUpperCase();
    if (isAirConditioned !== undefined) room.isAirConditioned = Boolean(isAirConditioned);
    else if (ac !== undefined) room.isAirConditioned = Boolean(ac);
    if (furnishingStatus) room.furnishingStatus = furnishingStatus;
    if (amenities) room.amenities = amenities;

    await room.save();

    await logAudit({
      user: req.user,
      action: 'ROOM_UPDATED',
      blockId: room.block,
      entityType: 'Room',
      entityId: room._id,
      previousValue,
      newValue: room.toObject(),
      req,
    });

    res.json({
      success: true,
      message: 'Room updated successfully',
      data: room,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Allocate Room to Resident (Section 8 & 20: Atomic check preventing double allocation)
// @route POST /api/rooms/:id/allocate
export const allocateRoom = async (req, res, next) => {
  try {
    const { residentId } = req.body;
    if (!residentId) {
      return res.status(400).json({ success: false, message: 'Resident ID is required for room allocation' });
    }

    const resident = await User.findById(residentId);
    if (!resident || resident.role !== 'resident' || resident.isDeleted) {
      return res.status(404).json({ success: false, message: 'Resident account not found' });
    }

    const room = await Room.findById(req.params.id);
    if (!room || room.isDeleted) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    // Scoped restriction
    if (req.user.role === 'receptionist' || req.user.role === 'block_admin') {
      if (room.block.toString() !== req.user.assignedBlock?.toString()) {
        return res.status(403).json({ success: false, message: 'Unauthorized: Cannot allocate room in another block' });
      }
    }

    // Atomic Room Allocation check (Section 20: Room cannot be allocated to two active users simultaneously)
    const allocatedRoom = await Room.findOneAndUpdate(
      { _id: room._id, status: 'AVAILABLE' },
      {
        status: 'OCCUPIED',
        currentResident: resident._id,
      },
      { new: true }
    );

    if (!allocatedRoom) {
      return res.status(400).json({
        success: false,
        message: 'Room is no longer available. It may have already been reserved or allocated.',
      });
    }

    // Associate resident with block
    resident.assignedBlock = room.block;
    await resident.save();

    await logAudit({
      user: req.user,
      action: 'ROOM_ALLOCATED_BY_STAFF',
      blockId: room.block,
      entityType: 'Room',
      entityId: room._id,
      newValue: {
        roomNumber: room.roomNumber,
        allocatedTo: resident.fullName,
        registrationId: resident.registrationId,
      },
      req,
    });

    res.json({
      success: true,
      message: `Room ${room.roomNumber} successfully allocated to ${resident.fullName} (${resident.registrationId})`,
      data: allocatedRoom,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Delete room
// @route DELETE /api/rooms/:id
export const deleteRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room || room.isDeleted) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    if (req.user.role === 'block_admin' && room.block.toString() !== req.user.assignedBlock?.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized: Cannot delete room in another block' });
    }

    room.isDeleted = true;
    room.status = 'UNAVAILABLE';
    await room.save();

    await logAudit({
      user: req.user,
      action: 'ROOM_DELETED',
      blockId: room.block,
      entityType: 'Room',
      entityId: room._id,
      req,
    });

    res.json({
      success: true,
      message: 'Room removed successfully',
    });
  } catch (error) {
    next(error);
  }
};
