// src/lib/auth-errors.ts
// Pemetaan error Firebase Auth ke pesan yang ramah pengguna

type FirebaseLikeError = {
  code?: string;
  message?: string;
};

export function getAuthErrorMessage(error: unknown): string {
  const e = (error ?? {}) as FirebaseLikeError;

  switch (e.code) {
    case 'auth/invalid-email':
      return 'Format email tidak valid.';
    case 'auth/missing-password':
      return 'Password wajib diisi.';
    case 'auth/weak-password':
      return 'Password minimal 6 karakter.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Email atau password salah.';
    case 'auth/user-disabled':
      return 'Akun ini dinonaktifkan.';
    case 'auth/email-already-in-use':
    case 'auth/credential-already-in-use':
      return 'Email ini sudah terhubung ke akun lain.';
    case 'auth/provider-already-linked':
      return 'Metode login ini sudah terhubung ke akun kamu.';
    case 'auth/account-exists-with-different-credential':
      return 'Email ini sudah terdaftar dengan metode login lain. Masuk dengan metode tersebut lalu hubungkan akun.';
    case 'auth/requires-recent-login':
      return 'Sesi kamu sudah lama. Silakan logout lalu login ulang.';
    case 'auth/too-many-requests':
      return 'Terlalu banyak percobaan. Coba lagi nanti.';
    case 'auth/network-request-failed':
      return 'Koneksi internet bermasalah. Coba lagi.';
    case 'auth/operation-not-allowed':
      return 'Metode login ini belum diaktifkan di Firebase Console.';
    default:
      return e.message ?? 'Terjadi kesalahan. Coba lagi.';
  }
}
