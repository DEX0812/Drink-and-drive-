import React, { useState } from 'react';
import { ThemeProvider, useTheme } from '../../packages/shared/src/theme/ThemeProvider';
import { useAuth } from '../../packages/shared/src/hooks/useAuth';
import LoginScreen from './src/screens/Auth/LoginScreen';
import RegisterScreen from './src/screens/Auth/RegisterScreen';
import HomeScreen from './src/screens/Home/HomeScreen';
import RideActiveScreen from './src/screens/Ride/RideActiveScreen';
import PaymentRatingScreen from './src/screens/Ride/PaymentRatingScreen';

function AppContent() {
  const { token, loading } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<'Login' | 'Register' | 'Home' | 'RideActive' | 'PaymentRating'>('Login');
  const [activeRide, setActiveRide] = useState<any>(null);

  if (loading) return null;

  if (!token) {
    if (currentScreen === 'Login') {
      return <LoginScreen navigation={{ navigate: setCurrentScreen }} />;
    }
    return <RegisterScreen navigation={{ navigate: setCurrentScreen, goBack: () => setCurrentScreen('Login') }} />;
  }

  if (currentScreen === 'RideActive') {
    return (
      <RideActiveScreen 
        ride={activeRide} 
        onFinished={() => {
          setCurrentScreen('PaymentRating');
        }} 
      />
    );
  }

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

  return <HomeScreen onBook={(ride: any) => {
    setActiveRide(ride);
    setCurrentScreen('RideActive');
  }} />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
