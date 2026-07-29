import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { io } from '../index';

interface AuthRequest extends Request {
  user?: any;
}

// ─── Haversine Distance (km) ────────────────────────────────────────────────
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// POST /api/driver/status — Toggle online/offline
export const toggleStatus = async (req: AuthRequest, res: Response) => {
  const { isOnline } = req.body;
  const driverId = req.user.id;

  try {
    const profile = await prisma.driverProfile.update({
      where: { driverId },
      data: { isOnline },
    });
    res.json({ success: true, isOnline: profile.isOnline });
  } catch (err) {
    console.error('Toggle status error:', err);
    res.status(500).json({ message: 'Could not update status' });
  }
};

// GET /api/driver/requests — Get available ride requests near driver
export const getAvailableRequests = async (req: AuthRequest, res: Response) => {
  const driverId = req.user.id;

  try {
    const profile = await prisma.driverProfile.findUnique({ where: { driverId } });
    if (!profile) return res.status(404).json({ message: 'Driver profile not found' });
    if (!profile.isOnline) return res.json([]);

    const rides = await prisma.ride.findMany({
      where: { status: 'REQUESTED' },
      include: { rider: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // If driver has location, sort by distance
    let sorted = rides;
    if (profile.lastLocationLat && profile.lastLocationLng) {
      sorted = rides
        .map((r) => ({
          ...r,
          distance: haversine(
            profile.lastLocationLat!,
            profile.lastLocationLng!,
            r.pickupLat,
            r.pickupLng
          ),
        }))
        .sort((a, b) => a.distance - b.distance);
    }

    res.json(sorted);
  } catch (err) {
    console.error('Get requests error:', err);
    res.status(500).json({ message: 'Error fetching ride requests' });
  }
};

// POST /api/driver/accept — Accept a ride request
export const acceptRide = async (req: AuthRequest, res: Response) => {
  const { rideId } = req.body;
  const driverId = req.user.id;

  try {
    // Ensure ride is still available
    const ride = await prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    if (ride.status !== 'REQUESTED') {
      return res.status(409).json({ message: 'Ride is no longer available' });
    }

    // Claim the ride atomically
    const updated = await prisma.ride.update({
      where: { id: rideId, status: 'REQUESTED' }, // optimistic lock
      data: { driverId, status: 'ACCEPTED' },
      include: {
        rider: { select: { name: true, email: true } },
        driver: { select: { name: true } },
      },
    });

    // Notify rider via socket room
    io.to(`ride:${rideId}`).emit('rideAccepted', {
      rideId,
      driverId,
      driverName: updated.driver?.name,
      status: 'ACCEPTED',
    });

    // Simulated Push Notification
    io.to(`ride:${rideId}`).emit('push-notification', {
      title: '🚖 Driver Found!',
      body: `${updated.driver?.name} is on the way to your location.`,
      type: 'DRIVER_ACCEPTED'
    });

    res.json({ success: true, ride: updated });
  } catch (err: any) {
    if (err.code === 'P2025') {
      return res.status(409).json({ message: 'Ride was just accepted by another driver' });
    }
    console.error('Accept ride error:', err);
    res.status(500).json({ message: 'Error accepting ride' });
  }
};

// POST /api/driver/complete — Complete an active ride
export const completeRide = async (req: AuthRequest, res: Response) => {
  const { rideId } = req.body;
  const driverId = req.user.id;

  try {
    const ride = await prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride || ride.driverId !== driverId) {
      return res.status(403).json({ message: 'Not authorized for this ride' });
    }

    if (!ride.otpVerified) {
      return res.status(400).json({ message: 'Please verify the ride OTP first.' });
    }

    const updated = await prisma.ride.update({
      where: { id: rideId },
      data: { status: 'ONGOING', startTime: ride.startTime || new Date() },
    });

    // Notify rider
    io.to(`ride:${rideId}`).emit('rideStatusUpdate', {
      rideId,
      status: 'ONGOING',
    });

    io.to(`ride:${rideId}`).emit('push-notification', {
      title: '🚀 Trip Started',
      body: 'Your safe journey with DriveSafe has officially begun.',
      type: 'RIDE_STARTED'
    });

    res.json({ success: true, ride: updated });
  } catch (err) {
    console.error('Complete ride error:', err);
    res.status(500).json({ message: 'Error completing ride' });
  }
};

// POST /api/driver/finish — Mark ride as fully COMPLETED after drop-off
export const finishRide = async (req: AuthRequest, res: Response) => {
  const { rideId } = req.body;
  const driverId = req.user.id;

  try {
    const ride = await prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride || ride.driverId !== driverId) {
      return res.status(403).json({ message: 'Not authorized for this ride' });
    }

    const updated = await prisma.ride.update({
      where: { id: rideId },
      data: { status: 'COMPLETED', endTime: new Date() },
    });

    // Notify rider — trigger payment screen
    io.to(`ride:${rideId}`).emit('rideCompleted', {
      rideId,
      status: 'COMPLETED',
      price: updated.price,
    });

    io.to(`ride:${rideId}`).emit('push-notification', {
      title: '🏁 Destination Reached',
      body: `You have arrived safely. Total fare: ₹${Math.round(updated.price || 0)}.`,
      type: 'RIDE_FINISHED'
    });

    res.json({ success: true, ride: updated });
  } catch (err) {
    console.error('Finish ride error:', err);
    res.status(500).json({ message: 'Error finishing ride' });
  }
};

// GET /api/driver/profile — Get own driver profile with stats
export const getDriverProfile = async (req: AuthRequest, res: Response) => {
  const driverId = req.user.id;

  try {
    const profile = await prisma.driverProfile.findUnique({
      where: { driverId },
      include: { driver: { select: { name: true, email: true } } },
    });

    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    // Get today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayRides, todayEarnings] = await Promise.all([
      prisma.ride.count({
        where: { driverId, status: 'COMPLETED', endTime: { gte: today } },
      }),
      prisma.ride.aggregate({
        where: { driverId, status: 'COMPLETED', endTime: { gte: today } },
        _sum: { price: true },
      }),
    ]);

    res.json({
      ...profile,
      stats: {
        todayRides,
        todayEarnings: todayEarnings._sum.price || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching profile' });
  }
};

// POST /api/driver/verify-otp
export const verifyOtp = async (req: AuthRequest, res: Response) => {
  const { rideId, otp } = req.body;
  const driverId = req.user.id;

  try {
    const ride = await prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride || ride.driverId !== driverId) {
      return res.status(403).json({ message: 'Not authorized for this ride' });
    }

    if (ride.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP. Please ask the rider for the correct code.' });
    }

    await prisma.ride.update({
      where: { id: rideId },
      data: { otpVerified: true },
    });

    res.json({ success: true, message: 'OTP Verified successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error verifying OTP' });
  }
};

// PATCH /api/driver/documents — Update driver verification documents
export const updateDocuments = async (req: AuthRequest, res: Response) => {
  const { licenseUrl, insuranceUrl, backgroundCheckUrl } = req.body;
  const driverId = req.user.id;

  try {
    const profile = await prisma.driverProfile.update({
      where: { driverId },
      data: {
        licenseUrl,
        insuranceUrl,
        backgroundCheckUrl,
        status: 'PENDING', // Re-trigger verification logic
      },
    });
    res.json({ success: true, profile });
  } catch (err) {
    res.status(500).json({ message: 'Error updating documents' });
  }
};
