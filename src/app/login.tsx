// src/app/login.tsx
import { Montserrat_800ExtraBold, useFonts } from '@expo-google-fonts/montserrat';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PasswordEye } from '@/components/password-eye';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';

const ACCENT = '#4F6EF7';
const INK = '#111827';

// Ganti file ini dengan gambar header Anda sendiri jika mau.
const headerImage = require('@/assets/images/login-header.jpg');

type AuthMode = 'login' | 'register';

/** Ikon outline minimal untuk email. */
function MailIcon() {
  return (
    <View style={icons.mail}>
      <View style={icons.mailBody}>
        <View style={icons.mailFlapLeft} />
        <View style={icons.mailFlapRight} />
      </View>
    </View>
  );
}

/** Ikon outline minimal untuk password. */
function LockIcon() {
  return (
    <View style={icons.lock}>
      <View style={icons.lockShackle} />
      <View style={icons.lockBody} />
      <View style={icons.lockDot} />
    </View>
  );
}

export default function LoginScreen() {
  const {
    signInWithGoogle,
    signInWithEmailPassword,
    registerWithEmailPassword,
    error,
    status,
    clearError,
  } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [emailSubmitting, setEmailSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const { height: windowHeight } = useWindowDimensions();
  const [montserratLoaded] = useFonts({ Montserrat_800ExtraBold });

  // Hapus pesan error sisa sesi sebelumnya (misalnya setelah logout).
  useEffect(() => {
    clearError();
  }, [clearError]);

  const isLoading = status === 'loading' || emailSubmitting || googleSubmitting;
  const displayError = localError ?? error;
  const isRegister = mode === 'register';

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setConfirmPassword('');
    setShowConfirmPassword(false);
    setLocalError(null);
    clearError();
  };

  const handleGoogleLogin = async () => {
    setLocalError(null);
    setGoogleSubmitting(true);
    try {
      await signInWithGoogle();
    } finally {
      setGoogleSubmitting(false);
    }
  };

  const handleEmailAuth = async () => {
    setLocalError(null);

    if (!email.trim() || !password) {
      setLocalError('Email dan password wajib diisi.');
      return;
    }
    if (isRegister && !confirmPassword) {
      setLocalError('Konfirmasi password wajib diisi.');
      return;
    }
    if (isRegister && password.length < 6) {
      setLocalError('Password minimal 6 karakter.');
      return;
    }
    if (isRegister && password !== confirmPassword) {
      setLocalError('Password dan konfirmasi password tidak sama.');
      return;
    }

    setEmailSubmitting(true);
    try {
      if (isRegister) {
        await registerWithEmailPassword(email, password);
      } else {
        await signInWithEmailPassword(email, password);
      }
    } finally {
      setEmailSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <Image
          source={headerImage}
          style={[styles.headerImage, { height: windowHeight * 0.275 }]}
          resizeMode="cover"
        />
        <View style={styles.sheet}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Hero */}
            <View style={styles.hero}>
              <ThemedText style={[styles.title, montserratLoaded && styles.titleFont]}>
                StudentHub
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                Test Firebase Autentikasi, Database Firestore{'\n'}dan User Management Role.
              </ThemedText>
            </View>

            <View style={styles.content}>
              {displayError ? (
                <View style={styles.errorBox}>
                  <ThemedText style={styles.errorText}>⚠️ {displayError}</ThemedText>
                </View>
              ) : null}

              {/* Segmented toggle: Login / Register */}
              <View style={styles.segmented}>
                <Pressable
                  style={[styles.segment, !isRegister && styles.segmentActive]}
                  onPress={() => switchMode('login')}
                  disabled={isLoading}
                >
                  <ThemedText
                    style={[styles.segmentText, !isRegister && styles.segmentTextActive]}
                  >
                    Masuk
                  </ThemedText>
                </Pressable>
                <Pressable
                  style={[styles.segment, isRegister && styles.segmentActive]}
                  onPress={() => switchMode('register')}
                  disabled={isLoading}
                >
                  <ThemedText
                    style={[styles.segmentText, isRegister && styles.segmentTextActive]}
                  >
                    Daftar
                  </ThemedText>
                </Pressable>
              </View>

              <View style={styles.form}>
                <View style={styles.inputShell}>
                  <MailIcon />
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={(value) => { setEmail(value); setLocalError(null); }}
                    placeholder="Email"
                    placeholderTextColor="#C0C4CF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    editable={!isLoading}
                  />
                </View>

                <View style={styles.inputShell}>
                  <LockIcon />
                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={(value) => { setPassword(value); setLocalError(null); }}
                    placeholder="Password"
                    placeholderTextColor="#C0C4CF"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete={isRegister ? 'new-password' : 'current-password'}
                    editable={!isLoading}
                  />
                  <PasswordEye
                    showPassword={showPassword}
                    onPress={() => setShowPassword((prev) => !prev)}
                    disabled={isLoading}
                  />
                </View>

                {isRegister ? (
                  <View style={styles.inputShell}>
                    <LockIcon />
                    <TextInput
                      style={styles.input}
                      value={confirmPassword}
                      onChangeText={(value) => { setConfirmPassword(value); setLocalError(null); }}
                      placeholder="Konfirmasi password"
                      placeholderTextColor="#C0C4CF"
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoComplete="new-password"
                      editable={!isLoading}
                    />
                    <PasswordEye
                      showPassword={showConfirmPassword}
                      onPress={() => setShowConfirmPassword((prev) => !prev)}
                      disabled={isLoading}
                    />
                  </View>
                ) : null}

                {/* Remember me — preferensi tampilan; sesi tetap dijaga Firebase Auth. */}
                <Pressable
                  style={styles.rememberRow}
                  onPress={() => setRememberMe((prev) => !prev)}
                  disabled={isLoading}
                >
                  <View style={[styles.switchTrack, rememberMe && styles.switchTrackOn]}>
                    <View style={[styles.switchKnob, rememberMe && styles.switchKnobOn]} />
                  </View>
                  <ThemedText style={styles.rememberLabel}>Remember me</ThemedText>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.primaryButton,
                    pressed || isLoading ? styles.buttonPressed : null,
                  ]}
                  onPress={handleEmailAuth}
                  disabled={isLoading}
                >
                  {emailSubmitting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <ThemedText style={styles.primaryButtonText}>
                      {isRegister ? 'Daftar' : 'Masuk'}
                    </ThemedText>
                  )}
                </Pressable>
              </View>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <ThemedText style={styles.dividerText}>atau</ThemedText>
                <View style={styles.dividerLine} />
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.googleButton,
                  pressed || isLoading ? styles.buttonPressed : null,
                ]}
                onPress={handleGoogleLogin}
                disabled={isLoading}
              >
                {googleSubmitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <View style={styles.googleIconBox}>
                      <ThemedText style={styles.gLetter}>G</ThemedText>
                    </View>
                    <ThemedText style={styles.googleButtonText}>
                      Continue with Google
                    </ThemedText>
                  </>
                )}
              </Pressable>
            </View>

            <ThemedText style={styles.creditText}>
              @Created by Urbanopsboys 2026
            </ThemedText>
          </ScrollView>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safe: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 30,
    paddingBottom: Spacing.four,
  },
  headerImage: {
    width: '100%',
    backgroundColor: '#E8EDFF',
  },
  sheet: {
    flex: 1,
    marginTop: -28,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  content: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
  },
  // Hero (warna & ikon lama)
  hero: {
    alignItems: 'center',
    marginBottom: Spacing.three,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
  },
  title: {
    fontSize: 35,
    lineHeight: 45,
    fontWeight: '900',
    color: INK,
    letterSpacing: -1,
    textAlign: 'center',
  },
  titleFont: {
    fontFamily: 'Montserrat_800ExtraBold',
  },
  subtitle: {
    marginTop: Spacing.two,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },

  // Error
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: Spacing.three,
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
    marginBottom: Spacing.three,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 12,
    lineHeight: 17,
  },

  // Segmented toggle
  segmented: {
    flexDirection: 'row',
    backgroundColor: '#E8EDFF',
    borderRadius: 999,
    padding: 3,
    marginBottom: Spacing.three,
  },
  segment: {
    flex: 1,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  segmentTextActive: {
    color: ACCENT,
    fontWeight: '800',
  },

  // Form
  form: {
    gap: 10,
  },
  inputShell: {
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F8FC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 999,
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: INK,
    paddingVertical: 0,
  },

  // Remember me
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
  },
  switchTrack: {
    width: 34,
    height: 20,
    borderRadius: 999,
    backgroundColor: '#D7DEE5',
    padding: 2.5,
    justifyContent: 'center',
  },
  switchTrackOn: {
    backgroundColor: ACCENT,
  },
  switchKnob: {
    width: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
  },
  switchKnobOn: {
    alignSelf: 'flex-end',
  },
  rememberLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Actions
  primaryButton: {
    height: 44,
    borderRadius: 999,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginVertical: Spacing.three,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  googleButton: {
    height: 44,
    borderRadius: 999,
    backgroundColor: ACCENT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  googleIconBox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gLetter: {
    color: ACCENT,
    fontSize: 13,
    fontWeight: '800',
  },
  googleButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  creditText: {
    marginTop: 'auto',
    paddingVertical: Spacing.three,
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

// Ikon outline (abu-abu mengikuti palet lama)
const icons = StyleSheet.create({
  mail: {
    width: 20,
    height: 20,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mailBody: {
    width: 19,
    height: 14,
    borderWidth: 1.6,
    borderColor: '#9CA3AF',
    borderRadius: 3,
    overflow: 'hidden',
  },
  mailFlapLeft: {
    position: 'absolute',
    top: 3,
    left: 1,
    width: 11,
    height: 1.6,
    backgroundColor: '#9CA3AF',
    transform: [{ rotate: '28deg' }],
  },
  mailFlapRight: {
    position: 'absolute',
    top: 3,
    right: 1,
    width: 11,
    height: 1.6,
    backgroundColor: '#9CA3AF',
    transform: [{ rotate: '-28deg' }],
  },
  lock: {
    width: 20,
    height: 20,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  lockShackle: {
    width: 11,
    height: 10,
    borderWidth: 1.6,
    borderBottomWidth: 0,
    borderColor: '#9CA3AF',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  lockBody: {
    width: 17,
    height: 12,
    marginTop: -1,
    borderWidth: 1.6,
    borderColor: '#9CA3AF',
    borderRadius: 3,
  },
  lockDot: {
    position: 'absolute',
    bottom: 5,
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#9CA3AF',
  },
});
