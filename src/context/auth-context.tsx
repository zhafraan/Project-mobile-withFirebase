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

import {
  type AuthUser,
  configureGoogleSignIn,
  getUserFromStorage,
  saveUserToStorage,
  signInWithGoogle as _signInWithGoogle,
  signOut as _signOut,
} from '@/lib/auth';

// Web Client ID dari google-services.json (oauth_client dengan client_type: 3)
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  user: AuthUser | null;
  firebaseUser: FirebaseUser | null;
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
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
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

    // Firebase auth state listener — sumber kebenaran utama
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        await saveUserToStorage(fbUser);
        setUser({
          uid: fbUser.uid,
          displayName: fbUser.displayName,
          email: fbUser.email,
          photoURL: fbUser.photoURL,
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
      // onAuthStateChanged akan mengupdate state secara otomatis
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
