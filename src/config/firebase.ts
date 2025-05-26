import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
    apiKey: "AIzaSyBUTqMQPaWvSEYq-kVR198Zgvp_ZZUX3So",
    authDomain: "superapp-37db4.firebaseapp.com",
    projectId: "superapp-37db4",
    storageBucket: "superapp-37db4.appspot.com",
    messagingSenderId: "488411585201",
    appId: "1:488411585201:web:51a3138f763f1842156090",
    measurementId: "G-SJY3Z4VDPE"
};

// Firebase'i başlat
export const app = initializeApp(firebaseConfig);

// Firestore ve Auth servislerini başlat
export const db = getFirestore(app);
export const auth = getAuth(app);

// Analytics'i başlat (sadece tarayıcıda)
if (typeof window !== 'undefined') {
  const analytics = getAnalytics(app);
} 