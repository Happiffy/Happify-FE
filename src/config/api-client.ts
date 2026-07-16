import axios from 'axios';
import { getFirebaseAuth } from '@/config/firebase';
import { ApiService } from '@/constants/api-service';

const apiClient = axios.create({
  baseURL: ApiService.baseURL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await getFirebaseAuth().currentUser?.getIdToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    localStorage.setItem('happify.idToken', token);
  }
  return config;
});

export default apiClient;
