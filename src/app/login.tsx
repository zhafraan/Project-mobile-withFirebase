// src/app/login.tsx
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';

export default function LoginScreen() {
  const { signInWithGoogle, error, status } = useAuth();
  const isLoading = status === 'loading';

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safe}>

        {/* Top decoration */}
        <View style={styles.topBlob} />

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.iconWrapper}>
            <ThemedText style={styles.iconEmoji}>🎓</ThemedText>
          </View>
          <ThemedText style={styles.title}>Firebase App MHS</ThemedText>
          <ThemedText style={styles.subtitle}>
           Testing Firebase Autentikasi dengan Google {'\n'}dan database Firestore
          </ThemedText>
        </View>

        {/* Card login */}
        <View style={styles.card}>
          {error ? (
            <View style={styles.errorBox}>
              <ThemedText style={styles.errorText}>⚠️ {error}</ThemedText>
            </View>
          ) : null}

          <Pressable
            style={({ pressed }) => [
              styles.googleButton,
              pressed || isLoading ? styles.googleButtonPressed : null,
            ]}
            onPress={signInWithGoogle}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <View style={styles.googleIconBox}>
                  <ThemedText style={styles.gLetter}>G</ThemedText>
                </View>
                <ThemedText style={styles.googleButtonText}>
                  Lanjutkan dengan Google
                </ThemedText>
              </>
            )}
          </Pressable>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <ThemedText style={styles.dividerText}>atau</ThemedText>
            <View style={styles.dividerLine} />
          </View>

          <ThemedText style={styles.terms}>
            Dengan masuk kamu menyetujui{' '}
            <ThemedText style={styles.termsLink}>Kebijakan Privasi</ThemedText>
            {' '}aplikasi ini.
          </ThemedText>
        </View>

        {/* Bottom safe space */}
        <View style={{ height: Spacing.four }} />
      </SafeAreaView>
    </View>
  );
}

const ACCENT = '#4F6EF7';
const ACCENT2 = '#7C3AED';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FC',
  },
  safe: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },

  // Top decoration blob
  topBlob: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#E8EDFF',
    opacity: 0.8,
  },

  // Hero
  hero: {
    alignItems: 'center',
    marginBottom: 36,
    gap: Spacing.two,
    width: '100%',
    maxWidth: 420,
  },
  iconWrapper: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 6,
  },
  iconEmoji: {
    fontSize: 44,
    lineHeight: 52,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Card
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: Spacing.four,
    gap: Spacing.three,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 20,
    elevation: 4,
  },

  // Error
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: Spacing.three,
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
  },

  // Google button
  googleButton: {
    backgroundColor: ACCENT,
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: Spacing.four,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  googleButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  googleIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gLetter: {
    color: ACCENT,
    fontWeight: '800',
    fontSize: 15,
  },
  googleButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    fontSize: 12,
    color: '#9CA3AF',
  },

  // Terms
  terms: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: ACCENT,
    fontWeight: '600',
    fontSize: 12,
  },
});

