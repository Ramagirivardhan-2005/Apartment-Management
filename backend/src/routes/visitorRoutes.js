import express from 'express';
import {
  getVisitors,
  registerVisitor,
  checkOutVisitor,
} from '../controllers/visitorController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getVisitors);
router.post('/', authorize('super_admin', 'block_admin', 'receptionist', 'security', 'resident'), registerVisitor);
router.post('/:id/check-out', authorize('super_admin', 'block_admin', 'receptionist', 'security'), checkOutVisitor);

export default router;
