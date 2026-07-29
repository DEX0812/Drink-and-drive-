import client from './client';

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
    const response = await client.post('/auth/register', data);
    return response.data;
  },

  login: async (data: any): Promise<AuthResponse> => {
    const response = await client.post('/auth/login', data);
    return response.data;
  }
};
