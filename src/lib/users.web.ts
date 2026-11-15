// src/lib/users.web.ts
// Service profil user + role (web Firestore JS SDK)

import {
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Timestamp,
} from 'firebase/firestore';

import { firebaseApp } from './firebase.web';

export type UserRole = 'super_admin' | 'admin' | 'user';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  providers: string[];
  createdAt: Timestamp | null;
  lastLoginAt: Timestamp | null;
}

export type AuthProfileSource = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  providerData: { providerId: string }[];
};

const COLLECTION = 'users';

function getDb() {
  return getFirestore(firebaseApp);
}

export function normalizeEmail(email: string | null): string | null {
  return email ? email.trim().toLowerCase() : null;
}

export function parseRole(value: unknown): UserRole {
  if (typeof value !== 'string') return 'user';
  const clean = value.trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (clean === 'super_admin' || clean === 'superadmin') return 'super_admin';
  if (clean === 'admin') return 'admin';
  return 'user';
}

export function getProviders(source: AuthProfileSource): string[] {
  return Array.from(new Set(source.providerData.map((provider) => provider.providerId)));
}

/** Buat profil jika belum ada, lalu perbarui data login. Role tidak pernah ditimpa. */
export async function ensureUserProfile(source: AuthProfileSource): Promise<UserProfile> {
  const ref = doc(getDb(), COLLECTION, source.uid);
  const snapshot = await getDoc(ref);

  const email = normalizeEmail(source.email);
  const providers = getProviders(source);

  if (snapshot.exists()) {
    const data = snapshot.data() as Partial<UserProfile>;
    const displayName = source.displayName ?? data.displayName ?? null;
    const photoURL = source.photoURL ?? data.photoURL ?? null;

    await updateDoc(ref, {
      email,
      displayName,
      photoURL,
      providers,
      lastLoginAt: serverTimestamp(),
    });

    return {
      uid: source.uid,
      email,
      displayName,
      photoURL,
      role: parseRole(data.role),
      providers,
      createdAt: (data.createdAt as Timestamp) ?? null,
      lastLoginAt: (data.lastLoginAt as Timestamp) ?? null,
    };
  }

  await setDoc(ref, {
    uid: source.uid,
    email,
    displayName: source.displayName,
    photoURL: source.photoURL,
    role: 'user' as UserRole,
    providers,
    createdAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
  });

  return {
    uid: source.uid,
    email,
    displayName: source.displayName,
    photoURL: source.photoURL,
    role: 'user',
    providers,
    createdAt: null,
    lastLoginAt: null,
  };
}

/** Pantau perubahan profil/role secara realtime. */
export function subscribeUserProfile(
  uid: string,
  onData: (profile: UserProfile | null) => void,
  onError?: (error: Error) => void
): () => void {
  const ref = doc(getDb(), COLLECTION, uid);

  return onSnapshot(
    ref,
    (snapshot) => {
      if (!snapshot.exists()) {
        onData(null);
        return;
      }

      const data = snapshot.data() as Partial<UserProfile>;
      onData({
        uid: snapshot.id,
        email: normalizeEmail(data.email ?? null),
        displayName: data.displayName ?? null,
        photoURL: data.photoURL ?? null,
        role: parseRole(data.role),
        providers: Array.isArray(data.providers) ? data.providers : [],
        createdAt: (data.createdAt as Timestamp) ?? null,
        lastLoginAt: (data.lastLoginAt as Timestamp) ?? null,
      });
    },
    (error) => onError?.(error as Error)
  );
}
