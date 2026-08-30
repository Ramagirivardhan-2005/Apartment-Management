import express from 'express';
import {
  getBlocks,
  getBlockById,
  createBlock,
  updateBlock,
  deleteBlock,
} from '../controllers/blockController.js';
import { protect, authorize, checkBlockAccess } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getBlocks);
router.get('/:id', checkBlockAccess, getBlockById);
router.post('/', authorize('super_admin'), createBlock);
router.put('/:id', authorize('super_admin'), updateBlock);
router.delete('/:id', authorize('super_admin'), deleteBlock);

export default router;
