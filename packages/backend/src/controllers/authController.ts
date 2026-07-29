import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
// Role import removed to resolve stale client compilation error

export const register = async (req: Request, res: Response) => {
  const { email, password, name, role } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create User and conditional DriverProfile in a transaction
    const user = await prisma.$transaction(async (tx: any) => {
      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: role as any,
        },
      });

      if (role === 'DRIVER') {
        await tx.driverProfile.create({
          data: {
            driverId: newUser.id,
            licenseNumber: `PENDING-${newUser.id.slice(0, 8)}`, // Placeholder
            status: 'PENDING',
          },
        });
      }

      return newUser;
    });

    const token = jwt.sign(
      { id: user.id, role: user.role }, 
      process.env.JWT_SECRET || 'fallbacksecret', 
      { expiresIn: '1d' }
    );

    res.status(201).json({ 
      token, 
      user: { id: user.id, name: user.name, email: user.email, role: user.role } 
    });
  } catch (err) {
    console.error('Registration Error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log(`[AUTH] Login Failed: User not found for email: ${email}`);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log(`[AUTH] Login Failed: Password mismatch for user: ${email}`);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'fallbacksecret', {
      expiresIn: '1d',
    });

    console.log(`[AUTH] Login Success: ${email} (${user.role})`);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error('[AUTH] Server Error during login:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const sendOtp = async (req: Request, res: Response) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ message: 'Phone number is required' });
  }
  // In dev, we just simulate sending OTP successfully.
  console.log(`[AUTH] OTP requested for phone: ${phone}. Master OTP: 123456`);
  return res.status(200).json({ success: true, message: 'OTP sent successfully' });
};

export const verifyOtp = async (req: Request, res: Response) => {
  const { phone, code } = req.body;
  if (!phone || !code) {
    return res.status(400).json({ message: 'Phone number and verification code are required' });
  }

  // Master OTP is 123456
  if (code !== '123456') {
    return res.status(400).json({ message: 'Invalid verification code' });
  }

  try {
    const user = await prisma.user.findFirst({
      where: { phone }
    });

    if (!user) {
      // User is not registered yet, tell the client they need to register
      return res.status(200).json({ needsRegistration: true });
    }

    // User is registered, log them in by issuing a JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'fallbacksecret',
      { expiresIn: '1d' }
    );

    console.log(`[AUTH] OTP Login Success: ${phone} (${user.role})`);
    return res.status(200).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      needsRegistration: false
    });
  } catch (err: any) {
    console.error('[AUTH] Server Error during OTP verification:', err);
    return res.status(500).json({ message: `Server error during verification: ${err?.message || err}` });
  }
};

export const registerRider = async (req: Request, res: Response) => {
  const { name, phone, email, make, model, transmissionType, plateNo } = req.body;

  if (!name || !phone || !email || !make || !model || !plateNo) {
    return res.status(400).json({ message: 'Missing required rider registration fields' });
  }

  try {
    // Check if user already exists with email or phone
    const existingUserByEmail = await prisma.user.findUnique({ where: { email } });
    if (existingUserByEmail) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    const existingUserByPhone = await prisma.user.findFirst({ where: { phone } });
    if (existingUserByPhone) {
      return res.status(400).json({ message: 'Phone number is already registered' });
    }

    // Hash a random placeholder password since this is passwordless phone auth
    const hashedPassword = await bcrypt.hash(Math.random().toString(), 10);

    const user = await prisma.$transaction(async (tx: any) => {
      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          phone,
          role: 'RIDER',
        },
      });

      // Create vehicle associated with the rider
      await tx.vehicle.create({
        data: {
          ownerId: newUser.id,
          model: `${make} ${model}`,
          transmission: transmissionType === 'AUTOMATIC' ? 'AUTO' : 'MANUAL',
          licensePlate: plateNo,
          category: 'STANDARD',
        },
      });

      return newUser;
    });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'fallbacksecret',
      { expiresIn: '1d' }
    );

    console.log(`[AUTH] Mobile Rider Registration Success: ${email} (${phone})`);
    return res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err: any) {
    console.error('[AUTH] Mobile Rider Registration Error:', err);
    return res.status(500).json({ message: `Server error during rider registration: ${err?.message || err}` });
  }
};

export const registerDriver = async (req: Request, res: Response) => {
  const { name, phone, email, licenseNo } = req.body;

  if (!name || !phone || !email || !licenseNo) {
    return res.status(400).json({ message: 'Missing required driver registration fields' });
  }

  try {
    // Check if user already exists with email or phone
    const existingUserByEmail = await prisma.user.findUnique({ where: { email } });
    if (existingUserByEmail) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    const existingUserByPhone = await prisma.user.findFirst({ where: { phone } });
    if (existingUserByPhone) {
      return res.status(400).json({ message: 'Phone number is already registered' });
    }

    // Check if license is already in use
    const existingDriverProfile = await prisma.driverProfile.findFirst({ where: { licenseNumber: licenseNo } });
    if (existingDriverProfile) {
      return res.status(400).json({ message: 'Driver license number is already registered' });
    }

    // Hash a random placeholder password
    const hashedPassword = await bcrypt.hash(Math.random().toString(), 10);

    const user = await prisma.$transaction(async (tx: any) => {
      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          phone,
          role: 'DRIVER',
        },
      });

      // Create driver profile
      await tx.driverProfile.create({
        data: {
          driverId: newUser.id,
          licenseNumber: licenseNo,
          status: 'PENDING',
        },
      });

      return newUser;
    });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'fallbacksecret',
      { expiresIn: '1d' }
    );

    console.log(`[AUTH] Mobile Driver Registration Success: ${email} (${phone})`);
    return res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err: any) {
    console.error('[AUTH] Mobile Driver Registration Error:', err);
    return res.status(500).json({ message: `Server error during driver registration: ${err?.message || err}` });
  }
};

