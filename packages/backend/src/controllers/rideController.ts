import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { getRouteInfo } from '../utils/osrm';
import { io } from '../index';

interface AuthRequest extends Request {
  user?: any;
}

// ─── Haversine Distance ─────────────────────────────────────────────────────
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

// ─── Fare Calculation ───────────────────────────────────────────────────────
function calculateFare(distanceKm: number, durationHrs: number, type: string, serviceLevel: string): number {
  if (type === 'HIRING') {
    // Driver for personal car: min ₹300 or ₹350/hr
    return Math.max(300, durationHrs * 350);
  }
  // Ride-hailing
  const baseFare = serviceLevel === 'PREMIUM' ? 80 : 40;
  const ratePerKm = serviceLevel === 'PREMIUM' ? 18 : 12;
  const ratePerMin = serviceLevel === 'PREMIUM' ? 3 : 2;
  return baseFare + distanceKm * ratePerKm + durationHrs * 60 * ratePerMin;
}

// GET /api/rides/estimate — Calculate fare before booking
export const fareEstimate = async (req: AuthRequest, res: Response) => {
  const { pickupLat, pickupLng, dropoffLat, dropoffLng, type = 'RIDE_HAILING' } = req.query;

  try {
    const route = await getRouteInfo(
      Number(pickupLat), Number(pickupLng),
      Number(dropoffLat), Number(dropoffLng)
    );

    if (!route) {
      return res.status(400).json({ message: 'Could not calculate route' });
    }

    const distanceKm = route.distance / 1000;
    const durationHrs = route.duration / 3600;

    const estimates = {
      STANDARD: calculateFare(distanceKm, durationHrs, String(type), 'STANDARD'),
      PREMIUM: calculateFare(distanceKm, durationHrs, String(type), 'PREMIUM'),
    };

    res.json({
      distanceKm: Math.round(distanceKm * 10) / 10,
      durationMin: Math.round(route.duration / 60),
      estimates,
      route,
    });
  } catch (err) {
    console.error('Fare estimate error:', err);
    res.status(500).json({ message: 'Error calculating fare' });
  }
};

// POST /api/rides/request — Create a new ride
export const createRide = async (req: AuthRequest, res: Response) => {
  const {
    pickupLat, pickupLng, dropoffLat, dropoffLng,
    pickupAddr, dropoffAddr,
    type, vehicleId,
    serviceLevel = 'STANDARD',
  } = req.body;
  const riderId = req.user.id;

  try {
    const route = await getRouteInfo(pickupLat, pickupLng, dropoffLat, dropoffLng);
    if (!route) {
      return res.status(400).json({ message: 'Could not calculate route' });
    }

    const distanceKm = route.distance / 1000;
    const durationHrs = route.duration / 3600;
    const price = calculateFare(distanceKm, durationHrs, type, serviceLevel);

    // Transmission check for HIRING
    let transmissionReq: 'MANUAL' | 'AUTO' = 'AUTO';
    if (type === 'HIRING') {
      if (!vehicleId) {
        return res.status(400).json({ message: 'Vehicle must be specified for driver hiring' });
      }
      const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
      if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
      transmissionReq = vehicle.transmission as any;
    }

    // Find nearest available drivers (sorted by distance)
    const candidates = await prisma.driverProfile.findMany({
      where: {
        isOnline: true,
        status: 'ACTIVE',
        ...(type === 'HIRING' && transmissionReq === 'MANUAL' ? { manualCertified: true } : {}),
        lastLocationLat: { not: null },
        lastLocationLng: { not: null },
      },
      take: 20,
    });

    const sorted = candidates
      .filter((d) => d.lastLocationLat && d.lastLocationLng)
      .map((d) => ({
        ...d,
        dist: haversine(d.lastLocationLat!, d.lastLocationLng!, pickupLat, pickupLng),
      }))
      .sort((a, b) => a.dist - b.dist);

    const matchedDriverId = sorted.length > 0 ? sorted[0].driverId : null;

    // Create ride
    const ride = await prisma.ride.create({
      data: {
        riderId,
        driverId: matchedDriverId,
        type,
        serviceLevel,
        pickupLat,
        pickupLng,
        dropoffLat,
        dropoffLng,
        pickupAddr,
        dropoffAddr,
        price,
        status: matchedDriverId ? 'ACCEPTED' : 'REQUESTED',
        distance: distanceKm,
      },
      include: {
        driver: { select: { name: true } },
      },
    });

    // Notify nearest driver via socket
    if (matchedDriverId) {
      io.to(`driver:${matchedDriverId}`).emit('rideRequested', {
        rideId: ride.id,
        riderId,
        riderName: req.user.name,
        pickupLat,
        pickupLng,
        dropoffLat,
        dropoffLng,
        pickupAddr,
        dropoffAddr,
        type,
        price,
        distanceKm: Math.round(distanceKm * 10) / 10,
      });
    }

    res.status(201).json({ ride, route, price });
  } catch (err) {
    console.error('Create ride error:', err);
    res.status(500).json({ message: 'Server error creating ride' });
  }
};

// GET /api/rides/:id — Get single ride details
export const getRide = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const ride = await prisma.ride.findUnique({
      where: { id },
      include: {
        rider: { select: { name: true, email: true } },
        driver: { select: { name: true } },
        payments: true,
        reviews: true,
      },
    });
    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    res.json(ride);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching ride' });
  }
};

// GET /api/rides/history — Get rider's ride history
export const getRiderRides = async (req: AuthRequest, res: Response) => {
  try {
    const rides = await prisma.ride.findMany({
      where: { riderId: req.user.id },
      include: { driver: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(rides);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching ride history' });
  }
};

// POST /api/rides/cancel — Cancel a ride
export const cancelRide = async (req: AuthRequest, res: Response) => {
  const { rideId } = req.body;

  try {
    const ride = await prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    if (ride.riderId !== req.user.id && ride.driverId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to cancel this ride' });
    }
    if (['COMPLETED', 'CANCELLED'].includes(ride.status)) {
      return res.status(400).json({ message: 'Ride cannot be cancelled in current status' });
    }

    await prisma.ride.update({ where: { id: rideId }, data: { status: 'CANCELLED' } });

    // Notify both parties
    io.to(`ride:${rideId}`).emit('rideCancelled', { rideId });
    if (ride.driverId) {
      io.to(`driver:${ride.driverId}`).emit('rideCancelled', { rideId });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Error cancelling ride' });
  }
};

// POST /api/rides/rate — Rate a completed ride
export const rateRide = async (req: AuthRequest, res: Response) => {
  const { rideId, rating, comment } = req.body;

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Rating must be between 1 and 5' });
  }

  try {
    const ride = await prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride || ride.riderId !== req.user.id) {
      return res.status(404).json({ message: 'Ride not found' });
    }
    if (ride.status !== 'COMPLETED') {
      return res.status(400).json({ message: 'Can only rate completed rides' });
    }

    // Update ride rating
    await prisma.ride.update({ where: { id: rideId }, data: { rating } });

    // Create review record
    if (ride.driverId) {
      await prisma.review.create({
        data: {
          rideId,
          fromUserId: req.user.id,
          toUserId: ride.driverId,
          rating,
          comment,
        },
      });

      // Update driver's average rating
      const aggregate = await prisma.ride.aggregate({
        where: { driverId: ride.driverId, rating: { not: null } },
        _avg: { rating: true },
      });

      await prisma.driverProfile.update({
        where: { driverId: ride.driverId },
        data: { rating: aggregate._avg.rating || 0 },
      });
    }

    res.json({ message: 'Rating submitted successfully' });
  } catch (err) {
    console.error('Rate ride error:', err);
    res.status(500).json({ message: 'Error submitting rating' });
  }
};
