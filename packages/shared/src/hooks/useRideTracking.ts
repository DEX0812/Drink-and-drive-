import { useState, useEffect } from 'react';
import io from 'socket.io-client';

const SOCKET_URL = 'http://localhost:4000'; // In production, move to env

interface Location {
  lat: number;
  lng: number;
}

export const useRideTracking = (rideId: string, driverId: string) => {
  const [driverLocation, setDriverLocation] = useState<Location | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!rideId || !driverId) return;

    const socket = io(SOCKET_URL);

    socket.on('connect', () => {
      setConnected(true);
      // Join a ride-specific room for targeted broadcasts
      socket.emit('joinRide', { rideId });
    });

    socket.on('locationUpdated', (data: { driverId: string; lat: number; lng: number }) => {
      // Filter updates for the assigned driver
      if (data.driverId === driverId) {
        setDriverLocation({ lat: data.lat, lng: data.lng });
      }
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [rideId, driverId]);

  return { driverLocation, connected };
};
