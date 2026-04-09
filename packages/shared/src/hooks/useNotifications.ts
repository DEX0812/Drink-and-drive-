import { useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import io from 'socket.io-client';

const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') || 'http://10.3.5.82:4000';

export const useNotifications = (userId: string, isDriver: boolean = false) => {
  const [lastNotification, setLastNotification] = useState<{ title: string; body: string; type: string } | null>(null);

  useEffect(() => {
    if (!userId) return;
    const socket = io(SOCKET_URL, { transports: ['websocket'] });

    socket.on('connect', () => {
      if (isDriver) {
        socket.emit('register:driver', userId);
      }
    });

    // Heartbeat for drivers
    let heartbeatInterval: any;
    if (isDriver) {
      heartbeatInterval = setInterval(() => {
        socket.emit('heartbeat', userId);
      }, 20000);
    }

    socket.on('push-notification', (data: { title: string; body: string; type: string }) => {
      setLastNotification(data);
      if (Platform.OS !== 'web') {
        // High-impact haptic/audio simulation could be added here
        // Alert.alert(data.title, data.body); // Commenting out to use Toast UI instead
      } else {
        // Simple log for web/dev environments
        console.log('📡 [OS_ALERT]:', data.title, '-', data.body);
      }
    });

    return () => {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      socket.disconnect();
    };
  }, [userId, isDriver]);

  return { lastNotification, clearNotification: () => setLastNotification(null) };
};
