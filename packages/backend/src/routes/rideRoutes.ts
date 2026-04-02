import { Router } from 'express';
import { createRide, getRiderRides, rateRide } from '../controllers/rideController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/book', authenticate, createRide);
router.get('/my-rides', authenticate, getRiderRides);
router.post('/rate', authenticate, rateRide);

export default router;
