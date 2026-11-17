// src/app/index.tsx — Home Screen: Daftar Mahasiswa
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth-context';
import {
  addMahasiswa,
  deleteMahasiswa,
  Mahasiswa,
  MahasiswaInput,
  seedMahasiswaData,
  subscribeMahasiswa,
} from '@/lib/firestore';

const ACCENT = '#4F6EF7';
const BG = '#F7F8FC';
const CARD_BG = '#FFFFFF';
const CARD_RADIUS = 16;
const AVATAR_COLORS = ['#4F6EF7', '#7C3AED', '#059669', '#DC2626', '#D97706'];

function avatarColor(name: string) {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

// ─── Komponen Card Mahasiswa ─────────────────────────────────────────────────
function MahasiswaCard({
  item,
  canManage = false,
  onDelete,
}: {
  item: Mahasiswa;
  canManage?: boolean;
  onDelete: (id: string, nama: string) => void;
}) {
  const color = avatarColor(item.nama);
  return (
    <View style={styles.card}>
      <View style={[styles.cardAvatar, { backgroundColor: color }]}>
        <ThemedText style={styles.cardAvatarText}>
          {item.nama.charAt(0).toUpperCase()}
        </ThemedText>
      </View>
      <View style={styles.cardBody}>
        <ThemedText style={styles.cardNama}>{item.nama}</ThemedText>
        <ThemedText style={styles.cardSub}>NIM: {item.nim}</ThemedText>
        <View style={styles.cardTagRow}>
          <View style={[styles.cardTag, { backgroundColor: color + '18' }]}>
            <ThemedText style={[styles.cardTagText, { color }]}>{item.prodi}</ThemedText>
          </View>
          <View style={styles.cardTagYear}>
            <ThemedText style={styles.cardTagYearText}>{item.angkatan}</ThemedText>
          </View>
        </View>
        <ThemedText style={styles.cardEmail}>{item.email}</ThemedText>
      </View>
      {canManage ? (
        <Pressable
          onPress={() => onDelete(item.id, item.nama)}
          style={({ pressed }) => [styles.deleteBtn, { opacity: pressed ? 0.5 : 1 }]}
          hitSlop={10}
        >
          <View style={styles.deleteBtnInner}>
            <ThemedText style={styles.deleteBtnText}>✕</ThemedText>
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}

// ─── Modal Tambah Mahasiswa ───────────────────────────────────────────────────
function TambahModal({
  visible,
  onClose,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (data: MahasiswaInput) => Promise<void>;
}) {
  const [form, setForm] = useState<MahasiswaInput>({
    nim: '',
    nama: '',
    prodi: '',
    angkatan: new Date().getFullYear(),
    email: '',
  });
  const [saving, setSaving] = useState(false);

  const reset = () =>
    setForm({ nim: '', nama: '', prodi: '', angkatan: new Date().getFullYear(), email: '' });

  const handleSave = async () => {
    if (!form.nim || !form.nama || !form.prodi || !form.email) {
      Alert.alert('Validasi', 'Semua field wajib diisi!');
      return;
    }
    setSaving(true);
    try {
      await onSave(form);
      reset();
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        {/* Handle bar */}
        <View style={styles.modalHandle} />

        <View style={styles.modalHeader}>
          <View>
            <ThemedText style={styles.modalTitle}>Tambah Mahasiswa</ThemedText>
            <ThemedText style={styles.modalSubtitle}>Lengkapi data berikut</ThemedText>
          </View>
          <Pressable onPress={onClose} hitSlop={12} style={styles.modalCloseBtn}>
            <ThemedText style={styles.modalCloseText}>✕</ThemedText>
          </Pressable>
        </View>

        <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {[
            { label: 'NIM', key: 'nim', placeholder: 'Contoh: 22101001', keyboard: 'number-pad' as const },
            { label: 'Nama Lengkap', key: 'nama', placeholder: 'Nama lengkap mahasiswa', keyboard: 'default' as const },
            { label: 'Program Studi', key: 'prodi', placeholder: 'Contoh: Teknik Informatika', keyboard: 'default' as const },
            { label: 'Email', key: 'email', placeholder: 'email@student.ac.id', keyboard: 'email-address' as const },
          ].map((field) => (
            <View key={field.key} style={styles.fieldGroup}>
              <ThemedText style={styles.fieldLabel}>{field.label} *</ThemedText>
              <TextInput
                style={styles.input}
                value={field.key === 'nim' ? form.nim : field.key === 'nama' ? form.nama : field.key === 'prodi' ? form.prodi : form.email}
                onChangeText={(v) => setForm((f) => ({ ...f, [field.key]: v }))}
                placeholder={field.placeholder}
                placeholderTextColor="#C0C4CF"
                keyboardType={field.keyboard}
                autoCapitalize={field.keyboard === 'email-address' ? 'none' : 'words'}
              />
            </View>
          ))}

          <View style={styles.fieldGroup}>
            <ThemedText style={styles.fieldLabel}>Angkatan *</ThemedText>
            <TextInput
              style={styles.input}
              value={String(form.angkatan)}
              onChangeText={(v) => setForm((f) => ({ ...f, angkatan: parseInt(v) || f.angkatan }))}
              placeholder="Contoh: 2022"
              placeholderTextColor="#C0C4CF"
              keyboardType="number-pad"
            />
          </View>

          <Pressable
            style={({ pressed }) => [styles.saveBtn, { opacity: pressed || saving ? 0.8 : 1 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.saveBtnText}>💾  Simpan Data</ThemedText>
            )}
          </Pressable>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Home Screen ──────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { user, status, role, signOut } = useAuth();
  const [mahasiswaList, setMahasiswaList] = useState<Mahasiswa[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [imageError, setImageError] = useState(false);

  const canManage = role === 'super_admin';

  useEffect(() => {
    if (status !== 'authenticated') return;

    let active = true;

    if (canManage) {
      seedMahasiswaData().catch((e) => {
        console.warn('Seed error:', e);
      });
    }

    const unsubscribe = subscribeMahasiswa(
      (list) => {
        if (!active) return;
        setMahasiswaList(list);
        setLoading(false);
        setRefreshing(false);
      },
      (err) => {
        if (!active) return;
        console.error('Firestore error:', err);
        setLoadError(err.message);
        setLoading(false);
        setRefreshing(false);
      }
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, [status, canManage]);

  const handleDelete = (id: string, nama: string) => {
    if (!canManage) {
      const msg = 'Hanya Super Admin yang dapat menghapus data mahasiswa.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Akses Dibatasi', msg);
      return;
    }

    if (Platform.OS === 'web') {
      const confirmDelete = window.confirm(`Hapus data mahasiswa "${nama}"?`);
      if (confirmDelete) {
        deleteMahasiswa(id).catch((e: any) => {
          alert(e?.message ?? 'Gagal menghapus');
        });
      }
    } else {
      Alert.alert('Hapus Mahasiswa', `Hapus data "${nama}"?`, [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMahasiswa(id);
            } catch (e: any) {
              Alert.alert('Error', e?.message ?? 'Gagal menghapus');
            }
          },
        },
      ]);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const confirmLogout = window.confirm('Yakin ingin keluar dari akun?');
      if (confirmLogout) {
        signOut();
      }
    } else {
      Alert.alert('Logout', 'Yakin ingin keluar?', [
        { text: 'Batal', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: signOut },
      ]);
    }
  };

  const filteredList = mahasiswaList.filter(
    (m) =>
      m.nama.toLowerCase().includes(search.toLowerCase()) ||
      m.nim.includes(search) ||
      m.prodi.toLowerCase().includes(search.toLowerCase())
  );

  const angkatanCount = new Set(mahasiswaList.map((m) => m.angkatan)).size;

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {user?.photoURL && !imageError ? (
              <Image
                source={{ uri: user.photoURL }}
                style={styles.avatar}
                contentFit="cover"
                onError={() => setImageError(true)}
                // @ts-ignore web-specific prop to bypass Google 403 Forbidden
                referrerPolicy="no-referrer"
              />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: ACCENT }]}>
                <ThemedText style={styles.avatarInitial}>
                  {user?.displayName?.charAt(0) ?? 'U'}
                </ThemedText>
              </View>
            )}
            <View style={styles.headerInfo}>
              <ThemedText style={styles.headerGreet}>Selamat datang 👋</ThemedText>
              <View style={styles.headerNameRow}>
                <ThemedText style={styles.headerName} numberOfLines={1}>
                  {user?.displayName?.split(' ')[0] ?? 'User'}
                </ThemedText>
                {role === 'super_admin' ? (
                  <View style={[styles.roleBadge, styles.roleBadgeSuperAdmin]}>
                    <ThemedText style={[styles.roleBadgeText, styles.roleBadgeTextSuperAdmin]}>
                      Super Admin
                    </ThemedText>
                  </View>
                ) : (
                  <View style={[styles.roleBadge, styles.roleBadgeUser]}>
                    <ThemedText style={[styles.roleBadgeText, styles.roleBadgeTextUser]}>
                      User
                    </ThemedText>
                  </View>
                )}
              </View>
            </View>
          </View>
          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [styles.logoutBtn, { opacity: pressed ? 0.6 : 1 }]}
          >
            <ThemedText style={styles.logoutText}>Keluar</ThemedText>
          </Pressable>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Total', value: mahasiswaList.length, emoji: '👥' },
            { label: 'Tampil', value: filteredList.length, emoji: '🔍' },
            { label: 'Angkatan', value: angkatanCount, emoji: '🎓' },
          ].map((s, i) => (
            <View key={i} style={styles.statCard}>
              <ThemedText style={styles.statEmoji}>{s.emoji}</ThemedText>
              <ThemedText style={styles.statValue}>{s.value}</ThemedText>
              <ThemedText style={styles.statLabel}>{s.label}</ThemedText>
            </View>
          ))}
        </View>
      </SafeAreaView>

      {/* Search + Add */}
      <View style={styles.searchRow}>
        <View style={styles.searchInputWrapper}>
          <ThemedText style={styles.searchIcon}>🔎</ThemedText>
          <TextInput
            style={styles.searchInput}
            placeholder="Cari nama, NIM, atau prodi..."
            placeholderTextColor="#B0B4BF"
            value={search}
            onChangeText={setSearch}
          />
        </View>
        {canManage && (
          <Pressable
            style={({ pressed }) => [styles.addBtn, { opacity: pressed ? 0.85 : 1 }]}
            onPress={() => setShowModal(true)}
          >
            <ThemedText style={styles.addBtnText}>＋</ThemedText>
          </Pressable>
        )}
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={ACCENT} />
          <ThemedText style={styles.loadingText}>Memuat data...</ThemedText>
        </View>
      ) : loadError ? (
        <View style={styles.center}>
          <ThemedText style={styles.emptyEmoji}>⚠️</ThemedText>
          <ThemedText style={styles.emptyTitle}>Gagal memuat data</ThemedText>
          <ThemedText style={styles.emptySubtitle}>{loadError}</ThemedText>
        </View>
      ) : (
        <FlatList
          data={filteredList}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(true)} tintColor={ACCENT} />
          }
          renderItem={({ item }) => (
            <MahasiswaCard item={item} canManage={canManage} onDelete={handleDelete} />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <ThemedText style={styles.emptyEmoji}>{search ? '🔍' : '📭'}</ThemedText>
              <ThemedText style={styles.emptyTitle}>
                {search ? 'Tidak ada hasil' : 'Belum ada data'}
              </ThemedText>
              <ThemedText style={styles.emptySubtitle}>
                {search
                  ? 'Coba kata kunci lain'
                  : canManage
                  ? 'Ketuk ＋ untuk tambah mahasiswa'
                  : 'Data mahasiswa belum tersedia'}
              </ThemedText>
            </View>
          }
        />
      )}

      {canManage && (
        <TambahModal
          visible={showModal}
          onClose={() => setShowModal(false)}
          onSave={async (data) => {
            await addMahasiswa(data);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  // Header area
  headerSafe: { backgroundColor: '#fff', paddingBottom: 0 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    maxWidth: 760,
    width: '100%',
    alignSelf: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarPlaceholder: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { color: '#fff', fontWeight: '700', fontSize: 18 },
  headerGreet: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },
  headerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 2,
  },
  headerName: { fontSize: 17, fontWeight: '700', color: '#111827' },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'center',
  },
  roleBadgeSuperAdmin: {
    backgroundColor: '#F5F3FF',
    borderColor: '#DDD6FE',
  },
  roleBadgeUser: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  roleBadgeTextSuperAdmin: {
    color: '#7C3AED',
  },
  roleBadgeTextUser: {
    color: '#059669',
  },
  logoutBtn: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  logoutText: { color: '#EF4444', fontSize: 13, fontWeight: '600' },

  // Stats
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
    maxWidth: 760,
    width: '100%',
    alignSelf: 'center',
  },
  statCard: {
    flex: 1,
    backgroundColor: BG,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 2,
  },
  statEmoji: { fontSize: 18 },
  statValue: { fontSize: 20, fontWeight: '800', color: '#111827' },
  statLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },

  // Search
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    alignItems: 'center',
    maxWidth: 760,
    width: '100%',
    alignSelf: 'center',
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: { fontSize: 15 },
  searchInput: { flex: 1, fontSize: 14, color: '#111827' },
  addBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  addBtnText: { color: '#fff', fontSize: 22, fontWeight: '400', lineHeight: 26 },

  // List
  list: {
    paddingHorizontal: 16,
    paddingBottom: 110,
    paddingTop: 4,
    gap: 10,
    maxWidth: 760,
    width: '100%',
    alignSelf: 'center',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingText: { color: '#9CA3AF', fontSize: 14 },

  // Empty
  empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyEmoji: { fontSize: 52 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151' },
  emptySubtitle: { fontSize: 13, color: '#9CA3AF', textAlign: 'center' },

  // Card
  card: {
    backgroundColor: CARD_BG,
    borderRadius: CARD_RADIUS,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardAvatar: {
    width: 46, height: 46, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  cardAvatarText: { color: '#fff', fontWeight: '800', fontSize: 18 },
  cardBody: { flex: 1, gap: 3 },
  cardNama: { fontWeight: '700', fontSize: 15, color: '#111827' },
  cardSub: { fontSize: 12, color: '#9CA3AF' },
  cardTagRow: { flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 2 },
  cardTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  cardTagText: { fontSize: 11, fontWeight: '600' },
  cardTagYear: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  cardTagYearText: { fontSize: 11, color: '#6B7280', fontWeight: '600' },
  cardEmail: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  deleteBtn: { paddingTop: 2 },
  deleteBtnInner: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: { color: '#EF4444', fontSize: 12, fontWeight: '700' },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#F7F8FC',
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
  },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#111827' },
  modalSubtitle: { fontSize: 13, color: '#9CA3AF', marginTop: 2 },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: { color: '#6B7280', fontSize: 13, fontWeight: '700' },
  modalScroll: { paddingHorizontal: 24 },

  fieldGroup: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: '#111827',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },

  saveBtn: {
    backgroundColor: ACCENT,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16, letterSpacing: 0.3 },
});
