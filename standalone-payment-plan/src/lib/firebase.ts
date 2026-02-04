import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBUTqMQPaWvSEYq-kVR198Zgvp_ZZUX3So',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'superapp-37db4.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'superapp-37db4',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'superapp-37db4.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '488411585201',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:488411585201:web:51a3138f763f1842156090',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-SJY3Z4VDPE'
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
