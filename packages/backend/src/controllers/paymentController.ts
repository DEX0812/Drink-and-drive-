import { Request, Response } from 'express';
import Stripe from 'stripe';
import prisma from '../utils/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2025-01-27.acacia' as any,
});

export const createPaymentIntent = async (req: Request, res: Response) => {
  const { rideId, amount } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe expects cents
      currency: 'usd',
      metadata: { rideId },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Stripe Intent Error' });
  }
};

export const handleWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    // In production, use stripe.webhooks.constructEvent
    event = req.body; 

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
    console.error('Webhook Error:', err);
    res.status(400).send(`Webhook Error`);
  }
};
