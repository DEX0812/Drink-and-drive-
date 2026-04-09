import axios from 'axios';

// 🌐 NETWORK ADVISORY: 
// When testing on a physical mobile device, "localhost" refers to the phone.
// Use your computer's local IP address (e.g. 192.168.x.x) for the API to connect.
const DEFAULT_IP = '10.3.5.82'; // Dynamically updated for local dev networking
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || `http://${DEFAULT_IP}:4000/api`;

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // Reduced for faster feedback
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT if stored
client.interceptors.request.use(
  async (config) => {
    try {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch {}
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle errors globally
client.interceptors.response.use(
  (response) => response,
  (error) => {
    // 💡 Enhanced Error Handling
    if (!error.response) {
      // No response = Network Error (Connection Refused, Timeout, etc.)
      error.message = `Network Connection Failed. Check if the server is running at ${BASE_URL} and accessible from your phone's Wi-Fi.`;
    } else if (error.status === 401) {
      try {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } catch {}
    } else if (error.status === 400 || error.status === 403) {
      // Keep original message if provided by backend
      error.message = error.response.data?.message || 'Invalid Request / Credentials';
    }

    return Promise.reject(error);
  }
);

export default client;

