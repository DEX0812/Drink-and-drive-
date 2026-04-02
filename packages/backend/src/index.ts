import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import vehicleRoutes from './routes/vehicleRoutes';
import rideRoutes from './routes/rideRoutes';
import paymentRoutes from './routes/paymentRoutes';
import prisma from './utils/prisma';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/payments', paymentRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Socket.io for real-time tracking
io.on('connection', (socket: any) => {
  console.log('User connected:', socket.id);

  socket.on('updateLocation', async (data: { driverId: string; lat: number; lng: number }) => {
    // 1. Broadcast to dispatchers/riders
    socket.broadcast.emit('locationUpdated', data);

    // 2. Persist to DB for nearest-driver search logic
    try {
      await prisma.driverProfile.update({
        where: { driverId: data.driverId },
        data: {
          lastLocationLat: data.lat,
          lastLocationLng: data.lng,
          isOnline: true
        }
      });
    } catch (err) {
      console.error('Socket DB Update Error:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
