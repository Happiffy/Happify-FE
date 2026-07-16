import axios from 'axios';
import { ApiService } from '@/constants/api-service';

const apiClient = axios.create({
  baseURL: ApiService.baseURL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('happify.idToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default apiClient;
