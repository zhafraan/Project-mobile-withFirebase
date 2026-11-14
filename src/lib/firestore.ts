// src/lib/firestore.ts
import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  getDocs,
  doc,
  onSnapshot,
  query,
  limit,
  writeBatch,
  serverTimestamp,
  type Timestamp,
} from '@react-native-firebase/firestore';

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

function getMahasiswaRef() {
  const db = getFirestore();
  return collection(db, COLLECTION);
}

/** Subscribe realtime ke daftar mahasiswa (diurutkan berdasarkan nama di client) */
export function subscribeMahasiswa(
  onData: (list: Mahasiswa[]) => void,
  onError?: (error: Error) => void
): () => void {
  const ref = getMahasiswaRef();
  // Tanpa orderBy agar tidak butuh index Firestore
  const q = query(ref);

  return onSnapshot(
    q,
    (snapshot) => {
      const list: Mahasiswa[] = snapshot.docs
        .map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<Mahasiswa, 'id'>),
        }))
        // Sort di client side
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

/** Hapus mahasiswa berdasarkan id */
export async function deleteMahasiswa(id: string): Promise<void> {
  const db = getFirestore();
  const docRef = doc(db, COLLECTION, id);
  await deleteDoc(docRef);
}

/** Seed data awal (jalankan sekali jika collection kosong atau masih berisi data lama) */
export async function seedMahasiswaData(): Promise<void> {
  const ref = getMahasiswaRef();
  const snapshot = await getDocs(ref);

  const containsOldData = snapshot.docs.some(
    (d) => (d.data() as any).nama === 'Andi Pratama' || (d.data() as any).nim === '22101001'
  );

  if (snapshot.empty || containsOldData) {
    const dataAwal: MahasiswaInput[] = [
      { nim: '2406012400015', nama: 'Darrell Nathan Wijaya', prodi: 'Informatika', angkatan: 2024, email: 'darrell.nathan@students.ac.id' },
      { nim: '2406012400028', nama: 'Clarissa Aurelia', prodi: 'Informatika', angkatan: 2024, email: 'clarissa.aurelia@students.ac.id' },
      { nim: '2406012400042', nama: 'Kenzo Raditya Pratama', prodi: 'Informatika', angkatan: 2024, email: 'kenzo.raditya@students.ac.id' },
      { nim: '2406012400057', nama: 'Felicia Amanda Putri', prodi: 'Sistem Informasi', angkatan: 2024, email: 'felicia.amanda@students.ac.id' },
      { nim: '2406012400073', nama: 'Gavin Matthew Siregar', prodi: 'Informatika', angkatan: 2024, email: 'gavin.matthew@students.ac.id' },
    ];

    const db = getFirestore();
    const batch = writeBatch(db);

    if (containsOldData) {
      snapshot.docs.forEach((d) => batch.delete(d.ref));
    }

    dataAwal.forEach((m) => {
      const docRef = doc(collection(db, COLLECTION));
      batch.set(docRef, { ...m, createdAt: serverTimestamp() });
    });
    await batch.commit();
  }
}
