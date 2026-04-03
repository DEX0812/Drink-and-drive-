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

    const updated = await prisma.ride.update({
      where: { id: rideId },
      data: { status: 'ONGOING', startTime: ride.startTime || new Date() },
    });

    // Notify rider
    io.to(`ride:${rideId}`).emit('rideStatusUpdate', {
      rideId,
      status: 'ONGOING',
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
