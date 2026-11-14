// src/context/auth-context.web.tsx
// Versi WEB dari AuthContext — pakai Firebase JS SDK
// Metro otomatis pilih file ini saat build web

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { onAuthStateChanged } from 'firebase/auth';

import {
  type AuthUser,
  configureGoogleSignIn,
  getAuth,
  getUserFromStorage,
  saveUserToStorage,
  signInWithGoogle as _signInWithGoogle,
  signOut as _signOut,
} from '@/lib/auth';

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  user: AuthUser | null;
  firebaseUser: any | null;
  status: AuthStatus;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  firebaseUser: null,
  status: 'loading',
  signInWithGoogle: async () => {},
  signOut: async () => {},
  error: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<any | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    configureGoogleSignIn(WEB_CLIENT_ID);

    // Cek cache localStorage dulu
    getUserFromStorage().then((cached) => {
      if (cached) setUser(cached);
    });

    // Firebase JS SDK auth listener
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        await saveUserToStorage(fbUser);
        setUser({
          uid: fbUser.uid,
          displayName: fbUser.displayName ?? null,
          email: fbUser.email ?? null,
          photoURL: fbUser.photoURL ?? null,
        });
        setStatus('authenticated');
      } else {
        setUser(null);
        setStatus('unauthenticated');
      }
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    try {
      await _signInWithGoogle();
    } catch (e: any) {
      setError(e?.message ?? 'Login gagal');
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
    () => ({ user, firebaseUser, status, signInWithGoogle, signOut, error }),
    [user, firebaseUser, status, signInWithGoogle, signOut, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

