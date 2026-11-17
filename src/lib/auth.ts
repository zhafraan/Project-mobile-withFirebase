// src/lib/auth.ts
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  getAuth,
  linkWithCredential,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  signInWithCredential,
  GoogleAuthProvider,
  type User,
  type UserCredential,
} from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type { User as FirebaseUser };

function getGoogleSignin(): any {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- dimuat dinamis agar web tidak ikut memuat modul native
    const { GoogleSignin } = require('@react-native-google-signin/google-signin');
    return GoogleSignin;
  } catch {
    return null;
  }
}

const USER_KEY = 'firebase_user';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export type AuthUser = {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
};

/** Konfigurasi Google Sign-In — panggil sekali di startup */
export function configureGoogleSignIn(webClientId: string) {
  const GoogleSignin = getGoogleSignin();
  if (GoogleSignin) {
    GoogleSignin.configure({ webClientId });
  } else {
    console.warn('[GoogleSignin] Modul native RNGoogleSignin belum terpasang di APK ini.');
  }
}

/** Login dengan Google */
export async function signInWithGoogle(): Promise<UserCredential> {
  const GoogleSignin = getGoogleSignin();
  if (!GoogleSignin) {
    throw new Error(
      'Modul native Google Sign-In belum terpasang di APK ini.\nSilakan lakukan build ulang dengan:\neas build --profile development --platform android'
    );
  }

  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const signInResult = await GoogleSignin.signIn();

  const idToken = signInResult.data?.idToken ?? (signInResult as any).idToken;
  if (!idToken) throw new Error('Google Sign-In gagal: idToken tidak ditemukan');

  const credential = GoogleAuthProvider.credential(idToken);
  const auth = getAuth();
  const userCredential = await signInWithCredential(auth, credential);

  await saveUserToStorage(userCredential.user);
  return userCredential;
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

/**
 * Tambahkan provider password ke akun yang sedang login.
 * Dipakai setelah login Google agar email yang sama bisa dipakai di kedua metode.
 */
export async function linkPasswordToCurrentUser(
  email: string,
  password: string
): Promise<UserCredential> {
  const auth = getAuth();
  const current = auth.currentUser;
  if (!current) throw new Error('Harus login terlebih dahulu.');

  const credential = EmailAuthProvider.credential(normalizeEmail(email), password);
  return linkWithCredential(current, credential);
}

/** Kirim email reset password */
export async function sendResetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(getAuth(), normalizeEmail(email));
}

/** Logout */
export async function signOut(): Promise<void> {
  const auth = getAuth();
  const GoogleSignin = getGoogleSignin();
  const tasks: Promise<any>[] = [firebaseSignOut(auth), AsyncStorage.removeItem(USER_KEY)];
  if (GoogleSignin) {
    tasks.push(GoogleSignin.signOut().catch(() => {}));
  }
  await Promise.all(tasks);
}

/** Simpan user ke local storage */
export async function saveUserToStorage(user: User): Promise<void> {
  const data: AuthUser = {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
  };
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(data));
}

/** Ambil user dari local storage */
export async function getUserFromStorage(): Promise<AuthUser | null> {
  const raw = await AsyncStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

/** Re-export untuk dipakai di context */
export { getAuth, onAuthStateChanged };
