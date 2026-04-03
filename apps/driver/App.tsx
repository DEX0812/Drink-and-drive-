import React, { useState, useEffect } from 'react';
import { ThemeProvider } from '../../packages/shared/src/theme/ThemeProvider';
import { useAuth } from '../../packages/shared/src/hooks/useAuth';
import LoginScreen from './src/screens/Auth/LoginScreen';
import RegisterScreen from './src/screens/Auth/RegisterScreen';
import DashboardScreen from './src/screens/Dashboard/DashboardScreen';
import IncomingRequestScreen from './src/screens/Ride/IncomingRequestScreen';
import ActiveTripScreen from './src/screens/Ride/ActiveTripScreen';
import TripSummaryScreen from './src/screens/Ride/TripSummaryScreen';
import { useLocationStreamer } from '../../packages/shared/src/hooks/useLocationStreamer';
import { View, ActivityIndicator } from 'react-native';

const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:4000';

function AppContent() {
  const { token, user, loading } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<'Login' | 'Register' | 'Dashboard' | 'TripSummary'>('Login');
  const [activeRide, setActiveRide] = useState<any>(null);
  const [incomingRequest, setIncomingRequest] = useState<any>(null);

  // Stream driver location to backend while online on dashboard
  const { socket } = useLocationStreamer(
    user?.id,
    currentScreen === 'Dashboard' && !activeRide && !incomingRequest
  );

  // Listen for real ride requests via socket
  useEffect(() => {
    if (!socket || !user?.id) return;

    // Register as driver so backend can target us
    socket.emit('register:driver', user.id);

    // Listen for incoming ride request
    socket.on('rideRequested', (data: any) => {
      setIncomingRequest(data);
    });

    socket.on('rideCancelled', () => {
      setIncomingRequest(null);
      setActiveRide(null);
    });

    return () => {
      socket.off('rideRequested');
      socket.off('rideCancelled');
    };
  }, [socket, user?.id]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  if (!token) {
    if (currentScreen === 'Login' || currentScreen === 'Dashboard') {
      return <LoginScreen navigation={{ navigate: (s: string) => setCurrentScreen(s as any) }} />;
    }
    return (
      <RegisterScreen
        navigation={{
          navigate: (s: string) => setCurrentScreen(s as any),
          goBack: () => setCurrentScreen('Login'),
        }}
      />
    );
  }

  // Incoming request takes priority
  if (incomingRequest) {
    return (
      <IncomingRequestScreen
        request={incomingRequest}
        onAccept={() => {
          setActiveRide(incomingRequest);
          setIncomingRequest(null);
        }}
        onReject={() => setIncomingRequest(null)}
      />
    );
  }

  if (activeRide) {
    return (
      <ActiveTripScreen
        ride={activeRide}
        driverId={user?.id || ''}
        onFinished={() => {
          setCurrentScreen('TripSummary');
        }}
      />
    );
  }

  if (currentScreen === 'TripSummary') {
    return (
      <TripSummaryScreen
        ride={activeRide}
        onFinish={() => {
          setActiveRide(null);
          setCurrentScreen('Dashboard');
        }}
      />
    );
  }

  return <DashboardScreen />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
