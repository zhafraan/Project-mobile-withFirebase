// src/components/password-setup-modal.tsx
// Langkah wajib setelah daftar/login dengan Google:
// hubungkan provider password agar bisa login via Google maupun email & password.

import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { PasswordEye } from '@/components/password-eye';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { getAuthErrorMessage } from '@/lib/auth-errors';

const ACCENT = '#4F6EF7';

export function PasswordSetupModal({ visible }: { visible: boolean }) {
  const { user, linkPassword, signOut, error } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const displayError = localError ?? error;

  const handleSave = async () => {
    setLocalError(null);

    if (!user?.email) {
      setLocalError('Email akun Google tidak ditemukan.');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password minimal 6 karakter.');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Konfirmasi password tidak sama.');
      return;
    }

    setSaving(true);
    try {
      await linkPassword(user.email, password);
      setPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      setLocalError(getAuthErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={() => {}}>
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.iconWrapper}>
            <ThemedText style={styles.iconEmoji}>🔐</ThemedText>
          </View>

          <ThemedText style={styles.title}>Buat Password</ThemedText>
          <ThemedText style={styles.subtitle}>
            Akun Google berhasil terdaftar. Buat password sekarang agar nanti bisa login
            dengan Google maupun email & password ke akun yang sama.
          </ThemedText>

          {displayError ? (
            <View style={styles.errorBox}>
              <ThemedText style={styles.errorText}>⚠️ {displayError}</ThemedText>
            </View>
          ) : null}

          <View style={styles.fieldGroup}>
            <ThemedText style={styles.fieldLabel}>Email</ThemedText>
            <View style={styles.emailBox}>
              <ThemedText style={styles.emailText}>{user?.email ?? '-'}</ThemedText>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <ThemedText style={styles.fieldLabel}>Password Baru</ThemedText>
            <View style={styles.passwordRow}>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={(value) => { setPassword(value); setLocalError(null); }}
                placeholder="Minimal 6 karakter"
                placeholderTextColor="#C0C4CF"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!saving}
              />
              <PasswordEye
                showPassword={showPassword}
                onPress={() => setShowPassword((prev) => !prev)}
                disabled={saving}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <ThemedText style={styles.fieldLabel}>Ulangi Password</ThemedText>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={(value) => { setConfirmPassword(value); setLocalError(null); }}
              placeholder="Ketik ulang password"
              placeholderTextColor="#C0C4CF"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!saving}
            />
          </View>

          <Pressable
            style={({ pressed }) => [styles.saveButton, { opacity: pressed || saving ? 0.8 : 1 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <ThemedText style={styles.saveButtonText}>Simpan Password</ThemedText>
            )}
          </Pressable>

          <Pressable
            style={styles.logoutButton}
            onPress={signOut}
            disabled={saving}
            hitSlop={8}
          >
            <ThemedText style={styles.logoutText}>Keluar dari akun</ThemedText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FC',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
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
  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: '#E8EDFF',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  iconEmoji: { fontSize: 36, lineHeight: 42 },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: Spacing.three,
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
  },
  errorText: { color: '#B91C1C', fontSize: 13 },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151' },
  emailBox: {
    backgroundColor: '#F1F3F9',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  emailText: { fontSize: 14, color: '#6B7280' },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F8FC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingRight: 12,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
  },
  passwordToggle: { paddingVertical: 6 },
  passwordToggleText: { color: ACCENT, fontSize: 12, fontWeight: '700' },
  input: {
    backgroundColor: '#F7F8FC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
  },
  saveButton: {
    backgroundColor: ACCENT,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  saveButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  logoutButton: { alignItems: 'center', paddingVertical: 6 },
  logoutText: { color: '#EF4444', fontSize: 13, fontWeight: '600' },
});
