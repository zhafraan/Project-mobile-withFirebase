// src/app/explore.tsx — Explore: Info Aplikasi & Panduan Firebase
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ExternalLink } from '@/components/external-link';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';

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
  const { user } = useAuth();
  const theme = useTheme();

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
            <ThemedText style={styles.accountName}>{user?.displayName ?? '-'}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">{user?.email ?? '-'}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 4 }}>UID: {user?.uid ?? '-'}</ThemedText>
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
    padding: Spacing.three, borderRadius: 12, gap: 2,
  },
  accountName: { fontWeight: '700', fontSize: 18, marginVertical: 2 },
});
