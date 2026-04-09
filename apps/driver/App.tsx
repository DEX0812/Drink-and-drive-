import React, { useState, useEffect } from 'react';
import { ThemeProvider } from '@platform/shared/src/theme/ThemeProvider';
import { useAuth } from '@platform/shared/src/hooks/useAuth';
import { useNotifications } from '@platform/shared/src/hooks/useNotifications';
import client from '@platform/shared/src/api/client';
import LoginScreen from './src/screens/Auth/LoginScreen';
import RegisterScreen from './src/screens/Auth/RegisterScreen';
import DashboardScreen from './src/screens/Dashboard/DashboardScreen';
import IncomingRequestScreen from './src/screens/Ride/IncomingRequestScreen';
import ActiveTripScreen from './src/screens/Ride/ActiveTripScreen';
import TripSummaryScreen from './src/screens/Ride/TripSummaryScreen';
import DocumentsScreen from './src/screens/Profile/DocumentsScreen';
import { useLocationStreamer } from '@platform/shared/src/hooks/useLocationStreamer';
import { View, ActivityIndicator } from 'react-native';
import { registerRootComponent } from 'expo';

const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') || 'http://10.3.5.82:4000';

function AppContent() {
  const { token, user, loading } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<'Login' | 'Register' | 'Dashboard' | 'TripSummary' | 'Documents'>('Login');
  const [activeRide, setActiveRide] = useState<any>(null);
  const [incomingRequest, setIncomingRequest] = useState<any>(null);

  useNotifications(user?.id, true);

  // Hydrate active ride on startup
  useEffect(() => {
    if (token && !activeRide) {
       client.get('/rides/current')
         .then(({ data }) => {
            if (data) setActiveRide(data);
         })
         .catch(() => {});
    }
  }, [token]);

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

  if (currentScreen === 'Documents') {
    return <DocumentsScreen onBack={() => setCurrentScreen('Dashboard')} />;
  }

  return <DashboardScreen onNavigate={(s: any) => setCurrentScreen(s)} />;
}

import { AuthProvider } from '@platform/shared/src/context/AuthContext';

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
