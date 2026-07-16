import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

function getFirebaseConfig() {
  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  };

  if (!config.apiKey || !config.authDomain || !config.projectId || !config.appId) {
    throw new Error('Firebase environment variables are not configured.');
  }

  return config;
}

export function getFirebaseAuth() {
  if (!app) app = initializeApp(getFirebaseConfig());
  if (!auth) auth = getAuth(app);
  return auth;
}
