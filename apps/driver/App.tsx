import React, { useState, useEffect } from 'react';
import { ThemeProvider } from '../../packages/shared/src/theme/ThemeProvider';
import { useAuth } from '../../packages/shared/src/hooks/useAuth';
import LoginScreen from './src/screens/Auth/LoginScreen';
import RegisterScreen from './src/screens/Auth/RegisterScreen';
import IncomingRequestScreen from './src/screens/Ride/IncomingRequestScreen';
import ActiveTripScreen from './src/screens/Ride/ActiveTripScreen';
import TripSummaryScreen from './src/screens/Ride/TripSummaryScreen';
import { useLocationStreamer } from '../../packages/shared/src/hooks/useLocationStreamer';
import { View, Text } from 'react-native';

function AppContent() {
  const { token, user, loading } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<'Login' | 'Register' | 'Dashboard' | 'TripSummary'>('Login');
  const [activeRide, setActiveRide] = useState<any>(null);
  const [incomingRequest, setIncomingRequest] = useState<any>(null);

  // Stream location while Online (not in a trip)
  const { socket } = useLocationStreamer(user?.id, currentScreen === 'Dashboard' && !activeRide && !incomingRequest);

  // Mock an incoming request after 5 seconds of being logged in
  useEffect(() => {
    if (token && !activeRide && !incomingRequest) {
      const timer = setTimeout(() => {
        setIncomingRequest({
          id: 'ride-123',
          riderName: 'Siddharth',
          pickupAddress: '123 Elite Square, Bangalore',
          carModel: 'Honda Civic 2024',
          transmission: 'MANUAL',
          category: 'SEDAN',
          pickupLat: 12.9716,
          pickupLng: 77.5946,
          dropoffLat: 12.9141,
          dropoffLng: 77.6413
        });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [token, activeRide, incomingRequest]);

  if (loading) return null;

  if (!token) {
    if (currentScreen === 'Login') {
      return <LoginScreen navigation={{ navigate: setCurrentScreen }} />;
    }
    return <RegisterScreen navigation={{ navigate: setCurrentScreen, goBack: () => setCurrentScreen('Login') }} />;
  }

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
        driverId={user?.id}
        onFinished={() => setCurrentScreen('TripSummary')}
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

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
       <Text style={{ color: '#fff', fontSize: 24, fontWeight: '800' }}>ONLINE & READY.</Text>
       <Text style={{ color: '#666', marginTop: 10 }}>Waiting for your next mission...</Text>
    </View>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
