import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  toggleStatus,
  getAvailableRequests,
  acceptRide,
  completeRide,
  finishRide,
  getDriverProfile,
  verifyOtp,
  updateDocuments,
} from '../controllers/driverController';

const router = express.Router();

// All driver routes require authentication
router.use(authenticate);

router.get('/profile', getDriverProfile);
router.post('/status', toggleStatus);
router.get('/requests', getAvailableRequests);
router.post('/accept', acceptRide);
router.post('/complete', completeRide);
router.post('/finish', finishRide);
router.post('/verify-otp', verifyOtp);
router.patch('/documents', updateDocuments);

export default router;
