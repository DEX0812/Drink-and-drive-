import dotenv from 'dotenv';
import path from 'path';
// Load .env FIRST before any other imports that need env vars
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/authRoutes';
import vehicleRoutes from './routes/vehicleRoutes';
import rideRoutes from './routes/rideRoutes';
import paymentRoutes from './routes/paymentRoutes';
import driverRoutes from './routes/driverRoutes';
import { authenticate } from './middleware/auth';
import { adminAuth } from './middleware/adminAuth';
import prisma from './utils/prisma';
import logger from './utils/logger';

const app = express();
const server = http.createServer(app);

// ─── Socket.io (Room-Based) ────────────────────────────────────────────────
export const io = new Server(server, {
  cors: { origin: '*' },
});

// Track driver socket IDs: driverId → socketId
const driverSockets = new Map<string, string>();
const driverHeartbeats = new Map<string, number>();

// Presence checker (every 30s)
setInterval(async () => {
  const now = Date.now();
  for (const [driverId, lastSeen] of driverHeartbeats.entries()) {
    if (now - lastSeen > 45000) { // 45s timeout
       driverHeartbeats.delete(driverId);
       const sid = driverSockets.get(driverId);
       if (sid) {
         const driverSocket = io.sockets.sockets.get(sid);
         if (driverSocket) driverSocket.disconnect(true);
       }
       
       await prisma.driverProfile.update({
         where: { driverId },
         data: { isOnline: false }
       }).catch(() => {});
       console.log(`Driver ${driverId} timed out`);
    }
  }
}, 30000);

io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);

  // Driver registers their socket for targeted events
  socket.on('register:driver', (driverId: string) => {
    driverSockets.set(driverId, socket.id);
    driverHeartbeats.set(driverId, Date.now());
    socket.join(`driver:${driverId}`);
    console.log(`Driver ${driverId} registered socket ${socket.id}`);
  });

  socket.on('heartbeat', (driverId: string) => {
    driverHeartbeats.set(driverId, Date.now());
  });

  // Rider subscribes to their ride room for updates
  socket.on('register:ride', (rideId: string) => {
    socket.join(`ride:${rideId}`);
    console.log(`Client subscribed to ride:${rideId}`);
  });

  // Driver sends location update → broadcast to all riders tracking this driver
  socket.on('updateLocation', async (data: { driverId: string; lat: number; lng: number; heading?: number }) => {
    // Broadcast to anyone tracking this driver
    io.emit('locationUpdated', data);

    // Persist location to DB
    try {
      await prisma.driverProfile.update({
        where: { driverId: data.driverId },
        data: {
          lastLocationLat: data.lat,
          lastLocationLng: data.lng,
          isOnline: true,
        },
      });
    } catch (err) {
      console.error('Socket DB Update Error:', err);
    }
  });

  socket.on('disconnect', () => {
    // Clean up driver socket mapping
    driverSockets.forEach((sid, driverId) => {
      if (sid === socket.id) driverSockets.delete(driverId);
    });
    console.log('Socket disconnected:', socket.id);
  });
});

// ─── Middleware ────────────────────────────────────────────────────────────

// Global rate limiter (100 requests per 15 minutes per IP)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // Increased for development
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});

// Higher limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500, // Increased for development debugging
  message: { message: 'Too many auth attempts, please try again later.' },
});

app.use(helmet());
app.use(compression());
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());
app.use('/api', limiter);

// ─── Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/driver', driverRoutes);

// Health check (Deep)
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ 
      status: 'ok', 
      database: 'connected',
      timestamp: new Date().toISOString() 
    });
  } catch (err) {
    logger.error('Health Check Failed:', err);
    res.status(503).json({ 
      status: 'error', 
      database: 'disconnected',
      timestamp: new Date().toISOString() 
    });
  }
});

// Admin endpoints (Protected with RBAC)
app.get('/api/admin/metrics', adminAuth, async (req, res) => {
  try {
    const [activeRides, onlineDrivers, totalRidesToday, revenue] = await Promise.all([
      prisma.ride.count({ where: { status: { in: ['ACCEPTED', 'ONGOING'] } } }),
      prisma.driverProfile.count({ where: { isOnline: true } }),
      prisma.ride.count({
        where: {
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      prisma.ride.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
        _sum: { price: true },
      }),
    ]);

    res.json({
      activeRides,
      onlineDrivers,
      totalRidesToday,
      revenueToday: revenue._sum.price || 0,
    });
  } catch (err) {
    res.status(500).json({ message: 'Metrics error' });
  }
});

app.get('/api/admin/drivers', adminAuth, async (req, res) => {
  try {
    const drivers = await prisma.driverProfile.findMany({
      include: { driver: { select: { id: true, name: true, email: true, createdAt: true } } },
      orderBy: { driver: { createdAt: 'desc' } },
    });
    res.json(drivers);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching drivers' });
  }
});

app.patch('/api/admin/drivers/:driverId/verify', adminAuth, async (req, res) => {
  const { status } = req.body; // ACTIVE or REJECTED
  try {
    const profile = await prisma.driverProfile.update({
      where: { driverId: req.params.driverId },
      data: { status },
    });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: 'Error updating driver status' });
  }
});

app.get('/api/admin/rides', adminAuth, async (req, res) => {
  try {
    const rides = await prisma.ride.findMany({
      include: {
        rider: { select: { name: true, email: true } },
        driver: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json(rides);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching rides' });
  }
});

// ─── Start Server ──────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
server.listen(Number(PORT), '0.0.0.0', () => {
  logger.info(`🚀 DriveSafe Backend running on all interfaces at port ${PORT}`);
  logger.info(`📡 WebSocket server active`);
  logger.info(`🏥 Health: http://localhost:${PORT}/health`);
});


export default app;
