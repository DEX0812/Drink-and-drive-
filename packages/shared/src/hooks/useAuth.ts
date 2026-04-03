import { useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import client from '../api/client';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'RIDER' | 'DRIVER' | 'ADMIN';
}

export const useAuth = () => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadToken = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync('token');
        const storedUser = await SecureStore.getItemAsync('user');
        if (storedToken) {
          setToken(storedToken);
          if (storedUser) setUser(JSON.parse(storedUser));
          // Attach token to future requests
          client.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        }
      } catch (err) {
        console.error('Token load error:', err);
      } finally {
        setLoading(false);
      }
    };
    loadToken();
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    const res = await client.post('/auth/login', credentials);
    const { token: newToken, user: newUser } = res.data;
    await SecureStore.setItemAsync('token', newToken);
    await SecureStore.setItemAsync('user', JSON.stringify(newUser));
    client.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setToken(newToken);
    setUser(newUser);
    return res.data;
  };

  const register = async (data: {
    email: string;
    password: string;
    name: string;
    role: 'RIDER' | 'DRIVER';
    licenseNumber?: string;
    experienceYears?: number;
    manualCertified?: boolean;
  }) => {
    const res = await client.post('/auth/register', data);
    const { token: newToken, user: newUser } = res.data;
    await SecureStore.setItemAsync('token', newToken);
    await SecureStore.setItemAsync('user', JSON.stringify(newUser));
    client.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setToken(newToken);
    setUser(newUser);
    return res.data;
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('user');
    delete client.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  return { token, user, loading, login, register, logout };
};
