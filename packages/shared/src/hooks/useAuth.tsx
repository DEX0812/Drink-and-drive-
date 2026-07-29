import { useContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import client from '../api/client';
import { AuthContext } from '../context/AuthContext';

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  const { token, user, loading, setToken, setUser, setLoading } = context;

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
