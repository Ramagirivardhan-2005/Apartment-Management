import express from 'express';
import {
  getParkingSlots,
  createParkingSlot,
  updateParkingSlot,
  allocateParkingSlot,
  deleteParkingSlot,
} from '../controllers/parkingController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getParkingSlots);
router.post('/', authorize('super_admin', 'block_admin'), createParkingSlot);
router.put('/:id', authorize('super_admin', 'block_admin'), updateParkingSlot);
router.post('/:id/allocate', authorize('super_admin', 'block_admin', 'receptionist'), allocateParkingSlot);
router.delete('/:id', authorize('super_admin', 'block_admin'), deleteParkingSlot);

export default router;
