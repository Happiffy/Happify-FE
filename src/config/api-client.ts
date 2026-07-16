import axios, { type InternalAxiosRequestConfig } from 'axios';
import { getFirebaseAuth } from '@/config/firebase';
import { ApiService } from '@/constants/api-service';

const apiClient = axios.create({
  baseURL: ApiService.baseURL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(async (config) => {
  const auth = getFirebaseAuth();
  await auth.authStateReady();
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(undefined, async (error) => {
  const config = error.config as (InternalAxiosRequestConfig & { _authRetried?: boolean }) | undefined;
  const auth = getFirebaseAuth();
  if (error.response?.status === 401 && auth.currentUser && config && !config._authRetried) {
    config._authRetried = true;
    const token = await auth.currentUser.getIdToken(true);
    config.headers.Authorization = `Bearer ${token}`;
    return apiClient(config);
  }
  if (error.response?.status === 401) {
    await auth.signOut();
    ['happify.idToken', 'happify.userId', 'happify.role'].forEach((key) => localStorage.removeItem(key));
    if (window.location.pathname.startsWith('/dashboard')) window.location.assign('/login');
  }
  return Promise.reject(error);
});

export default apiClient;
