import { Request, Response } from 'express';
import prisma from '../utils/prisma';

interface AuthRequest extends Request {
  user?: any;
}

export const addVehicle = async (req: AuthRequest, res: Response) => {
  const { model, transmission, category, licensePlate } = req.body;
  const ownerId = req.user.id;

  try {
    const existingVehicle = await prisma.vehicle.findUnique({ where: { licensePlate } });
    if (existingVehicle) {
      return res.status(400).json({ message: 'Vehicle with this license plate already exists' });
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        ownerId,
        model,
        transmission,
        category,
        licensePlate,
      },
    });

    res.status(201).json(vehicle);
  } catch (err) {
    console.error('Add Vehicle Error:', err);
    res.status(500).json({ message: 'Server error adding vehicle' });
  }
};

export const getMyVehicles = async (req: AuthRequest, res: Response) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      where: { ownerId: req.user.id },
    });
    res.json(vehicles);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching vehicles' });
  }
};
