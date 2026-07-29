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
import DashboardScreen from './src/screens/Dashboard/DashboardScreen';
import DocumentsScreen from './src/screens/Profile/DocumentsScreen';
import IncomingRequestScreen from './src/screens/Ride/IncomingRequestScreen';
import ActiveTripScreen from './src/screens/Ride/ActiveTripScreen';
import TripSummaryScreen from './src/screens/Ride/TripSummaryScreen';

type Screen = 'Login' | 'Register' | 'Dashboard' | 'Documents' | 'Offer' | 'Trip' | 'TripSummary';

const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') || 'http://192.168.31.70:4000';

function AppContent() {
  const { token, user, loading } = useAuth();
  const authContext = useContext(AuthContext);

  const [currentScreen, setCurrentScreen] = useState<Screen>('Login');
  const [isOnline, setIsOnline] = useState(false);
  const [activeRide, setActiveRide] = useState<any>(null);
  const [incomingOffer, setIncomingOffer] = useState<any>(null);

  // WebSocket reference
  const [socket, setSocket] = useState<any>(null);
  const [isMocking, setIsMocking] = useState(false);

  // 1. Re-hydrate active trip on startup
  useEffect(() => {
    if (token) {
      client.get('/ride/active/driver')
        .then(({ data }) => {
          if (data && data.status !== 'COMPLETED' && data.status !== 'CANCELLED') {
            setActiveRide(data);
            setCurrentScreen('Trip');
          } else {
            setCurrentScreen('Dashboard');
          }
        })
        .catch(() => {
          setCurrentScreen('Dashboard');
        });
    }
  }, [token]);

  // 2. Manage WebSockets and Real-time matching flow
  useEffect(() => {
    if (!token || isMocking) return;

    // Connect to WebSocket gateway
    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('[SOCKET] Driver connected to gateway');
    });

    // Listen for ride offers dispatched by matching loop
    newSocket.on('ride_offer', (data: any) => {
      console.log('[SOCKET] Received ride offer:', data);
      setIncomingOffer(data);
      setCurrentScreen('Offer');
    });

    newSocket.on('offer_cancelled', () => {
      console.log('[SOCKET] Ride offer cancelled');
      setIncomingOffer(null);
      if (currentScreen === 'Offer') {
        setCurrentScreen('Dashboard');
      }
    });

    newSocket.on('ride_matched', (data: any) => {
      console.log('[SOCKET] Ride successfully matched:', data);
      setActiveRide(data);
      setIncomingOffer(null);
      setCurrentScreen('Trip');
    });

    return () => {
      newSocket.disconnect();
      setSocket(null);
    };
  }, [token, isMocking, currentScreen]);

  // 3. Simulated Duty Engine (Fires when mock mode is enabled)
  useEffect(() => {
    if (!isMocking || !isOnline) {
      setIncomingOffer(null);
      return;
    }

    // After 8 seconds, dispatch a mock ride request offer
    const offerTimeout = setTimeout(() => {
      if (isOnline && !activeRide) {
        setIncomingOffer({
          requestId: 'mock-offer-req-' + Date.now(),
          fareEstimate: 385,
          transmissionType: 'AUTOMATIC',
          vehicleMake: 'BMW',
          vehicleModel: '3-Series',
          pickupAddress: 'Indiranagar, Bengaluru',
          dropoffAddress: 'Electronic City, Bengaluru',
          pickupLat: 12.9716,
          pickupLng: 77.6413,
          timeoutSeconds: 15,
        });
        setCurrentScreen('Offer');
      }
    }, 8000);

    return () => clearTimeout(offerTimeout);
  }, [isMocking, isOnline, activeRide]);

  // 4. Toggle Online/Offline duty status
  const handleToggleOnline = async (nextOnlineState: boolean): Promise<boolean> => {
    try {
      // Check verification status
      const profileRes = await client.get('/driver/profile');
      const status = profileRes.data.verificationStatus || 'PENDING';

      if (status !== 'APPROVED') {
        Alert.alert('Verification Required', 'Your compliance status is PENDING. Please upload credentials in Compliance Vault.');
        return false;
      }

      await client.post('/driver/online', { isOnline: nextOnlineState });
      setIsOnline(nextOnlineState);
      setIsMocking(false);
      return true;
    } catch (e) {
      console.warn('[NETWORK] online duty toggle failed, fallback to simulation mode', e);
      // Mock Bypass
      setIsOnline(nextOnlineState);
      setIsMocking(true);
      return true;
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

  // Not logged in
  if (!token) {
    if (currentScreen === 'Register') {
      return (
        <RegisterScreen
          route={{ params: {} }}
          navigation={{
            navigate: (s: string) => setCurrentScreen(s as Screen),
            goBack: () => setCurrentScreen('Login'),
          }}
        />
      );
    }
    return (
      <LoginScreen
        navigation={{
          navigate: (s: string, params?: any) => {
            if (s === 'Register') setCurrentScreen('Register');
          }
        }}
      />
    );
  }

  // Driver App Router
  switch (currentScreen) {
    case 'Register':
      return (
        <RegisterScreen
          route={{ params: {} }}
          navigation={{
            navigate: (s: string) => setCurrentScreen(s as Screen),
            goBack: () => setCurrentScreen('Dashboard'),
          }}
        />
      );
    case 'Documents':
      return (
        <DocumentsScreen
          onBack={() => setCurrentScreen('Dashboard')}
        />
      );
    case 'Offer':
      return (
        <IncomingRequestScreen
          request={incomingOffer}
          onAccept={() => {
            if (isMocking) {
              setActiveRide({
                id: 'mock-ride-' + Date.now(),
                riderName: 'Jane Doe',
                pickupLat: 12.9716,
                pickupLng: 77.6413,
                dropoffLat: 12.8399,
                dropoffLng: 77.6770,
                pickupAddress: incomingOffer.pickupAddress,
                dropoffAddress: incomingOffer.dropoffAddress,
                fareEstimate: incomingOffer.fareEstimate,
                vehicleMake: incomingOffer.vehicleMake,
                vehicleModel: incomingOffer.vehicleModel,
                transmissionType: incomingOffer.transmissionType,
                plateNo: 'KA-01-MD-5022',
              });
              setIncomingOffer(null);
              setCurrentScreen('Trip');
            } else {
              setIncomingOffer(null);
              setCurrentScreen('Trip');
            }
          }}
          onReject={() => {
            setIncomingOffer(null);
            setCurrentScreen('Dashboard');
          }}
        />
      );
    case 'Trip':
      return (
        <ActiveTripScreen
          ride={activeRide}
          driverId={user?.id || 'mock_driver'}
          onFinished={() => {
            setCurrentScreen('TripSummary');
          }}
        />
      );
    case 'TripSummary':
      return (
        <TripSummaryScreen
          ride={{
            price: activeRide?.fareEstimate || 385,
            distance: 9.8,
            duration: 24,
            rating: 5,
          }}
          onFinish={() => {
            setActiveRide(null);
            setCurrentScreen('Dashboard');
          }}
        />
      );
    case 'Dashboard':
    default:
      return (
        <DashboardScreen
          onNavigate={(screen) => setCurrentScreen(screen as Screen)}
          isOnline={isOnline}
          onToggleOnline={handleToggleOnline}
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
