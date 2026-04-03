import express from 'express';
import { authenticate } from '../middleware/auth';
import { createRide, getRiderRides, rateRide, fareEstimate, getRide, cancelRide } from '../controllers/rideController';

const router = express.Router();

router.get('/estimate', authenticate, fareEstimate);
router.post('/request', authenticate, createRide);
router.get('/history', authenticate, getRiderRides);
router.get('/:id', authenticate, getRide);
router.post('/cancel', authenticate, cancelRide);
router.post('/rate', authenticate, rateRide);

export default router;
