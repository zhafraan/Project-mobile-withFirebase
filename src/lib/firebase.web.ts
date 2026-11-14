// src/lib/firebase.web.ts
// Firebase JS SDK — dipakai khusus di platform WEB
// Metro/Expo otomatis pilih file ini saat build web

import { getApps, initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: 'REDACTED_FIREBASE_WEB_API_KEY',
  authDomain: 'tugas2-ppk.firebaseapp.com',
  projectId: 'tugas2-ppk',
  storageBucket: 'tugas2-ppk.firebasestorage.app',
  messagingSenderId: '968546395061',
  appId: '1:968546395061:web:e946ebddbed42d7ecd2ffc',
};

export const firebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
