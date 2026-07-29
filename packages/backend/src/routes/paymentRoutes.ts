import express from 'express';
import { createPaymentIntent, handleWebhook } from '../controllers/paymentController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.post('/create-intent', authenticate, createPaymentIntent);
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

export default router;
