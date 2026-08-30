import express from 'express';
import {
  getRooms,
  getAvailableRooms,
  getRoomById,
  createRoom,
  updateRoom,
  allocateRoom,
  deleteRoom,
} from '../controllers/roomController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Available rooms can be queried by logged-in users / guests
router.get('/available', getAvailableRooms);

router.use(protect);

router.get('/', getRooms);
router.get('/:id', getRoomById);
router.post('/', authorize('super_admin', 'block_admin'), createRoom);
router.put('/:id', authorize('super_admin', 'block_admin'), updateRoom);
router.post('/:id/allocate', authorize('super_admin', 'block_admin', 'receptionist'), allocateRoom);
router.delete('/:id', authorize('super_admin', 'block_admin'), deleteRoom);

export default router;
