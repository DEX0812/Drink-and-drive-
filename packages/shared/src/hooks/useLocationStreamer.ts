import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import io from 'socket.io-client';

const DEFAULT_IP = 'localhost';
const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') || `http://${DEFAULT_IP}:4000`;

export const useLocationStreamer = (driverId: string, isTracking: boolean) => {
  const [socket, setSocket] = useState<any>(null);

  useEffect(() => {
    if (!driverId) return;
    
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [driverId]);

  useEffect(() => {
    if (!isTracking || !socket || !driverId) return;

    let interval: NodeJS.Timeout;

    const startStreaming = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      interval = setInterval(async () => {
        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        socket.emit('updateLocation', {
          driverId,
          lat: location.coords.latitude,
          lng: location.coords.longitude
        });
      }, 5000); // 5 second heartbeat
    };

    startStreaming();

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTracking, socket, driverId]);

  return { socket };
};
