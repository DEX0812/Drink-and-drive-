import { useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import client from '../api/client';

export const useAuth = () => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadToken = async () => {
      const storedToken = await SecureStore.getItemAsync('token');
      const storedUser = await SecureStore.getItemAsync('user');
      if (storedToken) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser || '{}'));
      }
      setLoading(false);
    };
    loadToken();
  }, []);

  const login = async (phone: string, role: 'RIDER' | 'DRIVER') => {
    const res = await client.post('/auth/login', { phone, role });
    const { token, user } = res.data;
    await SecureStore.setItemAsync('token', token);
    await SecureStore.setItemAsync('user', JSON.stringify(user));
    setToken(token);
    setUser(user);
    return res.data;
  };

  const register = async (data: any) => {
    const res = await client.post('/auth/register', data);
    const { token, user } = res.data;
    await SecureStore.setItemAsync('token', token);
    await SecureStore.setItemAsync('user', JSON.stringify(user));
    setToken(token);
    setUser(user);
    return res.data;
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('user');
    setToken(null);
    setUser(null);
  };

  return { token, user, loading, login, register, logout };
};
