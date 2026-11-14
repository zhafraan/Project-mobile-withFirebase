// src/app/explore.tsx — Explore: Info Aplikasi & Panduan Firebase
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ExternalLink } from '@/components/external-link';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import type { UserRole } from '@/lib/users';

const ROLE_META: Record<UserRole, { label: string; color: string }> = {
  super_admin: { label: 'Super Admin', color: '#7C3AED' },
  admin: { label: 'Admin', color: '#D97706' },
  user: { label: 'User', color: '#059669' },
};

const PROVIDER_LABEL: Record<string, string> = {
  'google.com': 'Google',
  password: 'Email/Password',
};

function InfoCard({ emoji, title, desc }: { emoji: string; title: string; desc: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText style={styles.cardEmoji}>{emoji}</ThemedText>
      <View style={styles.cardText}>
        <ThemedText style={styles.cardTitle}>{title}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">{desc}</ThemedText>
      </View>
    </View>
  );
}

export default function ExploreScreen() {
  const { user, role, providers, linkPassword, error } = useAuth();
  const theme = useTheme();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(
    null
  );

  const hasPassword = providers.includes('password');
  const roleMeta = role ? ROLE_META[role] : { label: 'Memuat...', color: '#9CA3AF' };

  const handleLinkPassword = async () => {
    setMessage(null);

    if (!user?.email) {
      setMessage({ type: 'error', text: 'Email akun tidak ditemukan.' });
      return;
    }
    if (password.length < 6) {
      setMessage({ type: 'error', text: 'Password minimal 6 karakter.' });
      return;
    }
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Konfirmasi password tidak sama.' });
      return;
    }

    setSaving(true);
    try {
      await linkPassword(user.email, password);
      setPassword('');
      setConfirmPassword('');
      setMessage({
        type: 'success',
        text: 'Password berhasil diatur. Sekarang kamu bisa login dengan email & password yang sama.',
      });
    } catch {
      // Pesan detail sudah disimpan di context.error
      setMessage({ type: 'error', text: 'Gagal mengatur password. Periksa pesan error di bawah.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <ThemedText type="subtitle" style={styles.heading}>Tentang Aplikasi</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.desc}>
            Aplikasi manajemen data mahasiswa berbasis Firebase dengan fitur autentikasi Google.
          </ThemedText>

          <ThemedText style={styles.sectionTitle}>Stack Teknologi</ThemedText>
          <InfoCard emoji="⚛️" title="React Native + Expo" desc="Framework cross-platform untuk Android & iOS" />
          <InfoCard emoji="🔥" title="Firebase Firestore" desc="Cloud NoSQL database realtime untuk data mahasiswa" />
          <InfoCard emoji="🔐" title="Firebase Auth + Google" desc="Autentikasi aman dengan akun Google" />
          <InfoCard emoji="💾" title="AsyncStorage" desc="Penyimpanan lokal untuk bypass login dengan token aktif" />

          <ThemedText style={styles.sectionTitle}>Fitur Utama</ThemedText>
          <InfoCard emoji="✅" title="Sign In with Google" desc="Login aman menggunakan akun Google via Firebase" />
          <InfoCard emoji="🔄" title="Auto Login" desc="Bypass halaman login jika token masih aktif di local storage" />
          <InfoCard emoji="📋" title="Daftar Mahasiswa" desc="Lihat, tambah, dan hapus data mahasiswa secara realtime" />
          <InfoCard emoji="🔍" title="Pencarian" desc="Filter mahasiswa berdasarkan nama, NIM, atau program studi" />

          <ThemedText style={styles.sectionTitle}>Info Akun</ThemedText>
          <View style={[styles.accountCard, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="small" themeColor="textSecondary">Login sebagai:</ThemedText>
            <View style={styles.accountNameRow}>
              <ThemedText style={styles.accountName}>{user?.displayName ?? '-'}</ThemedText>
              <View style={[styles.roleBadge, { backgroundColor: roleMeta.color + '18' }]}>
                <ThemedText style={[styles.roleBadgeText, { color: roleMeta.color }]}>
                  {roleMeta.label}
                </ThemedText>
              </View>
            </View>
            <ThemedText type="small" themeColor="textSecondary">{user?.email ?? '-'}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 4 }}>UID: {user?.uid ?? '-'}</ThemedText>

            <View style={styles.providersRow}>
              {providers.length === 0 ? (
                <ThemedText type="small" themeColor="textSecondary">Provider: -</ThemedText>
              ) : (
                providers.map((provider) => (
                  <View key={provider} style={styles.providerChip}>
                    <ThemedText style={styles.providerChipText}>
                      {PROVIDER_LABEL[provider] ?? provider}
                    </ThemedText>
                  </View>
                ))
              )}
            </View>
          </View>

          <ThemedText style={styles.sectionTitle}>Keamanan Akun</ThemedText>
          <View style={[styles.accountCard, { backgroundColor: theme.backgroundElement }]}>
            {hasPassword ? (
              <ThemedText type="small" themeColor="textSecondary">
                Password sudah terhubung. Kamu bisa login dengan Google maupun email & password
                dan tetap masuk ke akun yang sama.
              </ThemedText>
            ) : (
              <>
                <ThemedText style={styles.cardTitle}>Atur Password</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Hubungkan password ke akun Google ini agar bisa login dengan email & password
                  tanpa membuat akun baru.
                </ThemedText>

                {message ? (
                  <View
                    style={[
                      styles.messageBox,
                      message.type === 'success' ? styles.messageSuccess : styles.messageError,
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.messageText,
                        message.type === 'success'
                          ? styles.messageTextSuccess
                          : styles.messageTextError,
                      ]}
                    >
                      {message.text}
                    </ThemedText>
                  </View>
                ) : null}

                {error && !message ? (
                  <View style={[styles.messageBox, styles.messageError]}>
                    <ThemedText style={[styles.messageText, styles.messageTextError]}>
                      {error}
                    </ThemedText>
                  </View>
                ) : null}

                <View style={styles.fieldGroup}>
                  <ThemedText style={styles.fieldLabel}>Email</ThemedText>
                  <View style={[styles.input, styles.inputDisabled]}>
                    <ThemedText type="small" themeColor="textSecondary">
                      {user?.email ?? '-'}
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.fieldGroup}>
                  <ThemedText style={styles.fieldLabel}>Password Baru</ThemedText>
                  <View style={styles.passwordRow}>
                    <TextInput
                      style={styles.passwordInput}
                      value={password}
                      onChangeText={(value) => { setPassword(value); setMessage(null); }}
                      placeholder="Minimal 6 karakter"
                      placeholderTextColor="#C0C4CF"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!saving}
                    />
                    <Pressable
                      onPress={() => setShowPassword((prev) => !prev)}
                      hitSlop={10}
                      style={styles.passwordToggle}
                    >
                      <ThemedText style={styles.passwordToggleText}>
                        {showPassword ? 'Sembunyikan' : 'Lihat'}
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>

                <View style={styles.fieldGroup}>
                  <ThemedText style={styles.fieldLabel}>Ulangi Password</ThemedText>
                  <TextInput
                    style={styles.inputText}
                    value={confirmPassword}
                    onChangeText={(value) => { setConfirmPassword(value); setMessage(null); }}
                    placeholder="Ketik ulang password"
                    placeholderTextColor="#C0C4CF"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!saving}
                  />
                </View>

                <Pressable
                  onPress={handleLinkPassword}
                  disabled={saving}
                  style={({ pressed }) => [
                    styles.saveButton,
                    { opacity: pressed || saving ? 0.8 : 1 },
                  ]}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <ThemedText style={styles.saveButtonText}>Atur Password</ThemedText>
                  )}
                </Pressable>
              </>
            )}
          </View>

          <ThemedText style={styles.sectionTitle}>Referensi</ThemedText>
          <ExternalLink href="https://rnfirebase.io/">
            <ThemedText type="linkPrimary">📖 React Native Firebase Docs</ThemedText>
          </ExternalLink>
          <ExternalLink href="https://console.firebase.google.com/">
            <ThemedText type="linkPrimary">🔥 Firebase Console</ThemedText>
          </ExternalLink>
          <ExternalLink href="https://docs.expo.dev/">
            <ThemedText type="linkPrimary">🚀 Expo Documentation</ThemedText>
          </ExternalLink>

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: Spacing.three },
  heading: { marginTop: Spacing.four, marginBottom: Spacing.one },
  desc: { marginBottom: Spacing.three, lineHeight: 22 },
  sectionTitle: {
    fontSize: 18, fontWeight: '600',
    marginTop: Spacing.four, marginBottom: Spacing.two,
  },
  card: {
    flexDirection: 'row', gap: Spacing.two,
    padding: Spacing.three, borderRadius: 12,
    marginBottom: Spacing.two,
    alignItems: 'flex-start',
  },
  cardEmoji: { fontSize: 24, lineHeight: 28 },
  cardText: { flex: 1, gap: 2 },
  cardTitle: { fontWeight: '600', fontSize: 15 },
  accountCard: {
    padding: Spacing.three, borderRadius: 12, gap: 8,
  },
  accountNameRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flexWrap: 'wrap',
  },
  accountName: { fontWeight: '700', fontSize: 18, marginVertical: 2 },
  roleBadge: {
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4,
  },
  roleBadgeText: { fontSize: 12, fontWeight: '700' },
  providersRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4,
  },
  providerChip: {
    backgroundColor: '#E8EDFF', borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  providerChipText: { fontSize: 12, fontWeight: '600', color: '#4F6EF7' },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  inputDisabled: {
    backgroundColor: '#F1F3F9', borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
  },
  inputText: {
    backgroundColor: '#F7F8FC', borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: '#111827',
  },
  input: {
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
  },
  passwordRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F7F8FC', borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 12, paddingRight: 12,
  },
  passwordInput: {
    flex: 1, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: '#111827',
  },
  passwordToggle: { paddingVertical: 6 },
  passwordToggleText: { color: '#4F6EF7', fontSize: 12, fontWeight: '700' },
  saveButton: {
    backgroundColor: '#4F6EF7', borderRadius: 12,
    paddingVertical: 13, alignItems: 'center', justifyContent: 'center',
    marginTop: 4,
  },
  saveButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  messageBox: {
    borderRadius: 10, padding: Spacing.three, borderLeftWidth: 3,
  },
  messageSuccess: { backgroundColor: '#ECFDF5', borderLeftColor: '#059669' },
  messageError: { backgroundColor: '#FEF2F2', borderLeftColor: '#EF4444' },
  messageText: { fontSize: 12, lineHeight: 18 },
  messageTextSuccess: { color: '#047857' },
  messageTextError: { color: '#B91C1C' },
});
