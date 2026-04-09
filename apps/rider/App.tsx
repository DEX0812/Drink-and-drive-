import React, { useState, useEffect } from 'react';
import { ThemeProvider } from '@platform/shared/src/theme/ThemeProvider';
import { useAuth } from '@platform/shared/src/hooks/useAuth';
import { useNotifications } from '@platform/shared/src/hooks/useNotifications';
import client from '@platform/shared/src/api/client';
import { registerRootComponent } from 'expo';
import { View, ActivityIndicator } from 'react-native';
import LoginScreen from './src/screens/Auth/LoginScreen';
import RegisterScreen from './src/screens/Auth/RegisterScreen';
import HomeScreen from './src/screens/Home/HomeScreen';
import RideActiveScreen from './src/screens/Ride/RideActiveScreen';
import PaymentRatingScreen from './src/screens/Ride/PaymentRatingScreen';
import NotificationToast from './src/components/NotificationToast';

type Screen = 'Login' | 'Register' | 'Home' | 'RideActive' | 'PaymentRating';

function AppContent() {
  const { token, user, loading } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<Screen>('Login');
  const [activeRide, setActiveRide] = useState<any>(null);

  const { lastNotification, clearNotification } = useNotifications(user?.id);

  // Hydrate active ride on startup
  useEffect(() => {
    if (token && !activeRide) {
      client.get('/rides/current')
        .then(({ data }) => {
          if (data) {
            setActiveRide(data);
            setCurrentScreen('RideActive');
          } else {
            setCurrentScreen('Home');
          }
        })
        .catch(() => setCurrentScreen('Home'));
    }
  }, [token]);

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

  // Main home screen
  const screen = (() => {
    if (currentScreen === 'RideActive' && activeRide) {
      return (
        <RideActiveScreen
          ride={activeRide}
          onFinished={() => setCurrentScreen('PaymentRating')}
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
    return (
      <HomeScreen
        onBook={(ride: any) => {
          setActiveRide(ride);
          setCurrentScreen('RideActive');
        }}
      />
    );
  })();

  return (
    <>
      <NotificationToast 
        visible={!!lastNotification}
        title={lastNotification?.title || ''}
        body={lastNotification?.body || ''}
        onHide={clearNotification}
      />
      {screen}
    </>
  );
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
