// src/lib/auth.web.ts
// Implementasi auth khusus WEB — pakai Firebase JS SDK + Google popup
// Metro otomatis pilih file ini saat `expo start --web`

import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  GoogleAuthProvider,
  linkWithCredential,
  onAuthStateChanged as _onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
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

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

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

/** Login dengan Email & Password */
export async function signInWithEmailPassword(
  email: string,
  password: string
): Promise<UserCredential> {
  return signInWithEmailAndPassword(getAuth(), normalizeEmail(email), password);
}

/** Registrasi Email & Password baru */
export async function registerWithEmailPassword(
  email: string,
  password: string
): Promise<UserCredential> {
  return createUserWithEmailAndPassword(getAuth(), normalizeEmail(email), password);
}

/** Tambahkan provider password ke akun yang sedang login (mis. setelah login Google). */
export async function linkPasswordToCurrentUser(
  email: string,
  password: string
): Promise<UserCredential> {
  const auth = getAuth();
  if (!auth.currentUser) throw new Error('Harus login terlebih dahulu.');

  const credential = EmailAuthProvider.credential(normalizeEmail(email), password);
  return linkWithCredential(auth.currentUser, credential);
}

/** Kirim email reset password */
export async function sendResetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(getAuth(), normalizeEmail(email));
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

