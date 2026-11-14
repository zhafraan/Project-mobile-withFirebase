// src/lib/firebase.ts
// Firebase sudah diinisialisasi otomatis oleh @react-native-firebase/app
// File ini hanya re-export convenience untuk dipakai di seluruh app

export { getAuth } from '@react-native-firebase/auth';
export { getFirestore, collection } from '@react-native-firebase/firestore';
