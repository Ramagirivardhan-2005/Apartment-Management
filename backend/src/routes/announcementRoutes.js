import express from 'express';
import {
  createAnnouncement,
  getAnnouncements,
  deleteAnnouncement,
} from '../controllers/announcementController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getAnnouncements);
router.post('/', authorize('super_admin', 'block_admin'), createAnnouncement);
router.delete('/:id', authorize('super_admin', 'block_admin'), deleteAnnouncement);

export default router;
