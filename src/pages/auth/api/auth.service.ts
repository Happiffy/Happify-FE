import { createUserWithEmailAndPassword, deleteUser, EmailAuthProvider, getRedirectResult, GoogleAuthProvider, linkWithCredential, reauthenticateWithCredential, signInWithEmailAndPassword, signInWithRedirect, signOut, updatePassword, updateProfile, type UserCredential } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { isAxiosError } from 'axios';
import apiClient from '@/config/api-client';
import { getFirebaseAuth } from '@/config/firebase';
import { Api } from '@/constants/api';

type AuthMode = 'login' | 'register';

const sessionKeys = ['happify.idToken', 'happify.userId', 'happify.role'];
const googleModeKey = 'happify.googleAuthMode';
let googleRedirectPromise: Promise<unknown> | null = null;

function clearApplicationSession() {
  sessionKeys.forEach((key) => localStorage.removeItem(key));
}

async function persistBackendUser(credential: UserCredential, mode: AuthMode, displayName?: string) {
  const idToken = await credential.user.getIdToken();
  const response = await apiClient.post(Api.authVerify, { idToken, displayName, mode });
  const user = response.data.data.user;
  localStorage.setItem('happify.idToken', idToken);
  localStorage.setItem('happify.userId', user.id);
  localStorage.setItem('happify.role', user.role ?? 'USER');
  return user;
}

function getGoogleProvider() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return provider;
}

async function startGoogleAuth(mode: AuthMode) {
  sessionStorage.setItem(googleModeKey, mode);
  try {
    await signInWithRedirect(getFirebaseAuth(), getGoogleProvider());
  } catch (error) {
    sessionStorage.removeItem(googleModeKey);
    throw error;
  }
}

export function signInWithGoogle() {
  return startGoogleAuth('login');
}

export function registerWithGoogle() {
  return startGoogleAuth('register');
}

export function completeGoogleRedirect() {
  if (googleRedirectPromise) return googleRedirectPromise;
  googleRedirectPromise = (async () => {
    const mode = sessionStorage.getItem(googleModeKey) as AuthMode | null;
    if (!mode) return null;
    try {
      const credential = await getRedirectResult(getFirebaseAuth());
      if (!credential) return null;
      return await persistBackendUser(credential, mode);
    } finally {
      sessionStorage.removeItem(googleModeKey);
    }
  })();
  return googleRedirectPromise;
}

export async function signInWithEmail(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  return persistBackendUser(credential, 'login');
}

export async function registerWithEmail(name: string, email: string, password: string) {
  const credential = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
  if (name) await updateProfile(credential.user, { displayName: name });
  try {
    return await persistBackendUser(credential, 'register', name);
  } catch (error) {
    await deleteUser(credential.user).catch(() => undefined);
    clearApplicationSession();
    throw error;
  }
}

export function getAuthErrorMessage(error: unknown, mode: 'login' | 'register') {
  if (error instanceof FirebaseError) {
    const messages: Record<string, string> = {
      'auth/email-already-in-use': 'Email ini sudah terdaftar. Silakan login.',
      'auth/invalid-credential': mode === 'login' ? 'Email atau password salah.' : 'Email sudah terdaftar dengan password berbeda.',
      'auth/weak-password': 'Password minimal 6 karakter dan harus lebih kuat.',
      'auth/invalid-email': 'Format email tidak valid.',
      'auth/popup-closed-by-user': 'Login Google dibatalkan.',
      'auth/popup-blocked': 'Popup Google diblokir browser. Izinkan popup lalu coba lagi.',
      'auth/cancelled-popup-request': 'Permintaan login Google sebelumnya dibatalkan. Coba lagi.',
      'auth/account-exists-with-different-credential': 'Email ini sudah memakai metode login lain. Login dengan metode sebelumnya.',
      'auth/credential-already-in-use': 'Akun Google ini sudah terhubung ke akun lain.',
      'auth/provider-already-linked': 'Metode login ini sudah terhubung ke akun Anda.',
      'auth/requires-recent-login': 'Silakan login ulang sebelum melanjutkan.',
      'auth/too-many-requests': 'Terlalu banyak percobaan. Coba lagi beberapa saat lagi.',
      'auth/user-disabled': 'Akun ini telah dinonaktifkan.',
      'auth/web-storage-unsupported': 'Browser memblokir penyimpanan yang dibutuhkan untuk login Google.',
      'auth/unauthorized-domain': 'Domain aplikasi ini belum diizinkan di Firebase Authentication.',
      'auth/operation-not-allowed': 'Metode login ini belum diaktifkan di Firebase Authentication.',
      'auth/network-request-failed': 'Koneksi ke Firebase gagal. Periksa internet lalu coba lagi.',
    };
    return messages[error.code] ?? `Firebase error: ${error.code.replace('auth/', '').replaceAll('-', ' ')}.`;
  }
  if (isAxiosError(error)) {
    return error.response?.data?.message ?? 'Server Happify tidak dapat memproses akun. Coba lagi sebentar.';
  }
  return mode === 'register' ? 'Registrasi gagal. Silakan coba lagi.' : 'Login gagal. Silakan coba lagi.';
}

export async function logout() {
  try {
    await signOut(getFirebaseAuth());
  } finally {
    clearApplicationSession();
    sessionStorage.removeItem(googleModeKey);
  }
}

export function isPasswordProvider() {
  const user = getFirebaseAuth().currentUser;
  return Boolean(user?.providerData.some((provider) => provider.providerId === 'password'));
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const user = getFirebaseAuth().currentUser;
  if (!user?.email) throw new Error('No signed-in user.');
  if (isPasswordProvider()) {
    await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, currentPassword));
    await updatePassword(user, newPassword);
    return;
  }
  await linkWithCredential(user, EmailAuthProvider.credential(user.email, newPassword));
}
