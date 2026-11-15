// src/app/_layout.tsx
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { useRouter, useSegments, Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { PasswordSetupModal } from '@/components/password-setup-modal';
import { AuthProvider, useAuth } from '@/context/auth-context';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { status, firebaseUser, user } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  const providerIds: string[] = (firebaseUser?.providerData ?? []).map(
    (provider: { providerId: string }) => provider.providerId
  );
  const needsPasswordSetup =
    status === 'authenticated' &&
    !!user?.email &&
    providerIds.includes('google.com') &&
    !providerIds.includes('password');

  // Redirect logic: jaga konsistensi rute berdasarkan status auth
  useEffect(() => {
    if (status === 'loading') return;

    const inLoginPage = segments[0] === 'login';

    if (status === 'unauthenticated' && !inLoginPage) {
      router.replace('/login');
    } else if (status === 'authenticated' && inLoginPage) {
      router.replace('/');
    }
  }, [status, segments]);

  // Jika sudah terautentikasi → tampilkan AppTabs (tab navigator)
  // Jika belum / loading → Slot akan render halaman login setelah redirect
  if (status === 'authenticated') {
    return (
      <>
        <AppTabs />
        <PasswordSetupModal visible={needsPasswordSetup} />
      </>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        {/* AnimatedSplashOverlay menangani SplashScreen.hideAsync() sendiri */}
        <AnimatedSplashOverlay />
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}
