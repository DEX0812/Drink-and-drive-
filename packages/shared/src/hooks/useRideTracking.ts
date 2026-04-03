import { useState, useEffect } from 'react';
import io from 'socket.io-client';

const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:4000';

interface DriverLocation {
  lat: number;
  lng: number;
  heading?: number;
}

export const useRideTracking = (rideId: string, driverId: string) => {
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [connected, setConnected] = useState(false);
  const [rideStatus, setRideStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!rideId || !driverId) return;

    const socket = io(SOCKET_URL, { transports: ['websocket'] });

    socket.on('connect', () => {
      setConnected(true);
      // Join ride-specific room for targeted socket events
      socket.emit('register:ride', rideId);
    });

    socket.on('locationUpdated', (data: { driverId: string; lat: number; lng: number; heading?: number }) => {
      if (data.driverId === driverId) {
        setDriverLocation({ lat: data.lat, lng: data.lng, heading: data.heading });
      }
    });

    socket.on('rideStatusUpdate', (data: { rideId: string; status: string }) => {
      if (data.rideId === rideId) setRideStatus(data.status);
    });

    socket.on('rideCompleted', (data: { rideId: string }) => {
      if (data.rideId === rideId) setRideStatus('COMPLETED');
    });

    socket.on('rideCancelled', (data: { rideId: string }) => {
      if (data.rideId === rideId) setRideStatus('CANCELLED');
    });

    socket.on('disconnect', () => setConnected(false));

    return () => { socket.disconnect(); };
  }, [rideId, driverId]);

  return { driverLocation, connected, rideStatus };
};
