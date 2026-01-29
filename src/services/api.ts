import axios from 'axios';

const API_URL = 'https://ecogom-backend.onrender.com';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const wasteApi = {
  getAll: async (keyword?: string) => {
    try {
      const response = await api.get('/wastes', { params: { keyword } });
      return response.data;
    } catch (error) {
      console.error('Error fetching wastes:', error);
      return [];
    }
  },
  
  getTodaySchedule: async (villageName: string) => {
    try {
      const response = await api.get('/schedules/today', { params: { village: villageName } });
      return response.data;
    } catch (error) {
      console.error('Error fetching schedule:', error);
      return null;
    }
  },

  getLocations: async () => {
    try {
      const response = await api.get('/locations');
      return response.data;
    } catch (error) {
      console.error('Error fetching locations:', error);
      return [];
    }
  },
};