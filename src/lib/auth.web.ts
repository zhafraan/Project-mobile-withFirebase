// src/lib/auth.web.ts
// Implementasi auth khusus WEB — pakai Firebase JS SDK + Google popup
// Metro otomatis pilih file ini saat `expo start --web`

import {
  GoogleAuthProvider,
  onAuthStateChanged as _onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  getAuth as _getAuth,
  type User,
  type UserCredential,
} from 'firebase/auth';

import { firebaseApp } from './firebase.web';

export type { User as FirebaseUser };

export type AuthUser = {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
};

const USER_KEY = 'firebase_user';

/** Tidak perlu konfigurasi native di web */
export function configureGoogleSignIn(_webClientId: string) {
  // No-op di web — Google Sign-In pakai popup langsung
}

/** Ambil instance auth (Firebase JS SDK) */
export function getAuth() {
  return _getAuth(firebaseApp);
}

/** Re-export agar auth-context bisa pakai */
export { _onAuthStateChanged as onAuthStateChanged };

/** Login dengan Google — pakai popup di web */
export async function signInWithGoogle(): Promise<UserCredential> {
  const auth = getAuth();
  const provider = new GoogleAuthProvider();
  provider.addScope('profile');
  provider.addScope('email');

  const result = await signInWithPopup(auth, provider);
  await saveUserToStorage(result.user);
  return result;
}

/** Logout */
export async function signOut(): Promise<void> {
  const auth = getAuth();
  await firebaseSignOut(auth);
  localStorage.removeItem(USER_KEY);
}

/** Simpan user ke localStorage (web) */
export async function saveUserToStorage(user: User): Promise<void> {
  const data: AuthUser = {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
  };
  localStorage.setItem(USER_KEY, JSON.stringify(data));
}

/** Ambil user dari localStorage (web) */
export async function getUserFromStorage(): Promise<AuthUser | null> {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

