import React, { useState, useEffect, useContext } from 'react';
import { ThemeProvider } from '@platform/shared/src/theme/ThemeProvider';
import { AuthContext, AuthProvider } from '@platform/shared/src/context/AuthContext';
import { useAuth } from '@platform/shared/src/hooks/useAuth';
import client from '@platform/shared/src/api/client';
import { registerRootComponent } from 'expo';
import { View, ActivityIndicator, Alert } from 'react-native';
import io from 'socket.io-client';

// Screens
import LoginScreen from './src/screens/Auth/LoginScreen';
import RegisterScreen from './src/screens/Auth/RegisterScreen';
import HomeScreen from './src/screens/Home/HomeScreen';
import MatchingScreen from './src/screens/Ride/MatchingScreen';
import TrackingScreen from './src/screens/Ride/TrackingScreen';
import SummaryScreen from './src/screens/Ride/SummaryScreen';

type Screen = 'Login' | 'Register' | 'Home' | 'Matching' | 'Tracking' | 'Summary';

const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') || 'http://192.168.31.70:4000';

function AppContent() {
  const { token, user, loading } = useAuth();
  const authContext = useContext(AuthContext);

  const [currentScreen, setCurrentScreen] = useState<Screen>('Login');
  const [activeRide, setActiveRide] = useState<any>(null);
  
  // Real-time Driver State
  const [driver, setDriver] = useState<any>(null);
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [rideStatus, setRideStatus] = useState<string>('REQUESTED');
  
  // SOS State
  const [isSosActive, setIsSosActive] = useState(false);

  // Socket reference
  const [socket, setSocket] = useState<any>(null);
  const [isMocking, setIsMocking] = useState(false);

  // 1. Re-hydrate active ride on startup
  useEffect(() => {
    if (token) {
      client.get('/ride/active/rider')
        .then(({ data }) => {
          if (data && data.status !== 'COMPLETED' && data.status !== 'CANCELLED') {
            setActiveRide(data);
            setRideStatus(data.status);
            if (data.driverProfile) {
              setDriver({
                name: data.driverProfile.user?.name || 'Alexander',
                rating: data.driverProfile.rating || 4.9
              });
            }
            setCurrentScreen(data.status === 'REQUESTED' ? 'Matching' : 'Tracking');
          } else {
            setCurrentScreen('Home');
          }
        })
        .catch(() => {
          setCurrentScreen('Home');
        });
    }
  }, [token]);

  // 2. Manage WebSockets and Matching/Tracking flow
  useEffect(() => {
    if (!token || !activeRide || isMocking) return;

    // Connect to WebSocket gateway
    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('[SOCKET] Rider connected to DriveSafe gateway');
      // Join room for this ride
      newSocket.emit('join_ride', { rideId: activeRide.id });
    });

    newSocket.on('ride_matched', (data: any) => {
      console.log('[SOCKET] Match found:', data);
      setDriver({
        name: data.driverProfile?.user?.name || 'Alexander',
        rating: data.driverProfile?.rating || 4.9,
      });
      setRideStatus('MATCHED');
      setCurrentScreen('Tracking');
      newSocket.emit('join_ride', { rideId: activeRide.id });
    });

    newSocket.on('status_updated', (data: any) => {
      console.log('[SOCKET] Ride status updated:', data.status);
      setRideStatus(data.status);
      if (data.status === 'COMPLETED') {
        setCurrentScreen('Summary');
      }
    });

    newSocket.on('location_update', (data: any) => {
      console.log('[SOCKET] Driver location ping:', data);
      setDriverLocation({ lat: data.lat, lng: data.lng });
    });

    newSocket.on('offer_cancelled', () => {
      Alert.alert('Matching Aborted', 'No drivers accepted. Retrying...');
      setCurrentScreen('Home');
    });

    return () => {
      newSocket.disconnect();
      setSocket(null);
    };
  }, [token, activeRide, isMocking]);

  // 3. Mock Simulation Engine (Runs if backend is not detected or fails)
  useEffect(() => {
    if (!isMocking || !activeRide) return;

    if (currentScreen === 'Matching') {
      const matchTimeout = setTimeout(() => {
        setDriver({ name: 'Alexander (Mock)', rating: 4.9 });
        setRideStatus('MATCHED');
        setCurrentScreen('Tracking');
      }, 5000);

      return () => clearTimeout(matchTimeout);
    }

    if (currentScreen === 'Tracking') {
      let stepIndex = 0;
      const startLat = activeRide.pickupLat;
      const startLng = activeRide.pickupLng;
      const endLat = activeRide.dropoffLat;
      const endLng = activeRide.dropoffLng;

      setDriverLocation({ lat: startLat, lng: startLng });

      // Simulates location steps along a straight vector
      const steps = 10;
      const statuses = ['MATCHED', 'ENROUTE', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED'];
      let statusIndex = 0;

      const driveInterval = setInterval(() => {
        stepIndex++;
        
        // Progress status logic
        if (stepIndex === 2) statusIndex = 1; // ENROUTE
        if (stepIndex === 4) statusIndex = 2; // ARRIVED
        if (stepIndex === 5) statusIndex = 3; // IN_PROGRESS
        if (stepIndex === 9) statusIndex = 4; // COMPLETED

        const currentStatus = statuses[statusIndex];
        setRideStatus(currentStatus);

        const lat = startLat + ((endLat - startLat) * stepIndex) / steps;
        const lng = startLng + ((endLng - startLng) * stepIndex) / steps;
        setDriverLocation({ lat, lng });

        if (stepIndex >= steps || currentStatus === 'COMPLETED') {
          clearInterval(driveInterval);
          setTimeout(() => setCurrentScreen('Summary'), 1000);
        }
      }, 3000);

      return () => clearInterval(driveInterval);
    }
  }, [isMocking, activeRide, currentScreen]);

  // 4. Handle initial ride request action
  const handleStartBooking = async (details: any) => {
    setCurrentScreen('Matching');
    setActiveRide(details);
    setRideStatus('REQUESTED');
    setDriver(null);
    setDriverLocation(null);

    try {
      const res = await client.post('/ride/request', {
        vehicleId: details.vehicleId,
        pickupLat: details.pickupLat,
        pickupLng: details.pickupLng,
        pickupAddress: details.pickupAddress,
        dropoffLat: details.dropoffLat,
        dropoffLng: details.dropoffLng,
        dropoffAddress: details.dropoffAddress,
      });
      
      setActiveRide(res.data);
      setIsMocking(false);
    } catch (e) {
      console.warn('[NETWORK] POST /ride/request failed, starting standalone simulation', e);
      setIsMocking(true);
      // Construct a mock ride object
      setActiveRide({
        id: 'mock-ride-' + Date.now(),
        ...details
      });
    }
  };

  const handleCancelBooking = () => {
    setActiveRide(null);
    setDriver(null);
    setDriverLocation(null);
    setCurrentScreen('Home');
  };

  const handleTriggerSos = async () => {
    setIsSosActive(true);
    if (activeRide && !isMocking) {
      try {
        await client.post('/admin/sos/trigger', { rideId: activeRide.id });
      } catch (err) {
        console.warn('Could not broadcast real SOS alert to backend', err);
      }
    }
  };

  // Render navigation screen state router
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );
  }

  // Auth Flow Router
  if (!token) {
    if (currentScreen === 'Register') {
      return (
        <RegisterScreen
          route={{ params: {} }}
          navigation={{
            navigate: (s: string, params?: any) => {
              if (s === 'Login') setCurrentScreen('Login');
              else if (s === 'Register') setCurrentScreen('Register');
            },
            goBack: () => setCurrentScreen('Login'),
          }}
        />
      );
    }
    return (
      <LoginScreen
        navigation={{
          navigate: (s: string, params?: any) => {
            if (s === 'Register') {
              setCurrentScreen('Register');
              // Forward OTP credentials
              setTimeout(() => {
                const routeMock = { params };
                setCurrentScreen('Register');
              }, 0);
            }
          }
        }}
      />
    );
  }

  // Main Rider Router
  switch (currentScreen) {
    case 'Register':
      return (
        <RegisterScreen
          route={{ params: {} }}
          navigation={{
            navigate: (s: string) => setCurrentScreen(s as Screen),
            goBack: () => setCurrentScreen('Home'),
          }}
        />
      );
    case 'Matching':
      return (
        <MatchingScreen
          fare={activeRide?.fareEstimate || 350}
          transmissionType={activeRide?.transmissionType || 'AUTOMATIC'}
          onCancel={handleCancelBooking}
        />
      );
    case 'Tracking':
      return (
        <TrackingScreen
          ride={activeRide}
          driver={driver || { name: 'Alexander', rating: 4.9 }}
          driverLocation={driverLocation}
          status={rideStatus}
          onTriggerSos={handleTriggerSos}
          isSosActive={isSosActive}
          onCloseSosModal={() => setIsSosActive(false)}
        />
      );
    case 'Summary':
      return (
        <SummaryScreen
          fare={activeRide?.fareEstimate || 350}
          onBookAnother={() => {
            setActiveRide(null);
            setCurrentScreen('Home');
          }}
        />
      );
    case 'Home':
    default:
      return (
        <HomeScreen
          onStartBooking={handleStartBooking}
        />
      );
  }
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
}

registerRootComponent(App);
