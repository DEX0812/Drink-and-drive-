import axios from 'axios';

const DEFAULT_IP = 'localhost';
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || `http://${DEFAULT_IP}:4000/api`; 

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: 'RIDER' | 'DRIVER' | 'ADMIN';
  };
}

export const authApi = {
  register: async (data: any): Promise<AuthResponse> => {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, data);
    return response.data;
  },

  login: async (data: any): Promise<AuthResponse> => {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, data);
    return response.data;
  }
};
