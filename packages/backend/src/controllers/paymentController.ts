import { Request, Response } from 'express';
import Stripe from 'stripe';
import prisma from '../utils/prisma';
import logger from '../utils/logger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2025-01-27.acacia' as any,
});

export const createPaymentIntent = async (req: Request, res: Response) => {
  const { rideId, amount } = req.body;

  try {
    // 🛡️ Mock Flow if Stripe isn't configured
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_placeholder') {
      console.log('🏗️ [MOCK_PAYMENT]: Creating mock payment intent for ride', rideId);
      return res.json({ 
        clientSecret: `mock_secret_${Date.now()}`,
        mock: true 
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe expects cents
      currency: 'usd',
      metadata: { rideId },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.warn('⚠️ Stripe error (falling back to mock):', err);
    res.json({ 
      clientSecret: `mock_secret_fallback_${Date.now()}`,
      mock: true
    });
  }
};

export const handleWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    if (process.env.STRIPE_WEBHOOK_SECRET) {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig!,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } else {
      // Fallback for development only
      logger.warn('⚠️ STRIPE_WEBHOOK_SECRET missing. Using unverified body (MOCK ONLY).');
      event = req.body; 
    }

    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object;
      const rideId = intent.metadata.rideId;

      // 1. Update Ride Status
      await prisma.ride.update({
        where: { id: rideId },
        data: { status: 'COMPLETED' }
      });

      // 2. Create Payment Record
      await prisma.payment.create({
        data: {
          rideId,
          amount: intent.amount / 100,
          status: 'SUCCESS',
          transactionId: intent.id
        }
      });
    }

    res.json({ received: true });
  } catch (err) {
    logger.error('Webhook Error:', err);
    res.status(400).send(`Webhook Error`);
  }
};
