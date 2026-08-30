import express from 'express';
import {
  getReceptionists,
  createReceptionist,
  deleteReceptionist,
} from '../controllers/receptionistController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', authorize('super_admin', 'block_admin'), getReceptionists);
router.post('/', authorize('super_admin', 'block_admin'), createReceptionist);
router.delete('/:id', authorize('super_admin', 'block_admin'), deleteReceptionist);

export default router;
