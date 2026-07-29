import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import client from '../api/client';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'RIDER' | 'DRIVER' | 'ADMIN';
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  loading: boolean;
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

  return (
    <AuthContext.Provider value={{ token, user, loading, setToken, setUser, setLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
