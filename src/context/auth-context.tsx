// src/context/auth-context.tsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  getAuth,
  onAuthStateChanged,
  type User as FirebaseUser,
} from '@react-native-firebase/auth';

import { getAuthErrorMessage } from '@/lib/auth-errors';
import {
  type AuthUser,
  configureGoogleSignIn,
  getUserFromStorage,
  linkPasswordToCurrentUser as _linkPasswordToCurrentUser,
  saveUserToStorage,
  signInWithEmailPassword as _signInWithEmailPassword,
  signInWithGoogle as _signInWithGoogle,
  signOut as _signOut,
} from '@/lib/auth';
import {
  ensureUserProfile,
  subscribeUserProfile,
  type UserRole,
} from '@/lib/users';

// Web Client ID dari google-services.json (oauth_client dengan client_type: 3)
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  user: AuthUser | null;
  firebaseUser: FirebaseUser | null;
  status: AuthStatus;
  role: UserRole | null;
  providers: string[];
  isSuperAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmailPassword: (email: string, password: string) => Promise<void>;
  linkPassword: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  firebaseUser: null,
  status: 'loading',
  role: null,
  providers: [],
  isSuperAdmin: false,
  signInWithGoogle: async () => {},
  signInWithEmailPassword: async () => {},
  linkPassword: async () => {},
  signOut: async () => {},
  error: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [role, setRole] = useState<UserRole | null>(null);
  const [providers, setProviders] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    configureGoogleSignIn(WEB_CLIENT_ID);

    // Cek local storage dulu (bypass login kalau masih ada token aktif)
    getUserFromStorage().then((cached) => {
      if (cached) {
        setUser(cached);
        // Status final akan dikonfirmasi oleh Firebase auth listener
      }
    });

    let active = true;
    let unsubscribeProfile: (() => void) | undefined;

    // Firebase auth state listener — sumber kebenaran utama
    const auth = getAuth();
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      unsubscribeProfile?.();
      unsubscribeProfile = undefined;

      if (!active) return;
      setFirebaseUser(fbUser);

      if (!fbUser) {
        setUser(null);
        setRole(null);
        setProviders([]);
        setStatus('unauthenticated');
        return;
      }

      await saveUserToStorage(fbUser);
      if (!active) return;

      setUser({
        uid: fbUser.uid,
        displayName: fbUser.displayName,
        email: fbUser.email,
        photoURL: fbUser.photoURL,
      });
      setStatus('authenticated');

      try {
        const profile = await ensureUserProfile(fbUser);
        if (!active) return;

        setRole(profile.role);
        setProviders(profile.providers);

        unsubscribeProfile = subscribeUserProfile(
          fbUser.uid,
          (next) => {
            if (!active || !next) return;
            setRole(next.role);
            setProviders(next.providers);
          },
          (err) => {
            if (active) setError(err.message);
          }
        );
      } catch (e: any) {
        if (active) {
          setError(e?.message ?? 'Gagal memuat profil pengguna');
        }
      }
    });

    return () => {
      active = false;
      unsubscribeAuth();
      unsubscribeProfile?.();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    try {
      await _signInWithGoogle();
      // onAuthStateChanged akan mengupdate state secara otomatis
    } catch (e: any) {
      setError(getAuthErrorMessage(e));
    }
  }, []);

  const signInWithEmailPassword = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      await _signInWithEmailPassword(email, password);
      // onAuthStateChanged akan mengupdate state secara otomatis
    } catch (e: any) {
      setError(getAuthErrorMessage(e));
    }
  }, []);

  const linkPassword = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const credential = await _linkPasswordToCurrentUser(email, password);
      setFirebaseUser(credential.user);
      const profile = await ensureUserProfile(credential.user);
      setRole(profile.role);
      setProviders(profile.providers);
    } catch (e: any) {
      setError(getAuthErrorMessage(e));
      throw e;
    }
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    try {
      await _signOut();
    } catch (e: any) {
      setError(e?.message ?? 'Logout gagal');
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      firebaseUser,
      status,
      role,
      providers,
      isSuperAdmin: role === 'super_admin',
      signInWithGoogle,
      signInWithEmailPassword,
      linkPassword,
      signOut,
      error,
    }),
    [
      user,
      firebaseUser,
      status,
      role,
      providers,
      signInWithGoogle,
      signInWithEmailPassword,
      linkPassword,
      signOut,
      error,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
