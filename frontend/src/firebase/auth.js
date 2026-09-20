import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from './config';

export async function registerWithEmail(email, password) {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('Firebase Authentication is not configured. Please add your Firebase credentials to frontend/.env.');
  }
  return await createUserWithEmailAndPassword(auth, email, password);
}

export async function loginWithEmail(email, password) {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('Firebase Authentication is not configured. Please add your Firebase credentials to frontend/.env.');
  }
  return await signInWithEmailAndPassword(auth, email, password);
}

export async function logoutUser() {
  if (!auth) return;
  return await signOut(auth);
}

export function onUserAuthStateChanged(callback) {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}
