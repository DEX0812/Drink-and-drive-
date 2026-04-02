import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';

const BASE_URL = 'http://localhost:4000/api'; // In production, move to env

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// Request Interceptor: Inject JWT Token
client.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response Interceptor: Global Error Handling
client.interceptors.response.use((response) => {
  return response;
}, (error) => {
  const message = error.response?.data?.message || 'A network error occurred. Please check your connection.';
  
  if (error.response?.status === 401) {
    // Optional: Global Logout logic
  }

  // Only show alerts in a React Native context
  if (typeof Alert !== 'undefined') {
    Alert.alert('PLATFORM ERROR', message);
  }

  return Promise.reject(error);
});

export default client;
