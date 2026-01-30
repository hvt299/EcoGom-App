import axios from 'axios';
import { Waste } from '../types/waste';
import { ScheduleResponse, Schedule } from '../types/schedule';
import { Location } from '../types/location';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json', },
});

export const wasteApi = {
  getAll: async (keyword?: string): Promise<Waste[]> => {
    try {
      const response = await api.get('/wastes', { params: { keyword } });
      return response.data;
    } catch (error) {
      console.error('Error fetching wastes:', error);
      return [];
    }
  },
};

export const scheduleApi = {
  getAll: async (): Promise<Schedule[]> => {
    try {
      const response = await api.get('/schedules');
      return response.data;
    } catch (error) {
      return [];
    }
  },

  getTodaySchedule: async (villageName: string): Promise<ScheduleResponse | null> => {
    try {
      const response = await api.get('/schedules/today', { params: { village: villageName } });
      return response.data;
    } catch (error) {
      console.error('Error fetching schedule:', error);
      return null;
    }
  },

  getFullByVillage: async (villageName: string) => {
    try {
      const response = await api.get('/schedules/detail', { 
        params: { village: villageName } 
      });
      return response.data;
    } catch (error) {
      return null;
    }
  },
};

export const locationApi = {
  getAll: async (): Promise<Location[]> => {
    try {
      const response = await api.get('/locations');
      return response.data;
    } catch (error) {
      console.error('Error fetching locations:', error);
      return [];
    }
  },
};