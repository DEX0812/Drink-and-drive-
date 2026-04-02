import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { getRouteInfo } from '../utils/osrm';

interface AuthRequest extends Request {
  user?: any;
}

export const createRide = async (req: AuthRequest, res: Response) => {
  const { pickupLat, pickupLng, dropoffLat, dropoffLng, type, vehicleId, serviceLevel = 'STANDARD' } = req.body;
  const riderId = req.user.id;

  try {
    // 1. Get Route Info from OSRM
    const route = await getRouteInfo(pickupLat, pickupLng, dropoffLat, dropoffLng);
    if (!route) {
      return res.status(400).json({ message: 'Could not calculate route' });
    }

    // 2. Calculate Pricing with Service Levels
    let price = 0;
    const distanceKm = route.distance / 1000;
    const durationHrs = route.duration / 3600;

    if (type === 'RIDE_HAILING') {
      const baseFare = serviceLevel === 'PREMIUM' ? 5.00 : 2.00;
      const ratePerKm = serviceLevel === 'PREMIUM' ? 3.00 : 1.50;
      price = baseFare + distanceKm * ratePerKm;
    } else if (type === 'HIRING') {
      // Driver hiring for personal car
      price = Math.max(10, durationHrs * 12); // Min $10 or $12/hr
    }

    // 3. Match Driver (Transmission check for Hiring service)
    let matchedDriverId: string | null = null;
    let transmissionReq: 'MANUAL' | 'AUTO' = 'AUTO';

    if (type === 'HIRING') {
      if (!vehicleId) {
        return res.status(400).json({ message: 'Vehicle must be specified for driver hiring service' });
      }
      const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
      if (!vehicle) {
        return res.status(404).json({ message: 'Vehicle not found' });
      }
      transmissionReq = vehicle.transmission as any;
    }

    // Filter available drivers by:
    // 1. Availability (Online + Active)
    // 2. Qualifications (Manual certification if required)
    const drivers = await prisma.driverProfile.findMany({
      where: {
        isOnline: true,
        status: 'ACTIVE',
        ...(type === 'HIRING' && transmissionReq === 'MANUAL' ? { manualCertified: true } : {}),
      },
      take: 10,
    });

    if (drivers.length > 0) {
      matchedDriverId = drivers[0].driverId;
    }

    // 4. Create Ride with status RECEIVED
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
        price,
        status: matchedDriverId ? 'ACCEPTED' : 'REQUESTED',
        distance: distanceKm,
      },
    });

    res.status(201).json({ ride, route });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error creating ride' });
  }
};

export const getRiderRides = async (req: AuthRequest, res: Response) => {
  const rides = await prisma.ride.findMany({
    where: { riderId: req.user.id },
    include: { driver: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(rides);
};

export const rateRide = async (req: AuthRequest, res: Response) => {
  const { rideId, rating } = req.body; // rating: 1-5

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Rating must be between 1 and 5' });
  }

  try {
    const ride = await prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride || ride.riderId !== req.user.id) {
       return res.status(404).json({ message: 'Ride not found' });
    }

    // Update the ride with the rating
    await prisma.ride.update({
      where: { id: rideId },
      data: { rating, status: 'COMPLETED' }
    });

    // Atomic update of driver's average rating
    if (ride.driverId) {
      const aggregate = await prisma.ride.aggregate({
        where: { driverId: ride.driverId, rating: { not: null } },
        _avg: { rating: true }
      });

      await prisma.driverProfile.update({
        where: { driverId: ride.driverId },
        data: { rating: aggregate._avg.rating || 0 }
      });
    }

    res.json({ message: 'Rating submitted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error rating ride' });
  }
};
