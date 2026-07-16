import { createUserWithEmailAndPassword, EmailAuthProvider, GoogleAuthProvider, linkWithCredential, reauthenticateWithCredential, signInWithEmailAndPassword, signInWithPopup, updatePassword, updateProfile, type UserCredential } from 'firebase/auth';
import apiClient from '@/config/api-client';
import { getFirebaseAuth } from '@/config/firebase';
import { Api } from '@/constants/api';

async function persistBackendUser(credential: UserCredential, mode: 'login' | 'register', displayName?: string) {
  const idToken = await credential.user.getIdToken();
  localStorage.setItem('happify.idToken', idToken);

  const response = await apiClient.post(Api.authVerify, { idToken, displayName, mode });
  const user = response.data.data.user;
  localStorage.setItem('happify.userId', user.id);
  localStorage.setItem('happify.role', user.role ?? 'USER');
  return user;
}

export async function signInWithGoogle() {
  const credential = await signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider());
  return persistBackendUser(credential, 'login');
}

export async function registerWithGoogle() {
  const credential = await signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider());
  return persistBackendUser(credential, 'register');
}

export async function signInWithEmail(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  return persistBackendUser(credential, 'login');
}

export async function registerWithEmail(name: string, email: string, password: string) {
  const credential = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
  if (name) await updateProfile(credential.user, { displayName: name });
  return persistBackendUser(credential, 'register', name);
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
