// src/app/_layout.tsx
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { useRouter, useSegments, Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { AuthProvider, useAuth } from '@/context/auth-context';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { status } = useAuth();
  const router = useRouter();
  const segments = useSegments();

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
    return <AppTabs />;
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
