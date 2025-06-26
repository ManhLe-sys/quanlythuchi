import axios from 'axios';
import type { InternalAxiosRequestConfig, AxiosError } from 'axios';
import { CONFIG } from '../config/config';

const axiosInstance = axios.create({
  baseURL: CONFIG.API.BASE_URL,
  timeout: CONFIG.API.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle errors here
    return Promise.reject(error);
  }
);

export const apiService = {
  get: (url: string, params = {}) => axiosInstance.get(url, { params }),
  post: (url: string, data = {}) => axiosInstance.post(url, data),
  put: (url: string, data = {}) => axiosInstance.put(url, data),
  delete: (url: string) => axiosInstance.delete(url),
}; 