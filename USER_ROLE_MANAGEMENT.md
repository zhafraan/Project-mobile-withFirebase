 # User Role Management — Langkah Pengerjaan & Skenario Pengujian

Dokumen ini menjelaskan rencana implementasi **role management** (termasuk Super Admin) dan **penyatuan akun Google + Email/Password dengan email yang sama**, serta skenario pengujiannya.

---

## 1. Konsep Penting (Baca Dulu)

Firebase Authentication **tidak otomatis menggabungkan** dua metode login hanya karena emailnya sama.

- Setiap akun Firebase diidentifikasi oleh `uid`.
- Google dan Email/Password adalah **provider** yang berbeda.
- Agar dua metode login menghasilkan **akun yang sama**, kedua provider harus **di-link** ke satu `uid` yang sama.
- Role disimpan per `uid` di Firestore (`users/{uid}`). Jadi setelah ter-link, login dengan metode apa pun akan mendapat role yang sama.

Kalau provider belum di-link:

- Login metode kedua akan gagal dengan error `auth/account-exists-with-different-credential` (setting **One account per email address** aktif), atau
- Jika setting tersebut dimatikan, Firebase bisa membuat `uid` berbeda → role bisa berbeda. Ini **tidak sesuai ekspektasi**.

Kesimpulan: ekspektasi "login Google dan login Email/Password dengan email yang sama masuk ke akun dan role yang sama" **hanya terpenuhi setelah proses linking**.

---

## 2. Kondisi Kode Saat Ini

> Status: langkah inti sudah diimplementasikan (login email/password, linking password,
> profil `users/{uid}`, role di context/UI, modal wajib "Buat Password" setelah login Google,
> dan `firestore.rules`). Deploy rules bisa lewat Console atau `npx firebase-tools deploy
> --only firestore:rules` (sudah ada `firebase.json` + `.firebaserc`). Seed Super Admin
> tetap manual lewat Console (lihat bagian 6.0).

| Area | Status |
|---|---|
| Login Google | Sudah ada (native: `@react-native-google-signin`, web: popup) |
| Login Email/Password | Sudah ada |
| Linking provider | Otomatis lewat modal "Buat Password" setelah login Google (arah sebaliknya masih manual) |
| Koleksi `users` + role | Sudah ada (`src/lib/users.ts`, `src/lib/users.web.ts`) |
| Role di UI | Sudah ada (badge di `explore.tsx`) |
| Deploy rules | `firebase.json` + `.firebaserc` tersedia; publish via Console atau CLI |
| `firebase` (JS SDK) | Sudah menjadi dependency langsung |
| Typecheck | Lulus (`npx tsc --noEmit`) |

File utama yang akan diubah:

- `src/lib/auth.ts` (native)
- `src/lib/auth.web.ts` (web)
- `src/context/auth-context.tsx` (native)
- `src/context/auth-context.web.tsx` (web)
- `src/app/login.tsx`
- `src/app/explore.tsx`
- `src/components/password-setup-modal.tsx`
- Baru: `src/lib/users.ts`, `src/lib/users.web.ts`, `firestore.rules`

---

## 3. Prasyarat & Konfigurasi Firebase Console

1. Buka **Firebase Console → Authentication → Sign-in method**.
   - Aktifkan **Google**.
   - Aktifkan **Email/Password**.
2. Buka **Authentication → Settings**.
   - Pastikan **One account per email address** aktif (default).
   - Opsional: aktifkan **Email enumeration protection**. Jika aktif, jangan mengandalkan `fetchSignInMethodsForEmail`.
3. Tentukan satu email Super Admin, misalnya email Google milikmu.
4. Pastikan `google-services.json` dan `.env` lokal masih tersedia (sudah di-ignore dari Git).

---

## 4. Langkah Pengerjaan

### Langkah 1 — Model Data Role

Buat collection `users` dengan dokumen `users/{uid}`:

```json
{
  "uid": "UID_FIREBASE",
  "email": "user@gmail.com",
  "displayName": "Nama User",
  "photoURL": "https://...",
  "role": "super_admin",
  "providers": ["google.com", "password"],
  "createdAt": "<serverTimestamp>",
  "lastLoginAt": "<serverTimestamp>"
}
```

Nilai role:

```ts
type UserRole = 'super_admin' | 'admin' | 'user';
```

**Bootstrap Super Admin:** login Google sekali, lalu buka Firestore Console dan set `role: "super_admin"` pada doc `users/{uid}` milik email tersebut. Jangan izinkan client menulis role sendiri.

### Langkah 2 — Security Rules

Contoh `firestore.rules` (sesuaikan dengan rules lain yang sudah ada):

```js
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() {
      return request.auth != null;
    }

    function isSuperAdmin() {
      return isSignedIn()
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'super_admin';
    }

    function isAdmin() {
      return isSignedIn()
        && (
          get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
          || isSuperAdmin()
        );
    }

    match /users/{uid} {
      // User boleh baca profil sendiri, Super Admin boleh baca semua
      allow read: if isSignedIn() && (request.auth.uid == uid || isSuperAdmin());

      // Profil baru selalu role 'user'; Super Admin di-seed manual dari console
      allow create: if isSignedIn()
        && request.auth.uid == uid
        && request.resource.data.uid == uid
        && request.resource.data.role == 'user';

      // User boleh update profil sendiri asal role tidak berubah
      allow update: if isSuperAdmin()
        || (isSignedIn()
          && request.auth.uid == uid
          && request.resource.data.role == resource.data.role);

      allow delete: if isSuperAdmin();
    }

    // Data mahasiswa: Semua user yang login boleh membaca (view-only),
    // hanya Admin dan Super Admin yang boleh menambah, mengubah, atau menghapus
    match /mahasiswa/{id} {
      allow read: if isSignedIn();
      allow create, update, delete: if isAdmin();
    }
  }
}
```

Catatan:

- Untuk produksi, role sebaiknya memakai **custom claims** lewat Admin SDK/Cloud Functions supaya tidak perlu `get()` di rules.
- Untuk tugas kuliah, seed manual dari console sudah cukup.

### Langkah 3 — Dependency

```bash
npx expo install firebase
```

Ini menjadikan `firebase` dependency langsung (dipakai oleh `firebase.web.ts`).

### Langkah 4 — Auth Library

#### 4a. Native (`src/lib/auth.ts`)

Tambahkan fungsi berikut (pakai modular API React Native Firebase v27):

```ts
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  linkWithCredential,
  signInWithEmailAndPassword,
  signInWithCredential,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  getAuth,
} from '@react-native-firebase/auth';

/** Login Email/Password */
export async function signInWithEmailPassword(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  return signInWithEmailAndPassword(getAuth(), normalized, password);
}

/** Registrasi Email/Password (opsional) */
export async function registerWithEmailPassword(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  return createUserWithEmailAndPassword(getAuth(), normalized, password);
}

/** Tambahkan password ke akun yang sedang login (mis. setelah login Google) */
export async function linkPasswordToCurrentUser(email: string, password: string) {
  const auth = getAuth();
  const current = auth.currentUser;
  if (!current) throw new Error('Harus login terlebih dahulu');

  const credential = EmailAuthProvider.credential(email.trim().toLowerCase(), password);
  return linkWithCredential(current, credential);
}

export async function sendResetPassword(email: string) {
  return sendPasswordResetEmail(getAuth(), email.trim().toLowerCase());
}
```

#### 4b. Web (`src/lib/auth.web.ts`)

```ts
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  linkWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';

export async function signInWithEmailPassword(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  return signInWithEmailAndPassword(getAuth(), normalized, password);
}

export async function registerWithEmailPassword(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  return createUserWithEmailAndPassword(getAuth(), normalized, password);
}

export async function linkPasswordToCurrentUser(email: string, password: string) {
  const auth = getAuth();
  if (!auth.currentUser) throw new Error('Harus login terlebih dahulu');

  const credential = EmailAuthProvider.credential(email.trim().toLowerCase(), password);
  return linkWithCredential(auth.currentUser, credential);
}

export async function linkGoogleToCurrentUser() {
  const auth = getAuth();
  if (!auth.currentUser) throw new Error('Harus login terlebih dahulu');

  const provider = new GoogleAuthProvider();
  provider.addScope('profile');
  provider.addScope('email');
  return linkWithPopup(auth.currentUser, provider);
}

export async function sendResetPassword(email: string) {
  return sendPasswordResetEmail(getAuth(), email.trim().toLowerCase());
}
```

#### 4c. Menangani `account-exists-with-different-credential`

Error ini muncul ketika email sudah terdaftar dengan provider lain.

**Urutan A — Google dulu, lalu menambahkan password**

1. Login Google.
2. Panggil `linkPasswordToCurrentUser(email, password)`.
3. Logout, lalu login Email/Password → `uid` tetap sama.

**Urutan B — Email/Password dulu, lalu login Google**

1. `signInWithPopup` / `signInWithCredential` gagal dengan `auth/account-exists-with-different-credential`.
2. Ambil email dari error dan minta password pengguna.
3. `signInWithEmailAndPassword(email, password)`.
4. `linkWithCredential(auth.currentUser, googleCredential)`.
5. Simpan dan gunakan `uid` yang sama.

Catatan web: ambil credential Google yang tertunda dengan:

```ts
import { GoogleAuthProvider } from 'firebase/auth';

const pendingCredential = GoogleAuthProvider.credentialFromError(error);
```

Catatan native: karena login Google memakai `@react-native-google-signin`, `idToken` sudah didapat lebih dulu. Setelah `signInWithEmailAndPassword` berhasil, panggil:

```ts
const googleCredential = GoogleAuthProvider.credential(idToken);
await linkWithCredential(getAuth().currentUser!, googleCredential);
```

**Penting:** jangan memakai `createUserWithEmailAndPassword` untuk email yang sudah punya akun Google. Itu akan gagal atau membuat akun terpisah.

### Langkah 5 — Service Profil User

Buat `src/lib/users.ts` (native) dan `src/lib/users.web.ts` (web) dengan API yang sama:

```ts
export async function ensureUserProfile(fbUser: {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  providerData: { providerId: string }[];
}): Promise<void> {
  // 1. Baca users/{uid}
  // 2. Jika belum ada: set { uid, email (lowercase), displayName, photoURL,
  //    role: 'user', providers, createdAt, lastLoginAt }
  // 3. Jika sudah ada: update displayName, photoURL, providers, lastLoginAt
  //    JANGAN menimpa role.
}

export function subscribeUserProfile(
  uid: string,
  onData: (profile: UserProfile | null) => void,
  onError?: (error: Error) => void
): () => void {
  // onSnapshot(doc(db, 'users', uid), ...)
}
```

Aturan:

- Jangan menyimpan `role` di AsyncStorage/localStorage sebagai sumber kebenaran.
- Role selalu dibaca dari Firestore.
- `providers` diambil dari `fbUser.providerData.map(p => p.providerId)`.

### Langkah 6 — Auth Context

Ubah `src/context/auth-context.tsx` dan `src/context/auth-context.web.tsx`:

1. Setelah `onAuthStateChanged` menerima `fbUser`:
   - Panggil `ensureUserProfile(fbUser)`.
   - Subscribe ke `users/{uid}`.
   - Set `role` dan `isSuperAdmin`.
2. Tambahkan ke `AuthContextValue`:

```ts
type AuthContextValue = {
  user: AuthUser | null;
  firebaseUser: FirebaseUser | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  role: UserRole | null;
  isSuperAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmailPassword: (email: string, password: string) => Promise<void>;
  linkPassword: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
};
```

3. Status `loading` ditahan sampai profil Firestore selesai dibaca agar UI tidak sempat menampilkan role yang salah.
4. Normalisasi error Firebase ke pesan Indonesia, misalnya:
   - `auth/invalid-credential` → "Email atau password salah."
   - `auth/user-not-found` → "Akun tidak ditemukan."
   - `auth/account-exists-with-different-credential` → "Email ini sudah terdaftar dengan metode lain. Masuk dengan metode tersebut lalu hubungkan."
   - `auth/too-many-requests` → "Terlalu banyak percobaan. Coba lagi nanti."

### Langkah 7 — UI

1. `src/app/login.tsx`
   - Tambah form Email + Password (toggle/tab: Google | Email).
   - Tombol submit, loading state, show/hide password.
   - Tampilkan error yang ramah.
   - Opsional: link "Lupa password".
2. `src/app/explore.tsx`
   - Tampilkan badge role (`Super Admin` / `Admin` / `User`).
   - Tampilkan provider yang ter-link.
   - Tombol **"Atur Password"** jika provider `password` belum ada (memanggil `linkPassword`).
3. Opsional: halaman `src/app/users.tsx` khusus Super Admin
   - Daftar user + ubah role.
   - Guard UI **dan** Firestore rules.

### Langkah 8 — Verifikasi Teknis

```bash
npx tsc --noEmit
npx expo lint
npx expo-doctor
```

Perbaiki juga error lama `dataAwal` di `src/lib/firestore.web.ts:109` sebelum pengujian.

---

## 5. Alur Linking yang Benar

### Skenario yang diminta (Google → Email/Password)

```text
Login Google (email X)
        |
        v
uid = UID-123, role = super_admin
        |
        v
Menu Akun -> "Atur Password" (linkPasswordToCurrentUser)
   (otomatis muncul sebagai modal "Buat Password" setelah login Google)
        |
        v
uid tetap UID-123, providers = [google.com, password]
        |
        v
Logout -> Login Email/Password (email X)
        |
        v
uid tetap UID-123, role tetap super_admin
```

Tanpa langkah "Atur Password", login Email/Password untuk email X akan gagal (akun password belum ada / konflik provider). Ini bukan bug, melainkan perilaku Firebase.

---

## 6. Skenario Pengujian

### 6.0 Setup Super Admin (sekali saja)

1. **Aktifkan provider** di Firebase Console → Authentication → Sign-in method:
   - Google: aktif.
   - Email/Password: aktif.
   - Authentication → Settings → **One account per email address**: aktif.
2. **Deploy Firestore rules** (pilih salah satu):
   - Console: Firestore Database → Rules → tempel isi `firestore.rules` → **Publish**.
   - CLI: `npx firebase-tools deploy --only firestore:rules` (memakai `firebase.json`
     dan `.firebaserc` yang sudah disediakan, project `tugas2-ppk`).
   - Pastikan Firestore Database sudah dibuat (bukan hanya project-nya).
3. **Login pertama dengan Google** memakai email yang akan dijadikan Super Admin.
4. Saat modal **"Buat Password"** muncul, isi password (minimal 6 karakter) lalu simpan.
   Modal ini wajib dan otomatis me-link provider `password` ke UID Google tersebut.
   Setelah selesai, `providers` di `users/{uid}` berisi `google.com` + `password`.
5. Buka Firebase Console → **Authentication → Users**, salin **User UID** untuk email
   tersebut. Pastikan hanya ada **satu** user dengan email itu.
6. Buka **Firestore Database → users → dokumen dengan ID = UID tadi**, ubah field
   `role` menjadi `super_admin` (dokumen `users/{uid}` dibuat otomatis saat login
   pertama; jika belum ada, tunggu beberapa detik lalu refresh).
7. **Logout**, lalu login lagi memakai **email & password** yang baru dibuat.
8. Verifikasi di tab **Info**: UID harus sama, badge role **Super Admin**, dan provider
   berisi Google + Email/Password.

> Catatan: kalau email tersebut sudah pernah dibuat sebagai akun Email/Password sebelum
> tes, login Google akan gagal dengan `auth/account-exists-with-different-credential`.
> Hapus akun lama itu di Authentication → Users (atau pakai email Google lain), lalu
> ulangi langkah 3. Firebase tidak menggabungkan dua akun yang sudah terlanjur terpisah.

### 6.1 Prasyarat Pengujian

- Provider Google dan Email/Password aktif.
- **One account per email address** aktif.
- Rules pada langkah 6.0 sudah dipublish.
- Email Super Admin: `________________` (isi sebelum tes).
- Doc `users/{uid}` email Super Admin sudah berisi `role: "super_admin"`.
- Aplikasi diuji di web dan build native (minimal satu).

### 6.2 Skenario Utama

| ID | Skenario | Prasyarat | Langkah | Ekspektasi |
|---|---|---|---|---|
| TC-01 | Login Google pertama kali | Email X belum punya akun | Login dengan Google email X, lalu isi modal **Buat Password** | Berhasil masuk; doc `users/{uid}` terbentuk; `providers` berisi `google.com` + `password` |
| TC-02 | Role Super Admin terbaca | Doc `users/{uid}` email X sudah diubah ke `super_admin` (langkah 6.0) | Logout → login Google email X | UI menampilkan badge **Super Admin** |
| TC-03 | Cek hasil linking | TC-01 berhasil | Buka Firestore → `users/{uid}` | `providers` berisi `google.com` dan `password`; **UID tidak berubah** |
| TC-04 | Login Email/Password dengan email sama | TC-01 & TC-02 berhasil | Logout → login Email/Password email X + password | Masuk ke **UID yang sama**; role tetap **Super Admin** |
| TC-05 | Login Google setelah linking | TC-01 berhasil | Logout → login Google email X | **UID sama**; role tetap **Super Admin** |
| TC-06 | Ganti metode bolak-balik | TC-01 berhasil | Logout → Email/Password → logout → Google → logout → Email/Password | Semua login menghasilkan UID yang sama dan role yang sama |
| TC-07 | Auto-login setelah restart | Sedang login | Tutup aplikasi, buka lagi | Sesi tetap; role dibaca dari Firestore, bukan cache lokal |
| TC-08 | Registrasi Email/Password baru | Email Y belum terdaftar | Daftar dengan email Y + password | Akun baru dibuat; role default `user`; tidak ada akses Super Admin |

### 6.3 Skenario Negatif & Edge Case

| ID | Skenario | Langkah | Ekspektasi |
|---|---|---|---|
| TC-09 | Email/Password sebelum linking | Login Email/Password email X saat akun X masih Google-only | Gagal dengan pesan jelas (akun password belum ada); **tidak** membuat akun/UID baru |
| TC-10 | Konflik provider terbalik | Akun password email Z sudah ada, lalu login Google email Z | Error `account-exists-with-different-credential`; setelah alur linking berhasil, UID sama |
| TC-11 | Password salah | Login Email/Password dengan password salah | Error "Email atau password salah"; tidak ada sesi baru |
| TC-12 | Email tidak terdaftar | Login Email/Password email acak | Error yang jelas; tidak ada akun baru (karena bukan registrasi) |
| TC-13 | Role escalation | User biasa mencoba update `role` di doc `users/{uid}` langsung ke Firestore | Ditolak security rules |
| TC-14 | Akses data user lain | User biasa mencoba membaca `users/{uid-lain}` | Ditolak security rules |
| TC-15 | Super Admin ubah role user | Super Admin mengubah role user lain lewat UI/console | Berhasil; user tersebut melihat role baru setelah refresh |
| TC-16 | Normalisasi email | Login dengan `User@Gmail.com` dan spasi di awal/akhir | Tetap mengarah ke akun yang sama (email di-lowercase & trim) |
| TC-17 | Logout | Tekan logout | Sesi Firebase dan Google Sign-In (native) terhapus; kembali ke halaman login |
| TC-18 | Bukan Super Admin | Login akun Google lain | Tidak melihat menu role management; akses langsung ditolak |
| TC-19 | Unlink provider (opsional) | Lepas provider Google dari akun | Login password tetap bisa; login Google kembali akan membuat UID baru (perilaku Firebase) |
| TC-20 | Konsistensi web vs native | Ulangi TC-01 s.d. TC-06 di web dan native | Hasil sama; UID dan role identik |

### 6.4 Cara Verifikasi

1. Buka **Firebase Console → Authentication → Users**.
   - Catat `uid` akun email X.
   - Pastikan hanya ada **satu** user dengan email X.
2. Buka **Firestore → users → dokumen UID tersebut**.
   - Pastikan `role == "super_admin"`.
   - Pastikan `providers` berisi `google.com` dan `password` setelah linking.
3. Di aplikasi:
   - Halaman Explore menampilkan UID, role, dan provider.
   - Bandingkan UID sebelum dan sesudah berganti metode login.

### 6.5 Template Hasil Pengujian

| ID | Tanggal | Platform | Hasil (PASS/FAIL) | Catatan |
|---|---|---|---|---|
| TC-01 | | | | |
| TC-02 | | | | |
| TC-03 | | | | |
| TC-04 | | | | |
| TC-05 | | | | |
| TC-06 | | | | |
| TC-07 | | | | |
| TC-08 | | | | |
| TC-09 | | | | |
| TC-10 | | | | |
| TC-11 | | | | |
| TC-12 | | | | |
| TC-13 | | | | |
| TC-14 | | | | |
| TC-15 | | | | |
| TC-16 | | | | |
| TC-17 | | | | |
| TC-18 | | | | |
| TC-19 | | | | |
| TC-20 | | | | |

---

## 7. Definisi Selesai (Acceptance Criteria)

- [ ] `firestore.rules` sudah dipublish ke project `tugas2-ppk`.
- [ ] Login Google berfungsi di native dan web.
- [ ] Modal **Buat Password** muncul otomatis setelah login Google pertama kali.
- [ ] Login Email/Password berfungsi di native dan web.
- [ ] Password dapat di-link ke akun Google dari halaman Akun.
- [ ] Setelah linking, login Google dan Email/Password menghasilkan `uid` yang sama.
- [ ] `users/{uid}.role` konsisten di kedua metode login.
- [ ] Super Admin dapat mengelola role user lain (opsional).
- [ ] User biasa tidak dapat mengubah role sendiri.
- [ ] Role tidak diambil dari AsyncStorage/localStorage.
- [ ] `npx tsc --noEmit` dan `npx expo lint` tidak menambah error baru.

---

## 8. Referensi

- Expo Environment Variables: https://docs.expo.dev/guides/environment-variables/
- Expo Dynamic App Config: https://docs.expo.dev/workflow/configuration/
- React Native Firebase Auth (modular API): https://rnfirebase.io/auth/usage
- Firebase Account Linking (Web): https://firebase.google.com/docs/auth/web/account-linking
- Firebase Auth Error Codes: https://firebase.google.com/docs/reference/js/auth#autherrorcodes
- Firestore Security Rules: https://firebase.google.com/docs/firestore/security/get-started
