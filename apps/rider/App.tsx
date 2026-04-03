import React, { useState, useEffect } from 'react';
import { ThemeProvider } from '../../packages/shared/src/theme/ThemeProvider';
import { useAuth } from '../../packages/shared/src/hooks/useAuth';
import { View, ActivityIndicator } from 'react-native';
import LoginScreen from './src/screens/Auth/LoginScreen';
import RegisterScreen from './src/screens/Auth/RegisterScreen';
import HomeScreen from './src/screens/Home/HomeScreen';
import RideActiveScreen from './src/screens/Ride/RideActiveScreen';
import PaymentRatingScreen from './src/screens/Ride/PaymentRatingScreen';

type Screen = 'Login' | 'Register' | 'Home' | 'RideActive' | 'PaymentRating';

function AppContent() {
  const { token, loading } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<Screen>('Login');
  const [activeRide, setActiveRide] = useState<any>(null);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );
  }

  // Not logged in
  if (!token) {
    if (currentScreen === 'Register') {
      return (
        <RegisterScreen
          navigation={{
            navigate: (s: string) => setCurrentScreen(s as Screen),
            goBack: () => setCurrentScreen('Login'),
          }}
        />
      );
    }
    return (
      <LoginScreen
        navigation={{ navigate: (s: string) => setCurrentScreen(s as Screen) }}
      />
    );
  }

  // Active ride tracking
  if (currentScreen === 'RideActive' && activeRide) {
    return (
      <RideActiveScreen
        ride={activeRide}
        onFinished={() => setCurrentScreen('PaymentRating')}
      />
    );
  }

  // Post-ride payment + rating
  if (currentScreen === 'PaymentRating') {
    return (
      <PaymentRatingScreen
        ride={activeRide}
        onComplete={() => {
          setActiveRide(null);
          setCurrentScreen('Home');
        }}
      />
    );
  }

  // Main home screen
  return (
    <HomeScreen
      onBook={(ride: any) => {
        setActiveRide(ride);
        setCurrentScreen('RideActive');
      }}
    />
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
