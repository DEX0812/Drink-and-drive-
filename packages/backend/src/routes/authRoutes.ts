import { Router } from 'express';
import {
  register,
  login,
  sendOtp,
  verifyOtp,
  registerRider,
  registerDriver
} from '../controllers/authController';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/otp/send', sendOtp);
router.post('/otp/verify', verifyOtp);
router.post('/register/rider', registerRider);
router.post('/register/driver', registerDriver);

export default router;
