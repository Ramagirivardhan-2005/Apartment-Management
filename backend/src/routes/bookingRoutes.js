import express from 'express';
import {
  createBooking,
  joinQueue,
  getQueue,
  getBookings,
  getBookingById,
} from '../controllers/bookingController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/', createBooking);
router.get('/', getBookings);
router.post('/queue', joinQueue);
router.get('/queue', getQueue);
router.get('/:id', getBookingById);

export default router;
