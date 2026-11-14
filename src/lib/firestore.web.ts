// src/lib/firestore.web.ts
// Implementasi Firestore khusus WEB — pakai Firebase JS SDK
// Metro otomatis pilih file ini saat `expo start --web`

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';

import { firebaseApp } from './firebase.web';

export interface Mahasiswa {
  id: string;
  nim: string;
  nama: string;
  prodi: string;
  angkatan: number;
  email: string;
  createdAt: Timestamp | null;
}

export interface MahasiswaInput {
  nim: string;
  nama: string;
  prodi: string;
  angkatan: number;
  email: string;
}

const COLLECTION = 'mahasiswa';

function getDb() {
  return getFirestore(firebaseApp);
}

function getMahasiswaRef() {
  return collection(getDb(), COLLECTION);
}

/** Subscribe realtime — sort by nama di client */
export function subscribeMahasiswa(
  onData: (list: Mahasiswa[]) => void,
  onError?: (error: Error) => void
): () => void {
  const ref = getMahasiswaRef();
  const q = query(ref);

  return onSnapshot(
    q,
    (snapshot) => {
      const list: Mahasiswa[] = snapshot.docs
        .map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<Mahasiswa, 'id'>),
        }))
        .sort((a, b) => a.nama.localeCompare(b.nama, 'id'));
      onData(list);
    },
    (error) => onError?.(error as Error)
  );
}

/** Tambah mahasiswa baru */
export async function addMahasiswa(data: MahasiswaInput): Promise<string> {
  const ref = getMahasiswaRef();
  const docRef = await addDoc(ref, {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

/** Hapus mahasiswa */
export async function deleteMahasiswa(id: string): Promise<void> {
  const db = getDb();
  await deleteDoc(doc(db, COLLECTION, id));
}

/** Seed data awal jika collection kosong atau masih berisi data lama */
export async function seedMahasiswaData(): Promise<void> {
  const ref = getMahasiswaRef();
  const snapshot = await getDocs(ref);
  
  // Cek apakah masih ada data lama (contoh: "Andi Pratama" / NIM "22101001")
  const containsOldData = snapshot.docs.some(
    (d) => d.data().nama === 'Andi Pratama' || d.data().nim === '22101001'
  );

  if (snapshot.empty || containsOldData) {
    const db = getDb();
    const batch = writeBatch(db);

    // Hapus data lama agar diganti data baru
    if (containsOldData) {
      snapshot.docs.forEach((d) => batch.delete(d.ref));
    }

    // Tulis 5 mahasiswa baru yang modern
    dataAwal.forEach((m) => {
      const docRef = doc(collection(db, COLLECTION));
      batch.set(docRef, { ...m, createdAt: serverTimestamp() });
    });

    await batch.commit();
  }
}

